-- Fix menu_items table schema and constraints
-- Incremental migration using ALTER TABLE

-- 1. Restore missing columns if they were lost or never created correctly
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS categoria text NOT NULL DEFAULT 'Geral';
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS custo numeric NOT NULL DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS vendas integer NOT NULL DEFAULT 0;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Ensure store_id is NOT NULL
DO $$ 
DECLARE
    v_default_store_id uuid;
BEGIN
    SELECT id INTO v_default_store_id FROM public.stores LIMIT 1;
    UPDATE public.menu_items SET store_id = v_default_store_id WHERE store_id IS NULL;
END $$;

ALTER TABLE public.menu_items ALTER COLUMN store_id SET NOT NULL;

-- 3. Cleanup duplicates and add UNIQUE constraint
DELETE FROM public.menu_items a
USING public.menu_items b
WHERE a.id < b.id 
  AND a.store_id = b.store_id 
  AND a.nome = b.nome;

ALTER TABLE public.menu_items DROP CONSTRAINT IF EXISTS menu_items_store_id_nome_key;
ALTER TABLE public.menu_items ADD CONSTRAINT menu_items_store_id_nome_key UNIQUE (store_id, nome);

-- 4. Final schema adjustments
ALTER TABLE public.menu_items ALTER COLUMN preco SET NOT NULL;
ALTER TABLE public.menu_items ALTER COLUMN ativo SET DEFAULT true;
ALTER TABLE public.menu_items ALTER COLUMN ativo SET NOT NULL;
