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
CREATE POLICY "Public test motoboys access" ON public.motoboys FOR ALL USING (true) WITH CHECK (true);
