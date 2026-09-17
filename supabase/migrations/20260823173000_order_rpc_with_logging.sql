-- Update create_order_v2 to include logging within the same transaction

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

    -- 3. Insert order
    INSERT INTO public.pedidos (
        numero, cliente, telefone, endereco, canal, pagamento,
        cupom_codigo, itens, subtotal, desconto, taxa_entrega, total,
        status, origem, observacao, store_id
    ) VALUES (
        p_numero, p_cliente, p_telefone, p_endereco, p_canal, p_pagamento,
        p_cupom_codigo, p_itens, p_subtotal, p_desconto, p_taxa_entrega, p_total,
        'novo', p_origem, p_observacao, p_store_id
    ) RETURNING id INTO v_pedido_id;

    -- 4. Update the reserved idempotency key
    UPDATE public.idempotency_keys
    SET pedido_id = v_pedido_id
    WHERE store_id = p_store_id AND idempotency_key = p_idempotency_key;

    -- 5. Update coupon if provided
    IF p_cupom_codigo IS NOT NULL THEN
        UPDATE public.cupons
        SET usos = usos + 1,
            receita_gerada = receita_gerada + p_total,
            desconto_concedido = desconto_concedido + p_desconto
        WHERE codigo = p_cupom_codigo AND store_id = p_store_id;
    END IF;

    -- 6. Log the webhook success (within the same transaction)
    IF p_webhook_payload IS NOT NULL THEN
        INSERT INTO public.webhook_logs (
            store_id,
            pedido_id,
            status,
            payload
        ) VALUES (
            p_store_id,
            v_pedido_id,
            'sucesso',
            p_webhook_payload
        );
    END IF;

    RETURN json_build_object('ok', true, 'pedido_id', v_pedido_id, 'status', 'created');

EXCEPTION WHEN OTHERS THEN
    -- Log the failure if possible (might require a nested transaction or separate handling, 
    -- but usually we want the order rollback to be complete)
    RAISE EXCEPTION 'Erro ao criar pedido: %', SQLERRM;
END;
$$;
