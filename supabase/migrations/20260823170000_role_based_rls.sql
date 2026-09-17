-- Drop existing policies that are too broad
DROP POLICY IF EXISTS "Manage orders from store" ON public.pedidos;
DROP POLICY IF EXISTS "Manage coupons from store" ON public.cupons;
DROP POLICY IF EXISTS "Manage settings from store" ON public.configuracoes_loja;
DROP POLICY IF EXISTS "Manage logs from store" ON public.webhook_logs;
DROP POLICY IF EXISTS "Users can view stores they belong to" ON public.stores;

-- 1. STORES
CREATE POLICY "View stores" ON public.stores
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'owner', id) OR 
           public.has_role(auth.uid(), 'manager', id) OR 
           public.has_role(auth.uid(), 'operator', id));

-- 2. PEDIDOS (Orders)
-- Owners and Managers can do everything
CREATE POLICY "Full access to orders (owner/manager)" ON public.pedidos
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'owner', store_id) OR 
           public.has_role(auth.uid(), 'manager', store_id));

-- Operators can view and update status only
CREATE POLICY "Operator view orders" ON public.pedidos
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'operator', store_id));

CREATE POLICY "Operator update order status" ON public.pedidos
    FOR UPDATE TO authenticated
    USING (public.has_role(auth.uid(), 'operator', store_id))
    WITH CHECK (public.has_role(auth.uid(), 'operator', store_id));

-- 3. CUPONS (Coupons)
CREATE POLICY "Manage coupons (owner/manager)" ON public.cupons
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'owner', store_id) OR 
           public.has_role(auth.uid(), 'manager', store_id));

CREATE POLICY "View coupons (operator)" ON public.cupons
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'operator', store_id));

-- 4. CONFIGURACOES_LOJA (Settings)
CREATE POLICY "Manage settings (owner/manager)" ON public.configuracoes_loja
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'owner', store_id) OR 
           public.has_role(auth.uid(), 'manager', store_id));

CREATE POLICY "View settings (operator)" ON public.configuracoes_loja
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'operator', store_id));

-- 5. WEBHOOK_LOGS
CREATE POLICY "Manage logs (owner/manager)" ON public.webhook_logs
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'owner', store_id) OR 
           public.has_role(auth.uid(), 'manager', store_id));

CREATE POLICY "View logs (operator)" ON public.webhook_logs
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'operator', store_id));

-- 6. API_KEYS (Strictly owner only if ever exposed to frontend, but usually service_role only)
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage api keys" ON public.api_keys;
CREATE POLICY "Manage api keys (owner only)" ON public.api_keys
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'owner', store_id));

-- 7. MENU_ITEMS
CREATE POLICY "Manage menu (owner/manager)" ON public.menu_items
    FOR ALL TO authenticated
    USING (public.has_role(auth.uid(), 'owner', store_id) OR 
           public.has_role(auth.uid(), 'manager', store_id));

CREATE POLICY "View menu (operator)" ON public.menu_items
    FOR SELECT TO authenticated
    USING (public.has_role(auth.uid(), 'operator', store_id));
