CREATE TABLE public.cupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  tipo text NOT NULL DEFAULT 'percentual',
  valor numeric NOT NULL DEFAULT 0,
  brinde text NOT NULL DEFAULT '',
  minimo numeric NOT NULL DEFAULT 0,
  limite_total integer NOT NULL DEFAULT 0,
  limite_por_cliente integer NOT NULL DEFAULT 1,
  canal text NOT NULL DEFAULT 'todos',
  dias integer[] NOT NULL DEFAULT '{}',
  inicio timestamptz NOT NULL DEFAULT now(),
  fim timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  ativo boolean NOT NULL DEFAULT true,
  banner_url text,
  banner_path text,
  posicao text NOT NULL DEFAULT 'checkout',
  descricao text NOT NULL DEFAULT '',
  usos integer NOT NULL DEFAULT 0,
  receita_gerada numeric NOT NULL DEFAULT 0,
  desconto_concedido numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cupons TO authenticated;
GRANT SELECT ON public.cupons TO anon;
GRANT ALL ON public.cupons TO service_role;
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cupons ativos sao publicos" ON public.cupons FOR SELECT TO anon
  USING (ativo = true AND now() BETWEEN inicio AND fim);
CREATE POLICY "Painel le cupons" ON public.cupons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Painel cria cupons" ON public.cupons FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Painel edita cupons" ON public.cupons FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Painel apaga cupons" ON public.cupons FOR DELETE TO authenticated USING (true);

CREATE TABLE public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL UNIQUE,
  cliente text NOT NULL,
  telefone text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  canal text NOT NULL DEFAULT 'delivery',
  pagamento text NOT NULL DEFAULT 'pix',
  cupom_codigo text,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  desconto numeric NOT NULL DEFAULT 0,
  taxa_entrega numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'novo',
  origem text NOT NULL DEFAULT 'site',
  observacao text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pedidos_created_at_idx ON public.pedidos (created_at DESC);
CREATE INDEX pedidos_status_idx ON public.pedidos (status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Painel le pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Painel cria pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Painel edita pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Painel apaga pedidos" ON public.pedidos FOR DELETE TO authenticated USING (true);

CREATE TABLE public.configuracoes_loja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loja text NOT NULL DEFAULT 'Fornalha Pizzaria',
  responsavel text NOT NULL DEFAULT 'Gerente',
  telefone text NOT NULL DEFAULT '',
  endereco text NOT NULL DEFAULT '',
  meta_faturamento numeric NOT NULL DEFAULT 180000,
  taxa_entrega numeric NOT NULL DEFAULT 8,
  tempo_preparo integer NOT NULL DEFAULT 32,
  loja_aberta boolean NOT NULL DEFAULT true,
  auto_whatsapp boolean NOT NULL DEFAULT true,
  auto_inativos boolean NOT NULL DEFAULT true,
  auto_aniversario boolean NOT NULL DEFAULT false,
  webhook_retorno text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.configuracoes_loja TO authenticated;
GRANT ALL ON public.configuracoes_loja TO service_role;
ALTER TABLE public.configuracoes_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Painel le config" ON public.configuracoes_loja FOR SELECT TO authenticated USING (true);
CREATE POLICY "Painel cria config" ON public.configuracoes_loja FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Painel edita config" ON public.configuracoes_loja FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento text NOT NULL,
  status integer NOT NULL DEFAULT 200,
  mensagem text NOT NULL DEFAULT '',
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.webhook_logs TO authenticated;
GRANT ALL ON public.webhook_logs TO service_role;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Painel le logs" ON public.webhook_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Painel apaga logs" ON public.webhook_logs FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER cupons_updated_at BEFORE UPDATE ON public.cupons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER pedidos_updated_at BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER config_updated_at BEFORE UPDATE ON public.configuracoes_loja
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.pedidos REPLICA IDENTITY FULL;
ALTER TABLE public.cupons REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cupons;

CREATE POLICY "Painel le banners" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'promo-banners');
CREATE POLICY "Painel envia banners" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'promo-banners');
CREATE POLICY "Painel atualiza banners" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'promo-banners') WITH CHECK (bucket_id = 'promo-banners');
CREATE POLICY "Painel apaga banners" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'promo-banners');

