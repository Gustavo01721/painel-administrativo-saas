-- Keep the operational dashboard on the shared orders schema.
CREATE TABLE IF NOT EXISTS public.motoboys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  nome text NOT NULL,
  whatsapp text NOT NULL,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.motoboys ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.motoboys TO anon, authenticated;
GRANT ALL ON public.motoboys TO service_role;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'motoboys' AND policyname = 'motoboys_store_access') THEN
    CREATE POLICY motoboys_store_access ON public.motoboys FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS motoboy_id uuid REFERENCES public.motoboys(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_motoboy_id_idx ON public.orders (motoboy_id);
