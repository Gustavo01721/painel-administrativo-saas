-- =============================================
-- Vincula pedidos a clientes automaticamente
-- =============================================

-- 1. Adiciona coluna cliente_id na tabela pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_id ON public.pedidos(cliente_id);

-- 2. Função para upsert de cliente (cria ou atualiza por telefone)
CREATE OR REPLACE FUNCTION public.upsert_cliente(
    p_store_id uuid,
    p_nome text,
    p_telefone text,
    p_endereco text,
    p_origem text DEFAULT 'site'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cliente_id uuid;
    v_telefone_limpo text;
BEGIN
    -- Normalizar telefone (remover espaços, traços, parênteses)
    v_telefone_limpo := regexp_replace(COALESCE(p_telefone, ''), '[^0-9+]', '', 'g');

    -- Se não tem telefone, não cadastra
    IF v_telefone_limpo = '' OR v_telefone_limpo IS NULL THEN
        RETURN NULL;
    END IF;

    -- Buscar cliente existente por telefone
    SELECT id INTO v_cliente_id
    FROM public.clientes
    WHERE store_id = p_store_id
      AND regexp_replace(COALESCE(telefone, ''), '[^0-9+]', '', 'g') = v_telefone_limpo
    LIMIT 1;

    IF v_cliente_id IS NOT NULL THEN
        -- Atualizar dados do cliente existente
        UPDATE public.clientes SET
            nome = COALESCE(p_nome, nome),
            endereco = COALESCE(NULLIF(p_endereco, ''), endereco),
            total_pedidos = total_pedidos + 1,
            ultimo_pedido = now(),
            updated_at = now()
        WHERE id = v_cliente_id;
    ELSE
        -- Criar novo cliente
        INSERT INTO public.clientes (nome, telefone, endereco, origem, tier, total_pedidos, total_gasto, ultimo_pedido, store_id)
        VALUES (
            COALESCE(p_nome, 'Cliente'),
            p_telefone,
            COALESCE(NULLIF(p_endereco, ''), ''),
            COALESCE(p_origem, 'site'),
            'Novo',
            1,
            0,
            now(),
            p_store_id
        )
        RETURNING id INTO v_cliente_id;
    END IF;

    RETURN v_cliente_id;
END;
$$;

-- 3. Atualizar create_order_v2 para vincular cliente automaticamente
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
    v_cliente_id uuid;
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

    -- Upsert cliente automaticamente
    v_cliente_id := public.upsert_cliente(p_store_id, p_cliente, p_telefone, p_endereco, p_origem);

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
        
        IF now() < COALESCE(v_cupom.inicio, now()) OR now() > COALESCE(v_cupom.fim, now()) THEN RAISE EXCEPTION 'Cupom expirado'; END IF;
        IF v_cupom.limite_total IS NOT NULL AND v_cupom.usos >= v_cupom.limite_total THEN RAISE EXCEPTION 'Cupom esgotado'; END IF;
        IF v_subtotal < COALESCE(v_cupom.minimo, 0) AND NOT COALESCE(v_cupom.total_minimo_zero, false) THEN RAISE EXCEPTION 'Pedido mínimo não atingido'; END IF;

        IF v_cupom.canal <> 'todos' AND v_cupom.canal <> p_canal THEN RAISE EXCEPTION 'Cupom não válido para este canal'; END IF;

        IF NOT (v_hoje_dow = ANY(v_cupom.dias_semana)) THEN RAISE EXCEPTION 'Cupom não válido hoje'; END IF;

        IF v_cupom.tipo = 'percentual' THEN
            v_desconto := (v_subtotal * v_cupom.valor) / 100;
        ELSE
            v_desconto := v_cupom.valor;
        END IF;
        
        IF v_cupom.frete_gratis THEN v_taxa_entrega := 0; END IF;
    END IF;

    v_total := v_subtotal + v_taxa_entrega - v_desconto;
    IF v_total < 0 THEN v_total := 0; END IF;

    -- Create order with cliente_id link
    INSERT INTO public.pedidos (
        numero, cliente, telefone, endereco, canal, pagamento,
        cupom_codigo, itens, subtotal, desconto, taxa_entrega, total,
        status, origem, observacao, store_id, cliente_id
    ) VALUES (
        p_numero, p_cliente, p_telefone, p_endereco, p_canal, p_pagamento,
        p_cupom_codigo, p_itens, v_subtotal, v_desconto, v_taxa_entrega, v_total,
        'novo', p_origem, p_observacao, p_store_id, v_cliente_id
    ) RETURNING id INTO v_pedido_id;

    UPDATE public.idempotency_keys SET pedido_id = v_pedido_id WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key;
    
    IF v_cupom.id IS NOT NULL THEN
        UPDATE public.cupons SET usos = usos + 1 WHERE id = v_cupom.id;
    END IF;

    IF p_webhook_payload IS NOT NULL THEN
        INSERT INTO public.webhook_logs (store_id, pedido_id, status, payload, evento)
        VALUES (p_store_id, v_pedido_id, 'ok', p_webhook_payload, 'pedido.recebido');
    END IF;

    RETURN json_build_object('ok', true, 'pedido_id', v_pedido_id, 'cliente_id', v_cliente_id);
END;
$$;

-- Permissões
REVOKE ALL ON FUNCTION public.upsert_cliente(uuid, text, text, text, text) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upsert_cliente(uuid, text, text, text, text) TO service_role;
