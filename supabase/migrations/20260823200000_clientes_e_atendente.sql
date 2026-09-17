-- =============================================
-- Tabela de Clientes para CRM e Integração
-- =============================================

CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text,
  email text,
  endereco text,
  cpf text,
  data_nascimento date,
  observacoes text,
  origem text DEFAULT 'sistema',
  tier text DEFAULT 'Novo',
  total_pedidos integer DEFAULT 0,
  total_gasto numeric DEFAULT 0,
  ultimo_pedido timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE
);

-- RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_manager_full_clientes" ON clientes
  FOR ALL USING (has_role('owner'::app_role, store_id) OR has_role('manager'::app_role, store_id));

CREATE POLICY "operator_read_clientes" ON clientes
  FOR SELECT USING (has_role('operator'::app_role, store_id));

-- Trigger updated_at
CREATE TRIGGER set_clientes_updated_at
  BEFORE UPDATE ON clientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_clientes_store ON clientes(store_id);
CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
CREATE INDEX IF NOT EXISTS idx_clientes_tier ON clientes(tier);

-- Realtime
ALTER TABLE clientes REPLICA IDENTITY FULL;

-- =============================================
-- Tabela de Sessões do Atendente
-- =============================================
CREATE TABLE IF NOT EXISTS atendente_sessoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atendente_nome text NOT NULL,
  atendente_id text NOT NULL,
  status text DEFAULT 'online',
  pedidos_atendidos integer DEFAULT 0,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE atendente_sessoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_manager_full_atendente" ON atendente_sessoes
  FOR ALL USING (has_role('owner'::app_role, store_id) OR has_role('manager'::app_role, store_id));

CREATE POLICY "operator_read_atendente" ON atendente_sessoes
  FOR SELECT USING (has_role('operator'::app_role, store_id));

CREATE TRIGGER set_atendente_sessoes_updated_at
  BEFORE UPDATE ON atendente_sessoes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
