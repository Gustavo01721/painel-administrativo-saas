-- =============================================
-- Sistema de Estoque de Insumos
-- =============================================

-- Tabela de insumos/produtos em estoque
CREATE TABLE IF NOT EXISTS estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL DEFAULT 'Outros',
  unidade text NOT NULL DEFAULT 'kg',
  quantidade_atual numeric NOT NULL DEFAULT 0,
  quantidade_minima numeric NOT NULL DEFAULT 0,
  custo_unitario numeric NOT NULL DEFAULT 0,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de receitas (relação pizza ↔ insumos)
CREATE TABLE IF NOT EXISTS receita_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id uuid REFERENCES menu_items(id) ON DELETE CASCADE,
  estoque_id uuid REFERENCES estoque(id) ON DELETE CASCADE,
  quantidade_necessaria numeric NOT NULL DEFAULT 0,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE receita_itens ENABLE ROW LEVEL SECURITY;

-- Policies estoque
CREATE POLICY "owner_manager_full_estoque" ON estoque
  FOR ALL USING (has_role('owner'::app_role, store_id) OR has_role('manager'::app_role, store_id));

CREATE POLICY "operator_read_estoque" ON estoque
  FOR SELECT USING (has_role('operator'::app_role, store_id));

-- Policies receita_itens
CREATE POLICY "owner_manager_full_receita" ON receita_itens
  FOR ALL USING (has_role('owner'::app_role, store_id) OR has_role('manager'::app_role, store_id));

CREATE POLICY "operator_read_receita" ON receita_itens
  FOR SELECT USING (has_role('operator'::app_role, store_id));

-- Trigger updated_at para estoque
CREATE TRIGGER set_estoque_updated_at
  BEFORE UPDATE ON estoque
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_estoque_store ON estoque(store_id);
CREATE INDEX IF NOT EXISTS idx_estoque_categoria ON estoque(categoria);
CREATE INDEX IF NOT EXISTS idx_receita_menu_item ON receita_itens(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_receita_estoque ON receita_itens(estoque_id);

-- Realtime
ALTER TABLE estoque REPLICA IDENTITY FULL;
ALTER TABLE receita_itens REPLICA IDENTITY FULL;

-- =============================================
-- Seed: insumos padrão para pizzaria
-- =============================================
DO $$
DECLARE
  v_store_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN RETURN; END IF;

  -- Laticínios
  INSERT INTO estoque (nome, categoria, unidade, quantidade_atual, quantidade_minima, custo_unitario, store_id)
  VALUES
    ('Mussarela', 'Laticínios', 'kg', 15, 5, 32, v_store_id),
    ('Catupiry', 'Laticínios', 'kg', 8, 3, 28, v_store_id),
    ('Cheddar', 'Laticínios', 'kg', 5, 2, 30, v_store_id),
    ('Parmesão', 'Laticínios', 'kg', 3, 1, 45, v_store_id)
  ON CONFLICT DO NOTHING;

  -- Carnes
  INSERT INTO estoque (nome, categoria, unidade, quantidade_atual, quantidade_minima, custo_unitario, store_id)
  VALUES
    ('Calabresa', 'Carnes', 'kg', 10, 3, 25, v_store_id),
    ('Pepperoni', 'Carnes', 'kg', 5, 2, 38, v_store_id),
    ('Frango', 'Carnes', 'kg', 8, 3, 18, v_store_id),
    ('Presunto', 'Carnes', 'kg', 4, 2, 22, v_store_id)
  ON CONFLICT DO NOTHING;

  -- Legumes e Verduras
  INSERT INTO estoque (nome, categoria, unidade, quantidade_atual, quantidade_minima, custo_unitario, store_id)
  VALUES
    ('Tomate', 'Legumes', 'kg', 6, 2, 8, v_store_id),
    ('Cebola', 'Legumes', 'kg', 4, 2, 6, v_store_id),
    ('Azeitona', 'Legumes', 'kg', 3, 1, 20, v_store_id),
    ('Orégano', 'Legumes', 'kg', 1, 0.5, 15, v_store_id)
  ON CONFLICT DO NOTHING;

  -- Massas e Bases
  INSERT INTO estoque (nome, categoria, unidade, quantidade_atual, quantidade_minima, custo_unitario, store_id)
  VALUES
    ('Massa de pizza', 'Massas', 'un', 50, 20, 3.5, v_store_id),
    ('Chocolate', 'Massas', 'kg', 5, 2, 18, v_store_id),
    ('Morango', 'Massas', 'kg', 3, 1, 12, v_store_id)
  ON CONFLICT DO NOTHING;

  -- Bebidas
  INSERT INTO estoque (nome, categoria, unidade, quantidade_atual, quantidade_minima, custo_unitario, store_id)
  VALUES
    ('Guaraná 2L', 'Bebidas', 'un', 24, 10, 4.5, v_store_id),
    ('Coca-Cola 2L', 'Bebidas', 'un', 18, 8, 6.2, v_store_id),
    ('Água mineral', 'Bebidas', 'un', 30, 15, 1.8, v_store_id)
  ON CONFLICT DO NOTHING;
END $$;
