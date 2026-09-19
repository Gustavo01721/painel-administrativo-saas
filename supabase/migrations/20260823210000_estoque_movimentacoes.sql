-- =============================================
-- Histórico de Movimentações de Estoque
-- =============================================

CREATE TABLE IF NOT EXISTS estoque_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estoque_id uuid REFERENCES estoque(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'saida',
  quantidade numeric NOT NULL,
  motivo text,
  responsavel text,
  observacao text,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE estoque_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_manager_full_movimentacoes" ON estoque_movimentacoes
  FOR ALL USING (has_role(auth.uid(), 'owner'::app_role, store_id) OR has_role(auth.uid(), 'manager'::app_role, store_id));

CREATE POLICY "operator_read_movimentacoes" ON estoque_movimentacoes
  FOR SELECT USING (has_role(auth.uid(), 'operator'::app_role, store_id));

-- Índices
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque ON estoque_movimentacoes(estoque_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_store ON estoque_movimentacoes(store_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data ON estoque_movimentacoes(created_at);

-- Realtime
ALTER TABLE estoque_movimentacoes REPLICA IDENTITY FULL;
