
-- 1. Ensure RLS is enabled on EVERYTHING
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- 2. Clean up Pedidos
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.pedidos;
DROP POLICY IF EXISTS "Users can manage orders from their store" ON public.pedidos;
DROP POLICY IF EXISTS "Users can view orders from their store" ON public.pedidos;
DROP POLICY IF EXISTS "Manage orders from store" ON public.pedidos;
CREATE POLICY "Manage orders from store" ON public.pedidos
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = pedidos.store_id));

-- 3. Clean up Webhook Logs
DROP POLICY IF EXISTS "Enable all for authenticated users" ON public.webhook_logs;
DROP POLICY IF EXISTS "Manage logs from store" ON public.webhook_logs;
CREATE POLICY "Manage logs from store" ON public.webhook_logs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = webhook_logs.store_id));

-- 4. Clean up Idempotency (Service Role Only)
DROP POLICY IF EXISTS "Service role only for idempotency" ON public.idempotency_keys;
CREATE POLICY "Service role only for idempotency" ON public.idempotency_keys
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 5. Clean up API Keys
DROP POLICY IF EXISTS "Service role only for api keys" ON public.api_keys;
DROP POLICY IF EXISTS "Manage keys from store" ON public.api_keys;
CREATE POLICY "Service role only for api keys" ON public.api_keys
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);

-- 6. User Roles protection
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());
