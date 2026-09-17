ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS motoboy_id uuid REFERENCES public.motoboys(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_pedidos_motoboy_id ON public.pedidos(motoboy_id);
