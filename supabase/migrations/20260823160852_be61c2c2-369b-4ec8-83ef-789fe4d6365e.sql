
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    idempotency_key text NOT NULL,
    pedido_id uuid REFERENCES public.pedidos(id),
    created_at timestamptz DEFAULT now(),
    UNIQUE (store_id, idempotency_key)
);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.idempotency_keys TO service_role;
REVOKE ALL ON public.idempotency_keys FROM authenticated, anon;

CREATE POLICY "Service role only for idempotency" ON public.idempotency_keys
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role, uuid) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role, uuid) TO service_role;
