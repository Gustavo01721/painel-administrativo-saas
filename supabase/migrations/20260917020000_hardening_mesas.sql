-- Hardening do fluxo de mesas. Nao remove tabelas legadas.
ALTER TABLE public.mesas
  ALTER COLUMN pessoas SET DEFAULT 1;

UPDATE public.mesas SET pessoas = 1 WHERE pessoas IS NULL OR pessoas < 1;

ALTER TABLE public.mesas DROP CONSTRAINT IF EXISTS mesas_pessoas_check;
ALTER TABLE public.mesas ADD CONSTRAINT mesas_pessoas_check CHECK (pessoas >= 1);

-- Um unico pedido ativo por mesa. Historico encerrado permanece preservado.
CREATE UNIQUE INDEX IF NOT EXISTS pedidos_uma_mesa_aberta_idx
  ON public.pedidos (store_id, mesa_id)
  WHERE mesa_id IS NOT NULL AND canal = 'mesa' AND status IN ('novo', 'em_preparo', 'producao', 'forno');

-- Substitui a politica publica de teste por isolamento por loja.
DROP POLICY IF EXISTS "Public test mesas access" ON public.mesas;
DROP POLICY IF EXISTS "Mesas da loja" ON public.mesas;
CREATE POLICY "Mesas da loja" ON public.mesas
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.store_id = mesas.store_id))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles r WHERE r.user_id = auth.uid() AND r.store_id = mesas.store_id));

-- O endpoint publico usa service_role e nao depende destas politicas.
DROP POLICY IF EXISTS "Public test pedidos access" ON public.pedidos;

ALTER TABLE public.mesas REPLICA IDENTITY FULL;
ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
