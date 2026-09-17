-- Keep the operational dashboard on the shared orders schema.
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS motoboy_id uuid REFERENCES public.motoboys(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS orders_motoboy_id_idx ON public.orders (motoboy_id);
