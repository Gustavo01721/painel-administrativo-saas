-- Unifica a baixa de estoque com a fonte usada pelo painel SaaS.
-- A baixa ocorre uma única vez, na transição do pedido para pagamento aprovado.

CREATE OR REPLACE FUNCTION public.process_paid_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item record;
  receita record;
  produto record;
  quantidade_necessaria numeric;
  encontrou_receita boolean;
BEGIN
  IF new.payment_status = 'approved'
     AND COALESCE(old.payment_status, 'pending') <> 'approved' THEN
    INSERT INTO public.cash_movements
      (store_id, description, amount, movement_type, payment_method, metadata)
    VALUES
      (new.store_id, 'Pedido ' || COALESCE(new.number, new.id), new.total,
       'entrada', COALESCE(new.payment_method, 'PIX'),
       jsonb_build_object('order_id', new.id))
    ON CONFLICT DO NOTHING;

    INSERT INTO public.cash_transactions
      (store_id, order_id, amount, payment_method)
    VALUES
      (new.store_id, new.id, new.total, COALESCE(new.payment_method, 'PIX'))
    ON CONFLICT (order_id) DO NOTHING;

    FOR item IN SELECT * FROM public.order_items WHERE order_id = new.id LOOP
      encontrou_receita := false;

      -- Pizzas e outros itens com receita: cada nome de menu encontrado
      -- na descrição consome os insumos configurados no painel.
      FOR receita IN
        SELECT e.id AS estoque_id, e.nome AS estoque_nome,
               e.quantidade_atual, r.quantidade_necessaria
        FROM public.menu_items m
        JOIN public.receita_itens r ON r.menu_item_id = m.id
        JOIN public.estoque e ON e.id = r.estoque_id
        WHERE m.store_id = new.store_id
          AND lower(item.description) LIKE '%' || lower(m.nome) || '%'
      LOOP
        encontrou_receita := true;
        quantidade_necessaria := receita.quantidade_necessaria * item.quantity;

        UPDATE public.estoque
        SET quantidade_atual = quantidade_atual - quantidade_necessaria,
            updated_at = now()
        WHERE id = receita.estoque_id
          AND quantidade_atual >= quantidade_necessaria;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'Estoque insuficiente: %', receita.estoque_nome;
        END IF;

        INSERT INTO public.estoque_movimentacoes
          (estoque_id, tipo, quantidade, motivo, responsavel, observacao, store_id)
        VALUES
          (receita.estoque_id, 'saida', quantidade_necessaria,
           'Produção de pedido', 'sistema',
           'Pedido ' || COALESCE(new.number, new.id), new.store_id);
      END LOOP;

      -- Bebidas e produtos unitários podem ser controlados diretamente pelo nome.
      IF NOT encontrou_receita THEN
        SELECT e.id, e.nome, e.quantidade_atual
        INTO produto
        FROM public.estoque e
        WHERE e.store_id = new.store_id
          AND lower(item.description) LIKE '%' || lower(e.nome) || '%'
        ORDER BY length(e.nome) DESC
        LIMIT 1;

        IF FOUND THEN
          UPDATE public.estoque
          SET quantidade_atual = quantidade_atual - item.quantity,
              updated_at = now()
          WHERE id = produto.id
            AND quantidade_atual >= item.quantity;

          IF NOT FOUND THEN
            RAISE EXCEPTION 'Estoque insuficiente: %', produto.nome;
          END IF;

          INSERT INTO public.estoque_movimentacoes
            (estoque_id, tipo, quantidade, motivo, responsavel, observacao, store_id)
          VALUES
            (produto.id, 'saida', item.quantity,
             'Venda direta', 'sistema',
             'Pedido ' || COALESCE(new.number, new.id), new.store_id);
        END IF;
      END IF;
    END LOOP;

    INSERT INTO public.print_queue (store_id, order_id, payload)
    SELECT new.store_id, new.id,
      jsonb_build_object(
        'order', to_jsonb(new),
        'items', COALESCE(
          (SELECT jsonb_agg(to_jsonb(i)) FROM public.order_items i WHERE i.order_id = new.id),
          '[]'::jsonb
        )
      )
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS orders_paid_side_effects ON public.orders;
CREATE TRIGGER orders_paid_side_effects
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.process_paid_order();
