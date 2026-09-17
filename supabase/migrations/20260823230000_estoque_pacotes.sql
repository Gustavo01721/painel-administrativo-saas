-- =============================================
-- Sistema de Pacotes no Estoque
-- =============================================

-- Adicionar campos de pacote na tabela estoque
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS preco_pacote numeric DEFAULT 0;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS quantidade_por_pacote numeric DEFAULT 1;
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS unidade_pacote text DEFAULT '';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS fornecedor text DEFAULT '';
ALTER TABLE public.estoque ADD COLUMN IF NOT EXISTS ultimo_preco_pacote numeric DEFAULT 0;

-- Comentários nas colunas
COMMENT ON COLUMN public.estoque.preco_pacote IS 'Preço total do pacote fechado';
COMMENT ON COLUMN public.estoque.quantidade_por_pacote IS 'Quantidade que vem no pacote (ex: 50 para saco de 50kg)';
COMMENT ON COLUMN public.estoque.unidade_pacote IS 'Unidade de medida do pacote (kg, L, un)';
COMMENT ON COLUMN public.estoque.fornecedor IS 'Nome do fornecedor';
COMMENT ON COLUMN public.estoque.ultimo_preco_pacote IS 'Último preço registrado do pacote (para comparação)';

-- Atualizar seed de estoque com exemplos de pacotes
DO $$
DECLARE
  v_store_id uuid;
BEGIN
  SELECT id INTO v_store_id FROM stores LIMIT 1;
  IF v_store_id IS NULL THEN RETURN; END IF;

  -- Atualizar farinha (se existir)
  UPDATE estoque SET
    preco_pacote = 120,
    quantidade_por_pacote = 50,
    unidade_pacote = 'kg',
    fornecedor = 'Fornecedor Padrão',
    ultimo_preco_pacote = 120
  WHERE nome = 'Massa de pizza' AND store_id = v_store_id;

  -- Atualizar mussarela
  UPDATE estoque SET
    preco_pacote = 320,
    quantidade_por_pacote = 10,
    unidade_pacote = 'kg',
    fornecedor = 'Laticínios Boi Gordo',
    ultimo_preco_pacote = 320
  WHERE nome = 'Mussarela' AND store_id = v_store_id;

  -- Atualizar catupiry
  UPDATE estoque SET
    preco_pacote = 140,
    quantidade_por_pacote = 5,
    unidade_pacote = 'kg',
    fornecedor = 'Catupiry Original',
    ultimo_preco_pacote = 140
  WHERE nome = 'Catupiry' AND store_id = v_store_id;

  -- Atualizar tomate
  UPDATE estoque SET
    preco_pacote = 45,
    quantidade_por_pacote = 25,
    unidade_pacote = 'kg',
    fornecedor = 'Hortifruti Local',
    ultimo_preco_pacote = 45
  WHERE nome = 'Tomate' AND store_id = v_store_id;

  -- Atualizar cebola
  UPDATE estoque SET
    preco_pacote = 35,
    quantidade_por_pacote = 20,
    unidade_pacote = 'kg',
    fornecedor = 'Hortifruti Local',
    ultimo_preco_pacote = 35
  WHERE nome = 'Cebola' AND store_id = v_store_id;

  -- Atualizar calabresa
  UPDATE estoque SET
    preco_pacote = 250,
    quantidade_por_pacote = 10,
    unidade_pacote = 'kg',
    fornecedor = 'Frigorífico Central',
    ultimo_preco_pacote = 250
  WHERE nome = 'Calabresa' AND store_id = v_store_id;

  -- Atualizar frango
  UPDATE estoque SET
    preco_pacote = 90,
    quantidade_por_pacote = 5,
    unidade_pacote = 'kg',
    fornecedor = 'Aviário São João',
    ultimo_preco_pacote = 90
  WHERE nome = 'Frango' AND store_id = v_store_id;

  -- Atualizar chocolate
  UPDATE estoque SET
    preco_pacote = 90,
    quantidade_por_pacote = 5,
    unidade_pacote = 'kg',
    fornecedor = 'Chocolate Premium',
    ultimo_preco_pacote = 90
  WHERE nome = 'Chocolate' AND store_id = v_store_id;

  -- Inserir novos itens de estoque com pacotes
  INSERT INTO estoque (nome, categoria, unidade, quantidade_atual, quantidade_minima, custo_unitario, preco_pacote, quantidade_por_pacote, unidade_pacote, fornecedor, store_id)
  VALUES
    ('Farinha de Trigo', 'Massas', 'kg', 25, 10, 2.4, 120, 50, 'kg', 'Moinho Central', v_store_id),
    ('Açúcar', 'Outros', 'kg', 10, 5, 3.5, 45, 20, 'kg', 'Distribuidora ABC', v_store_id),
    ('Óleo', 'Outros', 'L', 8, 3, 5, 42, 12, 'L', 'Refinaria Sul', v_store_id),
    ('Sal', 'Outros', 'kg', 5, 2, 1.8, 18, 10, 'kg', 'Salinas PR', v_store_id),
    ('Fermento', 'Massas', 'kg', 2, 1, 12, 48, 4, 'kg', 'Panificadora Total', v_store_id),
    ('Molho de Tomate', 'Legumes', 'kg', 8, 3, 4, 32, 8, 'kg', 'Indústria Alimenc', v_store_id)
  ON CONFLICT DO NOTHING;
END $$;
