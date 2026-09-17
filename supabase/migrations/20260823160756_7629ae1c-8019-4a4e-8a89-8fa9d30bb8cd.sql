
CREATE TABLE IF NOT EXISTS public.menu_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    nome text NOT NULL,
    preco numeric NOT NULL,
    ativo boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    UNIQUE (store_id, nome)
);

CREATE TABLE IF NOT EXISTS public.api_keys (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    key_hash text NOT NULL UNIQUE,
    name text,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage menu from store" ON public.menu_items;
CREATE POLICY "Manage menu from store" ON public.menu_items
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = menu_items.store_id));

DROP POLICY IF EXISTS "Menu items are public" ON public.menu_items;
CREATE POLICY "Menu items are public" ON public.menu_items FOR SELECT TO anon USING (ativo = true);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Manage keys from store" ON public.api_keys;
CREATE POLICY "Manage keys from store" ON public.api_keys
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND store_id = api_keys.store_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.menu_items TO authenticated;
GRANT SELECT ON public.menu_items TO anon;
GRANT ALL ON public.menu_items TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
