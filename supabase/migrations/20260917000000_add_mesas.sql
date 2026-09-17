CREATE TABLE IF NOT EXISTS public.mesas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  nome text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'livre' CHECK (status IN ('livre', 'aberta')),
  pessoas integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (store_id, numero)
);
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.mesas TO anon, authenticated;
GRANT ALL ON public.mesas TO service_role;
DROP POLICY IF EXISTS "Public test mesas access" ON public.mesas;
CREATE POLICY "Public test mesas access" ON public.mesas FOR ALL USING (true) WITH CHECK (true);