INSERT INTO public.configuracoes_loja (loja, responsavel, telefone, endereco, meta_faturamento, taxa_entrega)
VALUES ('Fornalha Pizzaria', 'Guilherme Prado', '(11) 3344-9080', 'Rua das Oliveiras, 214 - São Paulo/SP', 180000, 8);

INSERT INTO public.cupons (codigo, tipo, valor, brinde, minimo, limite_total, limite_por_cliente, canal, dias, inicio, fim, ativo, posicao, descricao, usos, receita_gerada, desconto_concedido) VALUES
('PIZZA10','percentual',10,'',60,500,2,'todos','{}', now() - interval '20 days', now() + interval '25 days', true,'banner_topo','10% OFF em qualquer pizza acima de R$ 60',318,28640.50,2864.05),
('PRIMEIRACOMPRA','fixo',10,'',45,0,1,'todos','{}', now() - interval '90 days', now() + interval '180 days', true,'popup','R$ 10 OFF na primeira compra',214,16890.00,2140.00),
('TERCADABORDA','brinde',0,'Borda recheada grátis',55,200,1,'todos','{2,3}', now() - interval '14 days', now() + interval '45 days', true,'banner_topo','Terça e quarta: borda recheada grátis',96,7420.00,1152.00),
('FRETEGRATIS60','frete',0,'',60,300,3,'delivery','{}', now() - interval '8 days', now() + interval '12 days', true,'carrinho','Entrega grátis acima de R$ 60',187,14260.00,1683.00),
('RETIRA20','percentual',20,'',40,150,1,'retirada','{1,2}', now() - interval '30 days', now() - interval '2 days', true,'checkout','20% OFF na retirada',150,9310.00,1862.00),
('VOLTAPRAGENTE','fixo',15,'',70,100,1,'todos','{}', now() + interval '3 days', now() + interval '40 days', true,'popup','R$ 15 OFF para quem não pede há 30 dias',0,0,0),
('GUARANAGRATIS','brinde',0,'Guaraná 2L grátis',89,120,1,'delivery','{5,6}', now() - interval '40 days', now() + interval '20 days', false,'carrinho','Guaraná 2L grátis no fim de semana',61,6890.00,793.00);

