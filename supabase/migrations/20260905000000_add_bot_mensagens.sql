ALTER TABLE configuracoes_loja
  ADD COLUMN IF NOT EXISTS bot_mensagens boolean NOT NULL DEFAULT false;
