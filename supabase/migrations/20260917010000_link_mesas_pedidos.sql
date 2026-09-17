-- Conecta pedidos de salão às mesas sem alterar pedidos existentes.
ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS mesa_id uuid REFERENCES public.mesas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS pedidos_mesa_id_idx ON public.pedidos (mesa_id);

-- O pedido de salão é um canal válido para o mesmo fluxo público de pedidos.
ALTER TABLE public.mesas
  DROP CONSTRAINT IF EXISTS mesas_status_check;

ALTER TABLE public.mesas
  ADD CONSTRAINT mesas_status_check CHECK (status IN ('livre', 'aberta'));

-- Mantém as duas tabelas disponíveis para a tela do painel e para o site de mesas.
GRANT SELECT, INSERT, UPDATE ON public.mesas TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.pedidos TO anon, authenticated;

ALTER TABLE public.mesas REPLICA IDENTITY FULL;
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'mesas'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'pedidos'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
  END IF;
END $$;
