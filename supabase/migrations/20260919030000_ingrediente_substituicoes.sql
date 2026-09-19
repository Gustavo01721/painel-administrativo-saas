-- Regras de substituicao de ingredientes por loja.
CREATE TABLE IF NOT EXISTS public.ingrediente_substituicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  ingrediente_id uuid NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  substituto_id uuid NOT NULL REFERENCES public.estoque(id) ON DELETE CASCADE,
  quantidade_substituta numeric NOT NULL CHECK (quantidade_substituta > 0),
  ajuste_preco numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ingrediente_id <> substituto_id),
  UNIQUE (store_id, ingrediente_id, substituto_id)
);

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS substituicoes jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.ingrediente_substituicoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manage_ingredient_substitutions" ON public.ingrediente_substituicoes;
CREATE POLICY "manage_ingredient_substitutions" ON public.ingrediente_substituicoes
  FOR ALL USING (has_role(auth.uid(), 'owner'::app_role, store_id) OR has_role(auth.uid(), 'manager'::app_role, store_id))
  WITH CHECK (has_role(auth.uid(), 'owner'::app_role, store_id) OR has_role(auth.uid(), 'manager'::app_role, store_id));

DROP POLICY IF EXISTS "read_ingredient_substitutions" ON public.ingrediente_substituicoes;
CREATE POLICY "read_ingredient_substitutions" ON public.ingrediente_substituicoes
  FOR SELECT USING (has_role(auth.uid(), 'operator'::app_role, store_id));

CREATE INDEX IF NOT EXISTS idx_ingrediente_substituicoes_store ON public.ingrediente_substituicoes(store_id);
CREATE INDEX IF NOT EXISTS idx_ingrediente_substituicoes_ingrediente ON public.ingrediente_substituicoes(ingrediente_id);
ALTER TABLE public.ingrediente_substituicoes REPLICA IDENTITY FULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ingrediente_substituicoes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ingrediente_substituicoes;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.check_menu_stock(p_store_id uuid, p_menu_item_ids uuid[] DEFAULT NULL)
RETURNS TABLE(menu_item_id uuid, menu_item_name text, ingrediente_id uuid, ingrediente_nome text, substituto_id uuid, substituto_nome text, quantidade_substituta numeric, ajuste_preco numeric)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.id, m.nome, e.id, e.nome, s.substituto_id, es.nome, s.quantidade_substituta, s.ajuste_preco
  FROM public.menu_items m
  JOIN public.receita_itens r ON r.menu_item_id = m.id AND r.store_id = p_store_id
  JOIN public.estoque e ON e.id = r.estoque_id AND e.store_id = p_store_id
  LEFT JOIN LATERAL (
    SELECT x.* FROM public.ingrediente_substituicoes x
    JOIN public.estoque sx ON sx.id = x.substituto_id AND sx.quantidade_atual >= x.quantidade_substituta
    WHERE x.store_id = p_store_id AND x.ingrediente_id = e.id AND x.ativo
    ORDER BY x.ajuste_preco, x.created_at
    LIMIT 1
  ) s ON true
  LEFT JOIN public.estoque es ON es.id = s.substituto_id
  WHERE m.store_id = p_store_id
    AND m.ativo
    AND (p_menu_item_ids IS NULL OR m.id = ANY(p_menu_item_ids))
    AND e.quantidade_atual < r.quantidade_necessaria;
$$;

GRANT EXECUTE ON FUNCTION public.check_menu_stock(uuid, uuid[]) TO anon, authenticated;
