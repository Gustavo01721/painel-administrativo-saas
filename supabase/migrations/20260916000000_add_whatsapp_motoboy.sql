ALTER TABLE public.configuracoes_loja
  ADD COLUMN IF NOT EXISTS whatsapp_motoboy text NOT NULL DEFAULT '';
