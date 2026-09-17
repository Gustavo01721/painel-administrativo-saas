-- Reimplement create_order_v2 to handle pricing calculation and coupon validation internally
-- This ensures the client cannot manipulate financial values.

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
    v_item record;
    v_menu_item record;
    v_cupom record;
    v_config record;
    v_item_json jsonb;
BEGIN
    -- 1. Atomic reservation of the idempotency key
    INSERT INTO public.idempotency_keys (store_id, idempotency_key)
    VALUES (p_store_id, p_idempotency_key)
    ON CONFLICT (store_id, idempotency_key) DO NOTHING;

    -- 2. Check if it was already processed
    SELECT pedido_id INTO v_existing_pedido_id
    FROM public.idempotency_keys
    WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key
    FOR UPDATE;

    IF v_existing_pedido_id IS NOT NULL THEN
        RETURN json_build_object('ok', true, 'pedido_id', v_existing_pedido_id, 'status', 'idempotent');
    END IF;

    -- 3. Recalculate Subtotal and Validate Items
    FOR v_item_json IN SELECT * FROM jsonb_array_elements(p_itens)
    LOOP
        SELECT * INTO v_menu_item 
        FROM public.menu_items 
        WHERE store_id = p_store_id AND nome = (v_item_json->>'nome') AND ativo = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Item indisponível ou inexistente: %', (v_item_json->>'nome');
        END IF;

        v_subtotal := v_subtotal + (v_menu_item.preco * (v_item_json->>'qtd')::numeric);
    END LOOP;

    -- 4. Calculate Delivery Fee
    IF p_canal = 'delivery' THEN
        SELECT taxa_entrega INTO v_taxa_entrega 
        FROM public.configuracoes_loja 
        WHERE store_id = p_store_id;
        
        v_taxa_entrega := COALESCE(v_taxa_entrega, 0);
    END IF;

    -- 5. Validate and Calculate Coupon
    IF p_cupom_codigo IS NOT NULL AND p_cupom_codigo <> '' THEN
        SELECT * INTO v_cupom 
        FROM public.cupons 
        WHERE store_id = p_store_id AND codigo = p_cupom_codigo AND ativo = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cupom inválido ou inativo';
        END IF;

        -- Check validity period
        IF now() < COALESCE(v_cupom.inicio, now() - interval '1 second') OR 
           now() > COALESCE(v_cupom.fim, now() + interval '1 second') THEN
            RAISE EXCEPTION 'Cupom fora da validade';
        END IF;

        -- Check total usage limit
        IF v_cupom.limite_total IS NOT NULL AND v_cupom.usos >= v_cupom.limite_total THEN
            RAISE EXCEPTION 'Cupom esgotado';
        END IF;

        -- Check minimum order value
        IF v_subtotal < COALESCE(v_cupom.minimo, 0) THEN
            RAISE EXCEPTION 'Pedido mínimo para este cupom: R$ %', v_cupom.minimo;
        END IF;

        -- Calculate discount
        IF v_cupom.tipo = 'percentual' THEN
            v_desconto := (v_subtotal * v_cupom.valor) / 100;
        ELSEIF v_cupom.tipo = 'fixo' THEN
            v_desconto := v_cupom.valor;
        END IF;
    END IF;

    -- 6. Final Total
    v_total := v_subtotal + v_taxa_entrega - v_desconto;
    IF v_total < 0 THEN v_total := 0; END IF;

    -- 7. Insert order
    INSERT INTO public.pedidos (
        numero, cliente, telefone, endereco, canal, pagamento,
        cupom_codigo, itens, subtotal, desconto, taxa_entrega, total,
        status, origem, observacao, store_id
    ) VALUES (
        p_numero, p_cliente, p_telefone, p_endereco, p_canal, p_pagamento,
        p_cupom_codigo, p_itens, v_subtotal, v_desconto, v_taxa_entrega, v_total,
        'novo', p_origem, p_observacao, p_store_id
    ) RETURNING id INTO v_pedido_id;

    -- 8. Update the reserved idempotency key
    UPDATE public.idempotency_keys
    SET pedido_id = v_pedido_id
    WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key;

    -- 9. Atomic usage increment
    IF p_cupom_codigo IS NOT NULL AND p_cupom_codigo <> '' THEN
        UPDATE public.cupons
        SET usos = usos + 1,
            receita_gerada = receita_gerada + v_total,
            desconto_concedido = desconto_concedido + v_desconto
        WHERE id = v_cupom.id;
    END IF;

    -- 10. Webhook logging
    IF p_webhook_payload IS NOT NULL THEN
        INSERT INTO public.webhook_logs (
            store_id, pedido_id, status, payload, evento
        ) VALUES (
            p_store_id, v_pedido_id, 'ok', p_webhook_payload, 'pedido.recebido'
        );
    END IF;

    RETURN json_build_object(
        'ok', true, 
        'pedido_id', v_pedido_id, 
        'status', 'created',
        'subtotal', v_subtotal,
        'desconto', v_desconto,
        'taxa_entrega', v_taxa_entrega,
        'total', v_total
    );

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Erro ao criar pedido: %', SQLERRM;
END;
$$;
