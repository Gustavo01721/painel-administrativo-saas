-- Menu table
CREATE TABLE IF NOT EXISTS public.menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    categoria text NOT NULL,
    preco numeric NOT NULL,
    custo numeric NOT NULL DEFAULT 0,
    ativo boolean NOT NULL DEFAULT true,
    vendas integer NOT NULL DEFAULT 0,
    store_id uuid REFERENCES public.stores(id),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS for menu
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT SELECT ON public.menu_items TO anon;
GRANT ALL ON public.menu_items TO service_role;

CREATE POLICY "Manage menu items from store" ON public.menu_items
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = menu_items.store_id));

CREATE POLICY "Public menu view" ON public.menu_items
    FOR SELECT TO anon
    USING (ativo = true);

-- Default Store and Roles (Mocked data for migration reproducibility)
-- In a real scenario, this would be empty and populated via dashboard
-- but here we need it for the initial store.

DO $$
DECLARE
    v_store_id uuid;
BEGIN
    INSERT INTO public.stores (name, slug)
    VALUES ('Fornalha Pizzaria', 'fornalha-pizzaria')
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_store_id;

    -- Update existing data to this store
    UPDATE public.pedidos SET store_id = v_store_id WHERE store_id IS NULL;
    UPDATE public.cupons SET store_id = v_store_id WHERE store_id IS NULL;
    UPDATE public.configuracoes_loja SET store_id = v_store_id WHERE store_id IS NULL;

    -- Seed menu for this store
    INSERT INTO public.menu_items (nome, categoria, preco, custo, ativo, vendas, store_id)
    VALUES 
        ('Calabresa', 'Salgadas', 62, 21.4, true, 412, v_store_id),
        ('Margherita', 'Salgadas', 58, 18.9, true, 366, v_store_id),
        ('Frango c/ Catupiry', 'Salgadas', 68, 24.8, true, 341, v_store_id),
        ('Portuguesa', 'Salgadas', 66, 23.5, true, 289, v_store_id),
        ('Quatro Queijos', 'Salgadas', 72, 27.9, true, 264, v_store_id),
        ('Pepperoni', 'Salgadas', 74, 28.6, true, 231, v_store_id),
        ('Chocolate c/ Morango', 'Doces', 64, 22.1, true, 148, v_store_id),
        ('Borda recheada Catupiry', 'Bordas', 12, 3.8, true, 502, v_store_id),
        ('Borda cheddar', 'Bordas', 12, 4.1, true, 318, v_store_id),
        ('Guaraná 2L', 'Bebidas', 14, 6.2, true, 476, v_store_id),
        ('Coca-Cola 2L', 'Bebidas', 16, 8.1, true, 401, v_store_id)
    ON CONFLICT DO NOTHING;
END $$;
