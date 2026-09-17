-- 1. Enums
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('owner', 'manager', 'operator');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Stores table
CREATE TABLE IF NOT EXISTS public.stores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    slug text NOT NULL UNIQUE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. User Roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    UNIQUE (user_id, store_id, role)
);

-- 4. Idempotency table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    idempotency_key text NOT NULL,
    pedido_id uuid, -- Será preenchido após a criação
    created_at timestamptz DEFAULT now(),
    UNIQUE (store_id, idempotency_key)
);

-- 5. Add store_id to existing tables
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
ALTER TABLE public.configuracoes_loja ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES public.stores(id);
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS erro text;
ALTER TABLE public.webhook_logs ADD COLUMN IF NOT EXISTS pedido_id uuid REFERENCES public.pedidos(id);
ALTER TABLE public.webhook_logs ALTER COLUMN status TYPE text;

-- 6. Helper function for RLS
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role, _store_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (_store_id IS NULL OR store_id = _store_id)
  )
$$;

-- 7. GRANTS
GRANT SELECT ON public.stores TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.configuracoes_loja TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.webhook_logs TO authenticated;
GRANT ALL ON public.stores TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.pedidos TO service_role;
GRANT ALL ON public.cupons TO service_role;
GRANT ALL ON public.configuracoes_loja TO service_role;
GRANT ALL ON public.webhook_logs TO service_role;
GRANT ALL ON public.idempotency_keys TO service_role;

-- 8. Hardened RLS Policies (removing USING(true))

-- Stores
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view stores they belong to" ON public.stores;
CREATE POLICY "Users can view stores they belong to" ON public.stores
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = stores.id));

-- User Roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Pedidos
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Painel le pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Painel cria pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Painel edita pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Painel apaga pedidos" ON public.pedidos;
CREATE POLICY "Manage orders from store" ON public.pedidos
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = pedidos.store_id));

-- Cupons
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Painel le cupons" ON public.cupons;
DROP POLICY IF EXISTS "Painel cria cupons" ON public.cupons;
DROP POLICY IF EXISTS "Painel edita cupons" ON public.cupons;
DROP POLICY IF EXISTS "Painel apaga cupons" ON public.cupons;
CREATE POLICY "Manage coupons from store" ON public.cupons
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = cupons.store_id));
-- Keep public anon read for coupons if needed by site
DROP POLICY IF EXISTS "Cupons ativos sao publicos" ON public.cupons;
CREATE POLICY "Cupons ativos sao publicos" ON public.cupons FOR SELECT TO anon
  USING (ativo = true AND now() BETWEEN inicio AND fim);

-- Configuracoes
ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Painel le config" ON public.configuracoes_loja;
DROP POLICY IF EXISTS "Painel cria config" ON public.configuracoes_loja;
DROP POLICY IF EXISTS "Painel edita config" ON public.configuracoes_loja;
CREATE POLICY "Manage settings from store" ON public.configuracoes_loja
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = configuracoes_loja.store_id));

-- Logs
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Painel le logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Painel apaga logs" ON public.webhook_logs;
CREATE POLICY "Manage logs from store" ON public.webhook_logs
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = webhook_logs.store_id));

-- 9. Transactional Order Creation RPC
CREATE OR REPLACE FUNCTION public.create_order_v2(
    p_store_id uuid,
    p_idempotency_key text,
    p_numero text,
    p_cliente text,
    p_telefone text,
    p_endereco text,
    p_canal text,
    p_pagamento text,
    p_cupom_codigo text,
    p_itens jsonb,
    p_subtotal numeric,
    p_desconto numeric,
    p_taxa_entrega numeric,
    p_total numeric,
    p_origem text,
    p_observacao text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pedido_id uuid;
    v_existing_pedido_id uuid;
BEGIN
    -- 1. Check idempotency
    SELECT pedido_id INTO v_existing_pedido_id
    FROM public.idempotency_keys
    WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key;

    IF v_existing_pedido_id IS NOT NULL THEN
        RETURN json_build_object('ok', true, 'pedido_id', v_existing_pedido_id, 'status', 'idempotent');
    END IF;

    -- 2. Insert order
    INSERT INTO public.pedidos (
        numero, cliente, telefone, endereco, canal, pagamento,
        cupom_codigo, itens, subtotal, desconto, taxa_entrega, total,
        status, origem, observacao, store_id
    ) VALUES (
        p_numero, p_cliente, p_telefone, p_endereco, p_canal, p_pagamento,
        p_cupom_codigo, p_itens, p_subtotal, p_desconto, p_taxa_entrega, p_total,
        'novo', p_origem, p_observacao, p_store_id
    ) RETURNING id INTO v_pedido_id;

    -- 3. Record idempotency
    INSERT INTO public.idempotency_keys (store_id, idempotency_key, pedido_id)
    VALUES (p_store_id, p_idempotency_key, v_pedido_id);

    -- 4. Update coupon if provided
    IF p_cupom_codigo IS NOT NULL THEN
        UPDATE public.cupons
        SET usos = usos + 1,
            receita_gerada = receita_gerada + p_total,
            desconto_concedido = desconto_concedido + p_desconto
        WHERE codigo = p_cupom_codigo AND store_id = p_store_id;
    END IF;

    RETURN json_build_object('ok', true, 'pedido_id', v_pedido_id, 'status', 'created');
EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar pedido: %', SQLERRM;
END;
$$;
