-- 1. Extend cupons table
ALTER TABLE public.cupons 
ADD COLUMN IF NOT EXISTS canal text CHECK (canal IN ('delivery', 'retirada', 'balcao', 'todos')) DEFAULT 'todos',
ADD COLUMN IF NOT EXISTS dias_semana integer[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday
ADD COLUMN IF NOT EXISTS limite_por_cliente integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cumulativo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS frete_gratis boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS brinde_item_id uuid REFERENCES public.menu_items(id),
ADD COLUMN IF NOT EXISTS total_minimo_zero boolean DEFAULT false;

-- 2. Rate limiting table (Leaky Bucket / Token Bucket helper)
CREATE TABLE IF NOT EXISTS public.rate_limits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL, -- integration_id:ip
    tokens numeric NOT NULL DEFAULT 10,
    last_refill timestamptz NOT NULL DEFAULT now(),
    store_id uuid REFERENCES public.stores(id) NOT NULL
);

GRANT SELECT, INSERT, UPDATE ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- 3. Update create_order_v2 to support advanced coupon logic and product_id
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
    p_itens jsonb, -- Now expected to have product_id
    p_origem text,
    p_observacao text,
    p_webhook_payload jsonb DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_pedido_id uuid;
    v_existing_pedido_id uuid;
    v_subtotal numeric := 0;
    v_desconto numeric := 0;
    v_taxa_entrega numeric := 0;
    v_total numeric := 0;
    v_menu_item record;
    v_cupom record;
    v_item_json jsonb;
    v_hoje_dow integer := extract(dow from now());
BEGIN
    -- Idempotency check
    INSERT INTO public.idempotency_keys (store_id, idempotency_key)
    VALUES (p_store_id, p_idempotency_key)
    ON CONFLICT (store_id, idempotency_key) DO NOTHING;

    SELECT pedido_id INTO v_existing_pedido_id
    FROM public.idempotency_keys
    WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF v_existing_pedido_id IS NOT NULL THEN
        RETURN json_build_object('ok', true, 'pedido_id', v_existing_pedido_id, 'status', 'idempotent');
    END IF;

    -- Calculate subtotal using product_id (preferred) or nome (fallback)
    FOR v_item_json IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        IF v_item_json ? 'product_id' THEN
            SELECT * INTO v_menu_item FROM public.menu_items WHERE id = (v_item_json->>'product_id')::uuid AND store_id = p_store_id AND ativo = true;
        ELSE
            SELECT * INTO v_menu_item FROM public.menu_items WHERE nome = (v_item_json->>'nome') AND store_id = p_store_id AND ativo = true;
        END IF;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item indisponível: %', COALESCE(v_item_json->>'nome', v_item_json->>'product_id');
        END IF;

        v_subtotal := v_subtotal + (v_menu_item.preco * (v_item_json->>'qtd')::numeric);
    END LOOP;

    -- Delivery fee
    IF p_canal = 'delivery' THEN
        SELECT taxa_entrega INTO v_taxa_entrega FROM public.configuracoes_loja WHERE store_id = p_store_id;
    END IF;
    v_taxa_entrega := COALESCE(v_taxa_entrega, 0);

    -- Advanced Coupon Validation
    IF p_cupom_codigo IS NOT NULL AND p_cupom_codigo <> '' THEN
        SELECT * INTO v_cupom FROM public.cupons WHERE store_id = p_store_id AND codigo = p_cupom_codigo AND ativo = true;

        IF NOT FOUND THEN RAISE EXCEPTION 'Cupom inválido'; END IF;
        
        -- Basic checks (date, usage, min value)
        IF now() < COALESCE(v_cupom.inicio, now()) OR now() > COALESCE(v_cupom.fim, now()) THEN RAISE EXCEPTION 'Cupom expirado'; END IF;
        IF v_cupom.limite_total IS NOT NULL AND v_cupom.usos >= v_cupom.limite_total THEN RAISE EXCEPTION 'Cupom esgotado'; END IF;
        IF v_subtotal < COALESCE(v_cupom.minimo, 0) AND NOT COALESCE(v_cupom.total_minimo_zero, false) THEN RAISE EXCEPTION 'Pedido mínimo não atingido'; END IF;

        -- Channel check
        IF v_cupom.canal <> 'todos' AND v_cupom.canal <> p_canal THEN RAISE EXCEPTION 'Cupom não válido para este canal'; END IF;

        -- Day of week check
        IF NOT (v_hoje_dow = ANY(v_cupom.dias_semana)) THEN RAISE EXCEPTION 'Cupom não válido hoje'; END IF;

        -- Calculate Discount
        IF v_cupom.tipo = 'percentual' THEN
            v_desconto := (v_subtotal * v_cupom.valor) / 100;
        ELSE
            v_desconto := v_cupom.valor;
        END IF;
        
        IF v_cupom.frete_gratis THEN v_taxa_entrega := 0; END IF;
    END IF;

    v_total := v_subtotal + v_taxa_entrega - v_desconto;
    IF v_total < 0 THEN v_total := 0; END IF;

    -- Create order
    INSERT INTO public.pedidos (
        numero, cliente, telefone, endereco, canal, pagamento,
        cupom_codigo, itens, subtotal, desconto, taxa_entrega, total,
        status, origem, observacao, store_id
    ) VALUES (
        p_numero, p_cliente, p_telefone, p_endereco, p_canal, p_pagamento,
        p_cupom_codigo, p_itens, v_subtotal, v_desconto, v_taxa_entrega, v_total,
        'novo', p_origem, p_observacao, p_store_id
    ) RETURNING id INTO v_pedido_id;

    UPDATE public.idempotency_keys SET pedido_id = v_pedido_id WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key;
    
    IF v_cupom.id IS NOT NULL THEN
        UPDATE public.cupons SET usos = usos + 1 WHERE id = v_cupom.id;
    END IF;

    IF p_webhook_payload IS NOT NULL THEN
        INSERT INTO public.webhook_logs (store_id, pedido_id, status, payload, evento)
        VALUES (p_store_id, v_pedido_id, 'ok', p_webhook_payload, 'pedido.recebido');
    END IF;

    RETURN json_build_object('ok', true, 'pedido_id', v_pedido_id);
END;
$$;