INSERT INTO public.pedidos (numero, cliente, telefone, endereco, canal, pagamento, cupom_codigo, itens, subtotal, desconto, taxa_entrega, total, status, created_at) VALUES
('#2481','Marina Alves','(11) 98812-4410','Rua Aurora, 88','delivery','pix','PIZZA10','[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Calabresa"],"borda":"Catupiry","preco":62},{"tipo":"bebida","qtd":1,"nome":"Guaraná 2L","preco":14}]'::jsonb,94.19,9.29,8,92.90,'novo', now() - interval '12 minutes'),
('#2480','Diego Ramos','(11) 99120-8877','Av. Paulista, 1200','delivery','cartao',NULL,'[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Portuguesa","Frango c/ Catupiry"],"borda":"Sem borda","preco":76}]'::jsonb,76,0,8,84.00,'producao', now() - interval '20 minutes'),
('#2479','Bruna Teixeira','(11) 99777-1245','Retirada no balcão','retirada','pix','TERCADABORDA','[{"tipo":"pizza","tamanho":"M","qtd":1,"sabores":["Margherita"],"borda":"Catupiry","preco":68.5}]'::jsonb,80.50,12,0,68.50,'forno', now() - interval '28 minutes'),
('#2478','Rodrigo Lima','(11) 98455-9021','Rua das Flores, 45','delivery','dinheiro','PIZZA10','[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Quatro Queijos"],"borda":"Cheddar","preco":72},{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Pepperoni"],"borda":"Sem borda","preco":74},{"tipo":"bebida","qtd":1,"nome":"Coca-Cola 2L","preco":16}]'::jsonb,166.79,15.89,8,158.90,'rota', now() - interval '40 minutes'),
('#2477','Camila Rocha','(11) 99012-3388','Rua Ipê, 301','delivery','pix',NULL,'[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Frango c/ Catupiry"],"borda":"Sem borda","preco":66}]'::jsonb,66,0,8,74.00,'rota', now() - interval '48 minutes'),
('#2476','Felipe Duarte','(11) 98330-7714','Retirada no balcão','retirada','cartao','PRIMEIRACOMPRA','[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Portuguesa"],"borda":"Catupiry","preco":78},{"tipo":"pizza","tamanho":"P","qtd":1,"sabores":["Chocolate c/ Morango"],"borda":"Chocolate","preco":33.4}]'::jsonb,111.40,10,0,101.40,'entregue', now() - interval '1 hour'),
('#2475','Aline Souza','(11) 99555-2210','Rua Cedro, 77','delivery','pix',NULL,'[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Calabresa","Margherita"],"borda":"Sem borda","preco":71.9}]'::jsonb,71.90,0,8,79.90,'entregue', now() - interval '1 hour 20 minutes'),
('#2474','Thiago Nunes','(11) 98700-6633','Rua Jacarandá, 12','delivery','cartao','FRETEGRATIS60','[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Pepperoni"],"borda":"Cheddar","preco":86},{"tipo":"bebida","qtd":2,"nome":"Heineken","preco":16.6}]'::jsonb,119.20,8.50,8,118.70,'entregue', now() - interval '1 hour 45 minutes'),
('#2473','Larissa Prado','(11) 99331-4407','Retirada no balcão','retirada','pix',NULL,'[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Chocolate c/ Morango"],"borda":"Chocolate","preco":62}]'::jsonb,62,0,0,62.00,'entregue', now() - interval '2 hours'),
('#2472','Gustavo Pinho','(11) 98122-9988','Rua Bela Vista, 9','delivery','pix',NULL,'[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Calabresa"],"borda":"Catupiry","preco":74},{"tipo":"pizza","tamanho":"M","qtd":1,"sabores":["Quatro Queijos"],"borda":"Sem borda","preco":60.5}]'::jsonb,134.50,20.17,8,134.50,'cancelado', now() - interval '2 hours 30 minutes'),
('#2471','Marina Alves','(11) 98812-4410','Rua Aurora, 88','delivery','pix','PIZZA10','[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Calabresa","Frango c/ Catupiry"],"borda":"Catupiry","preco":78}]'::jsonb,78,7.80,8,78.20,'entregue', now() - interval '1 day'),
('#2470','Rodrigo Lima','(11) 98455-9021','Rua das Flores, 45','delivery','cartao',NULL,'[{"tipo":"pizza","tamanho":"G","qtd":2,"sabores":["Margherita"],"borda":"Sem borda","preco":58}]'::jsonb,116,0,8,124.00,'entregue', now() - interval '1 day 2 hours'),
('#2469','Camila Rocha','(11) 99012-3388','Rua Ipê, 301','retirada','pix','RETIRA20','[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Portuguesa","Quatro Queijos"],"borda":"Cheddar","preco":80}]'::jsonb,80,16,0,64.00,'entregue', now() - interval '2 days'),
('#2468','Aline Souza','(11) 99555-2210','Rua Cedro, 77','delivery','dinheiro',NULL,'[{"tipo":"pizza","tamanho":"M","qtd":1,"sabores":["Calabresa","Portuguesa"],"borda":"Catupiry","preco":64},{"tipo":"bebida","qtd":1,"nome":"Guaraná 2L","preco":14}]'::jsonb,78,0,8,86.00,'entregue', now() - interval '3 days'),
('#2467','Thiago Nunes','(11) 98700-6633','Rua Jacarandá, 12','delivery','pix','FRETEGRATIS60','[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Pepperoni","Calabresa"],"borda":"Cheddar","preco":84}]'::jsonb,84,8,8,84.00,'entregue', now() - interval '4 days'),
('#2466','Bruna Teixeira','(11) 99777-1245','Retirada no balcão','retirada','cartao',NULL,'[{"tipo":"pizza","tamanho":"G","qtd":1,"sabores":["Frango c/ Catupiry","Margherita"],"borda":"Catupiry","preco":76}]'::jsonb,76,0,0,76.00,'entregue', now() - interval '5 days'),
('#2465','Felipe Duarte','(11) 98330-7714','Rua Verde, 500','delivery','pix','PIZZA10','[{"tipo":"pizza","tamanho":"G","qtd":2,"sabores":["Quatro Queijos"],"borda":"Catupiry","preco":84}]'::jsonb,168,16.80,8,159.20,'entregue', now() - interval '6 days');