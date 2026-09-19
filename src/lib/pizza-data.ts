// ---------------------------------------------------------------------------
// Fornalha — tipos, rótulos e cálculos de relatório do painel da pizzaria
// ---------------------------------------------------------------------------

export const currency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

export const compact = (v: number) => v.toLocaleString("pt-BR");

export const periodOptions = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Este mês" },
  { value: "90d", label: "Últimos 90 dias" },
] as const;

export type PeriodValue = (typeof periodOptions)[number]["value"];

export const periodDays: Record<PeriodValue, number> = { hoje: 1, "7d": 7, "30d": 30, "90d": 90 };

// --------------------------------- Pedidos ---------------------------------

export type OrderStatus = "novo" | "producao" | "forno" | "rota" | "entregue" | "cancelado";

export const orderStatusLabel: Record<OrderStatus, string> = {
  novo: "Novo",
  producao: "Em montagem",
  forno: "No forno",
  rota: "Saiu p/ entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};

export const kdsColumns: OrderStatus[] = ["novo", "producao", "forno", "rota", "entregue"];

export type Canal = "delivery" | "retirada";

export type Pagamento = "pix" | "cartao" | "debito" | "dinheiro";

export const pagamentoLabel: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão de crédito",
  debito: "Cartão de débito",
  dinheiro: "Dinheiro",
};

export type OrderItem = {
  tipo: "pizza" | "bebida" | "borda" | "outro";
  nome?: string;
  sabores?: string[];
  tamanho?: string;
  borda?: string;
  qtd: number;
  preco: number;
};

export type Order = {
  id: string;
  numero: string;
  cliente: string;
  clienteId: string | null;
  telefone: string;
  endereco: string;
  canal: Canal;
  pagamento: string;
  cupom: string | null;
  itens: OrderItem[];
  subtotal: number;
  desconto: number;
  taxaEntrega: number;
  total: number;
  status: OrderStatus;
  motoboyId?: string | null;
  origem: string;
  observacao: string;
  createdAt: string;
  hora: string;
};

export function itemLabel(i: OrderItem) {
  if (i.tipo === "pizza") {
    const sabores = (i.sabores ?? []).join(" / ");
    const meio = (i.sabores?.length ?? 0) > 1 ? "Meio a meio: " : "";
    const borda = i.borda && i.borda !== "Sem borda" ? ` · borda ${i.borda}` : "";
    return `${i.qtd > 1 ? `${i.qtd}x ` : ""}${meio}${sabores}${i.tamanho ? ` ${i.tamanho}` : ""}${borda}`;
  }
  return `${i.qtd > 1 ? `${i.qtd}x ` : ""}${i.nome ?? "Item"}`;
}

export const horaCurta = (iso: string) => {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
};

// --------------------------------- Cupons ----------------------------------

export type CouponType = "percentual" | "fixo" | "frete" | "brinde";

export const couponTypeLabel: Record<CouponType, string> = {
  percentual: "Porcentagem",
  fixo: "Valor fixo",
  frete: "Frete grátis",
  brinde: "Item brinde",
};

export type BannerPosicao = "banner_topo" | "popup" | "carrinho" | "checkout";

export const posicaoLabel: Record<BannerPosicao, string> = {
  banner_topo: "Banner no topo do site",
  popup: "Pop-up de boas-vindas",
  carrinho: "Faixa no carrinho",
  checkout: "Somente no checkout",
};

export type Coupon = {
  id: string;
  codigo: string;
  descricao: string;
  tipo: CouponType;
  valor: number;
  brinde: string;
  minimo: number;
  limiteTotal: number;
  limitePorCliente: number;
  canal: "todos" | Canal;
  dias: number[]; // 0=Dom ... 6=Sáb — vazio = todos os dias
  inicio: string; // yyyy-MM-ddTHH:mm
  fim: string;
  ativo: boolean;
  bannerUrl: string | null;
  bannerPath: string | null;
  posicao: BannerPosicao;
  usos: number;
  receitaGerada: number;
  descontoConcedido: number;
};

export type CouponStatus = "ativo" | "agendado" | "esgotado" | "expirado" | "pausado";

export const couponStatusLabel: Record<CouponStatus, string> = {
  ativo: "Ativo",
  agendado: "Agendado",
  esgotado: "Esgotado",
  expirado: "Expirado",
  pausado: "Pausado",
};

export function couponStatus(c: Coupon, now = new Date()): CouponStatus {
  if (!c.ativo) return "pausado";
  if (c.fim && new Date(c.fim) < now) return "expirado";
  if (c.inicio && new Date(c.inicio) > now) return "agendado";
  if (c.limiteTotal > 0 && c.usos >= c.limiteTotal) return "esgotado";
  return "ativo";
}

export function couponValueLabel(c: Coupon) {
  if (c.tipo === "percentual") return `${c.valor}% OFF`;
  if (c.tipo === "fixo") return `${currency(c.valor)} OFF`;
  if (c.tipo === "frete") return "Entrega grátis";
  return c.brinde || "Item brinde";
}

export const diasSemana = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

// --------------------------------- Cardápio --------------------------------

export type MenuItem = {
  id: string;
  nome: string;
  categoria: "Salgadas" | "Doces" | "Bordas" | "Bebidas" | "Esfihas" | "Adicionais" | "Rodízio";
  preco: number;
  custo: number;
  ativo: boolean;
  vendas: number;
};

// --------------------------------- Estoque ----------------------------------

export type EstoqueCategoria =
  | "Laticínios"
  | "Carnes"
  | "Legumes"
  | "Massas"
  | "Bebidas"
  | "Outros";

export const estoqueCategoriaOptions: EstoqueCategoria[] = [
  "Laticínios",
  "Carnes",
  "Legumes",
  "Massas",
  "Bebidas",
  "Outros",
];

export type EstoqueUnidade = "kg" | "g" | "un" | "L" | "ml";

export const estoqueUnidadeOptions: EstoqueUnidade[] = ["kg", "g", "un", "L", "ml"];

export type EstoqueItem = {
  id: string;
  nome: string;
  categoria: EstoqueCategoria;
  unidade: EstoqueUnidade;
  quantidadeAtual: number;
  quantidadeMinima: number;
  custoUnitario: number;
  precoPacote: number;
  quantidadePorPacote: number;
  unidadePacote: string;
  fornecedor: string;
  ultimoPrecoPacote: number;
};

export type ReceitaItem = {
  id: string;
  menuItemId: string;
  estoqueId: string;
  quantidadeNecessaria: number;
};

export type IngredienteSubstituicao = {
  id: string;
  storeId: string;
  ingredienteId: string;
  substitutoId: string;
  quantidadeSubstituta: number;
  ajustePreco: number;
  ativo: boolean;
};

export type Cliente = {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
  cpf: string;
  dataNascimento: string;
  observacoes: string;
  origem: string;
  tier: "VIP" | "Recorrente" | "Novo" | "Inativo";
  totalPedidos: number;
  totalGasto: number;
  ultimoPedido: string | null;
};

export type MovimentacaoEstoque = {
  id: string;
  estoqueId: string;
  tipo: "entrada" | "saida" | "ajuste" | "perda";
  quantidade: number;
  motivo: string;
  responsavel: string;
  observacao: string;
  createdAt: string;
};

export const movimentacaoTipoOptions = [
  { value: "saida", label: "Saída (uso)" },
  { value: "entrada", label: "Entrada (compra)" },
  { value: "ajuste", label: "Ajuste de inventário" },
  { value: "perda", label: "Perda / Quebra" },
] as const;

export const movimentacaoMotivoOptions = [
  "Produção de pizza",
  "Venda direta",
  "Compra de estoque",
  "Inventário físico",
  "Perda / Vencimento",
  "Ajuste de sistema",
  "Outro",
];

export const seedMenu: MenuItem[] = [
  // ==========================================
  // PIZZAS SALGADAS COMPLETAS (83 sabores)
  // ==========================================
  { id: "sal01", nome: "Abacaxi Fruta", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal02", nome: "Abacaxi com Pimenta", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal03", nome: "A Moda", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal04", nome: "Atum", categoria: "Salgadas", preco: 70, custo: 25, ativo: true, vendas: 0 },
  { id: "sal05", nome: "Alemã", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal06", nome: "Aliche", categoria: "Salgadas", preco: 70, custo: 24, ativo: true, vendas: 0 },
  { id: "sal07", nome: "Baiana", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal08", nome: "Baiacatu", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal09", nome: "Barcelona", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal10", nome: "Baronesa", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal11", nome: "Bauru", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal12", nome: "Bauru com Cheddar", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal13", nome: "Brasileirinha de Filé", categoria: "Salgadas", preco: 80, custo: 30, ativo: true, vendas: 0 },
  { id: "sal14", nome: "Brasileirinha de Frango", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal15", nome: "Bolonha", categoria: "Salgadas", preco: 55, custo: 21, ativo: true, vendas: 0 },
  { id: "sal16", nome: "Brócolis", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal17", nome: "Carioca", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal18", nome: "Catuperu", categoria: "Salgadas", preco: 70, custo: 26, ativo: true, vendas: 0 },
  { id: "sal19", nome: "Calacatu", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal20", nome: "Caipira", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal21", nome: "Calabresa", categoria: "Salgadas", preco: 55, custo: 17, ativo: true, vendas: 0 },
  { id: "sal22", nome: "Calabresa Irmãos Braga", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal23", nome: "California", categoria: "Salgadas", preco: 75, custo: 28, ativo: true, vendas: 0 },
  { id: "sal24", nome: "Costela", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal25", nome: "Da Duda", categoria: "Salgadas", preco: 55, custo: 23, ativo: true, vendas: 0 },
  { id: "sal26", nome: "Da Lice", categoria: "Salgadas", preco: 55, custo: 21, ativo: true, vendas: 0 },
  { id: "sal27", nome: "Do Dú", categoria: "Salgadas", preco: 70, custo: 24, ativo: true, vendas: 0 },
  { id: "sal28", nome: "Da Jô", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal29", nome: "Do Juliano", categoria: "Salgadas", preco: 70, custo: 24, ativo: true, vendas: 0 },
  { id: "sal30", nome: "Doritos", categoria: "Salgadas", preco: 75, custo: 26, ativo: true, vendas: 0 },
  { id: "sal31", nome: "Escarola I", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal32", nome: "Escarola II", categoria: "Salgadas", preco: 70, custo: 22, ativo: true, vendas: 0 },
  { id: "sal33", nome: "Escarola da Janete", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal34", nome: "Espanhola", categoria: "Salgadas", preco: 55, custo: 17, ativo: true, vendas: 0 },
  { id: "sal35", nome: "Estrambólica", categoria: "Salgadas", preco: 55, custo: 24, ativo: true, vendas: 0 },
  { id: "sal36", nome: "Francesa", categoria: "Salgadas", preco: 55, custo: 17, ativo: true, vendas: 0 },
  { id: "sal37", nome: "Frango", categoria: "Salgadas", preco: 55, custo: 17, ativo: true, vendas: 0 },
  { id: "sal38", nome: "Frangalho", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal39", nome: "Filé ao Alho", categoria: "Salgadas", preco: 80, custo: 30, ativo: true, vendas: 0 },
  { id: "sal40", nome: "Filé ao Alho Biquinho", categoria: "Salgadas", preco: 80, custo: 31, ativo: true, vendas: 0 },
  { id: "sal41", nome: "Filé Mignon", categoria: "Salgadas", preco: 85, custo: 35, ativo: true, vendas: 0 },
  { id: "sal42", nome: "Gaúcha", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal43", nome: "Ituana", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal44", nome: "Italiana", categoria: "Salgadas", preco: 70, custo: 22, ativo: true, vendas: 0 },
  { id: "sal45", nome: "Inverno", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal46", nome: "Ipanema", categoria: "Salgadas", preco: 70, custo: 23, ativo: true, vendas: 0 },
  { id: "sal47", nome: "Junior", categoria: "Salgadas", preco: 55, custo: 26, ativo: true, vendas: 0 },
  { id: "sal48", nome: "Laputanesca", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal49", nome: "Leda", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal50", nome: "Lombo", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal51", nome: "Lusitânia", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal52", nome: "Madame", categoria: "Salgadas", preco: 70, custo: 26, ativo: true, vendas: 0 },
  { id: "sal53", nome: "Mama Mia", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal54", nome: "Marguerita", categoria: "Salgadas", preco: 55, custo: 16, ativo: true, vendas: 0 },
  { id: "sal55", nome: "Mandala", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal56", nome: "Muçarela", categoria: "Salgadas", preco: 55, custo: 15, ativo: true, vendas: 0 },
  { id: "sal57", nome: "Napolitana", categoria: "Salgadas", preco: 70, custo: 22, ativo: true, vendas: 0 },
  { id: "sal58", nome: "Neco", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal59", nome: "Nova", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal60", nome: "Oba-Oba", categoria: "Salgadas", preco: 55, custo: 21, ativo: true, vendas: 0 },
  { id: "sal61", nome: "Palmito (Capri)", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal62", nome: "Paola", categoria: "Salgadas", preco: 55, custo: 21, ativo: true, vendas: 0 },
  { id: "sal63", nome: "Paulista", categoria: "Salgadas", preco: 55, custo: 17, ativo: true, vendas: 0 },
  { id: "sal64", nome: "Pepperoni", categoria: "Salgadas", preco: 70, custo: 25, ativo: true, vendas: 0 },
  { id: "sal65", nome: "Peruana", categoria: "Salgadas", preco: 70, custo: 24, ativo: true, vendas: 0 },
  { id: "sal66", nome: "Portuguesa", categoria: "Salgadas", preco: 55, custo: 19, ativo: true, vendas: 0 },
  { id: "sal67", nome: "Porto-Seguro", categoria: "Salgadas", preco: 70, custo: 26, ativo: true, vendas: 0 },
  { id: "sal68", nome: "Provençal", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal69", nome: "Quatro Queijos", categoria: "Salgadas", preco: 70, custo: 24, ativo: true, vendas: 0 },
  { id: "sal70", nome: "Quatro Queijos Especial", categoria: "Salgadas", preco: 75, custo: 28, ativo: true, vendas: 0 },
  { id: "sal71", nome: "Rosa", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal72", nome: "Se Liga", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal73", nome: "Sisso", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal74", nome: "Santista", categoria: "Salgadas", preco: 70, custo: 23, ativo: true, vendas: 0 },
  { id: "sal75", nome: "Sara", categoria: "Salgadas", preco: 55, custo: 23, ativo: true, vendas: 0 },
  { id: "sal76", nome: "Siciliana", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal77", nome: "Terra Nostra", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal78", nome: "Tomate Seco", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  { id: "sal79", nome: "Tortoni", categoria: "Salgadas", preco: 55, custo: 21, ativo: true, vendas: 0 },
  { id: "sal80", nome: "Tranqueira", categoria: "Salgadas", preco: 80, custo: 30, ativo: true, vendas: 0 },
  { id: "sal81", nome: "Três Carnes e Um Queijo", categoria: "Salgadas", preco: 55, custo: 22, ativo: true, vendas: 0 },
  { id: "sal82", nome: "Vegetariana", categoria: "Salgadas", preco: 55, custo: 18, ativo: true, vendas: 0 },
  { id: "sal83", nome: "Verona", categoria: "Salgadas", preco: 55, custo: 20, ativo: true, vendas: 0 },
  // ==========================================
  // PIZZAS DOCES COMPLETAS (19 sabores)
  // ==========================================
  { id: "doc01", nome: "Abacaxi Nevado", categoria: "Doces", preco: 55, custo: 16, ativo: true, vendas: 0 },
  { id: "doc02", nome: "2 Amores", categoria: "Doces", preco: 70, custo: 22, ativo: true, vendas: 0 },
  { id: "doc03", nome: "3 Amores", categoria: "Doces", preco: 70, custo: 24, ativo: true, vendas: 0 },
  { id: "doc04", nome: "Banana", categoria: "Doces", preco: 55, custo: 15, ativo: true, vendas: 0 },
  { id: "doc05", nome: "Banana com Brigadeiro", categoria: "Doces", preco: 55, custo: 17, ativo: true, vendas: 0 },
  { id: "doc06", nome: "Banana Fruta", categoria: "Doces", preco: 55, custo: 16, ativo: true, vendas: 0 },
  { id: "doc07", nome: "Banana Nevada", categoria: "Doces", preco: 70, custo: 20, ativo: true, vendas: 0 },
  { id: "doc08", nome: "Banoffe", categoria: "Doces", preco: 70, custo: 22, ativo: true, vendas: 0 },
  { id: "doc09", nome: "Brigadeiro", categoria: "Doces", preco: 55, custo: 14, ativo: true, vendas: 0 },
  { id: "doc10", nome: "Duo", categoria: "Doces", preco: 55, custo: 16, ativo: true, vendas: 0 },
  { id: "doc11", nome: "Ovomaltine", categoria: "Doces", preco: 70, custo: 20, ativo: true, vendas: 0 },
  { id: "doc12", nome: "Prestígio", categoria: "Doces", preco: 70, custo: 22, ativo: true, vendas: 0 },
  { id: "doc13", nome: "Romeu e Julieta", categoria: "Doces", preco: 55, custo: 17, ativo: true, vendas: 0 },
  { id: "doc14", nome: "Nutella", categoria: "Doces", preco: 80, custo: 28, ativo: true, vendas: 0 },
  { id: "doc15", nome: "Nutella com Morango", categoria: "Doces", preco: 85, custo: 32, ativo: true, vendas: 0 },
  { id: "doc16", nome: "Merengue de Morango", categoria: "Doces", preco: 70, custo: 24, ativo: true, vendas: 0 },
  { id: "doc17", nome: "Kit Kat", categoria: "Doces", preco: 75, custo: 26, ativo: true, vendas: 0 },
  { id: "doc18", nome: "Ouro Branco", categoria: "Doces", preco: 75, custo: 26, ativo: true, vendas: 0 },
  { id: "doc19", nome: "Calzone de Beijinho", categoria: "Doces", preco: 60, custo: 18, ativo: true, vendas: 0 },
  // ==========================================
  // BORDAS RECHEADAS
  // ==========================================
  { id: "bor01", nome: "Sem Borda", categoria: "Bordas", preco: 0, custo: 0, ativo: true, vendas: 0 },
  { id: "bor02", nome: "Borda Catupiry", categoria: "Bordas", preco: 12, custo: 4, ativo: true, vendas: 0 },
  { id: "bor03", nome: "Borda Cheddar", categoria: "Bordas", preco: 12, custo: 4, ativo: true, vendas: 0 },
  { id: "bor04", nome: "Borda Chocolate", categoria: "Bordas", preco: 12, custo: 4, ativo: true, vendas: 0 },
  { id: "bor05", nome: "Borda Doce de Leite", categoria: "Bordas", preco: 12, custo: 4, ativo: true, vendas: 0 },
  // ==========================================
  // ESFIHAS (Simples e Premium)
  // ==========================================
  { id: "esf01", nome: "Esfiha Simples (Salgada)", categoria: "Esfihas", preco: 12, custo: 4, ativo: true, vendas: 0 },
  { id: "esf02", nome: "Esfiha Premium (Salgada)", categoria: "Esfihas", preco: 15, custo: 5.5, ativo: true, vendas: 0 },
  { id: "esf03", nome: "Esfiha Simples (Doce)", categoria: "Esfihas", preco: 12, custo: 4, ativo: true, vendas: 0 },
  { id: "esf04", nome: "Esfiha Premium (Doce)", categoria: "Esfihas", preco: 15, custo: 5.5, ativo: true, vendas: 0 },
  { id: "esf05", nome: "Esfiha Especial (Doce)", categoria: "Esfihas", preco: 20, custo: 7, ativo: true, vendas: 0 },
  // ==========================================
  // BEBIDAS
  // ==========================================
  { id: "beb01", nome: "Água 300ml", categoria: "Bebidas", preco: 1, custo: 0.6, ativo: true, vendas: 0 },
  { id: "beb02", nome: "Água com Gás", categoria: "Bebidas", preco: 5, custo: 2.5, ativo: true, vendas: 0 },
  { id: "beb03", nome: "Limão e Gelo", categoria: "Bebidas", preco: 2, custo: 1, ativo: true, vendas: 0 },
  { id: "beb04", nome: "Suco Del Valle (Lata)", categoria: "Bebidas", preco: 7, custo: 4, ativo: true, vendas: 0 },
  { id: "beb05", nome: "Coca-Cola 2L", categoria: "Bebidas", preco: 16, custo: 8, ativo: true, vendas: 0 },
  { id: "beb06", nome: "Sprite 2L", categoria: "Bebidas", preco: 13, custo: 6, ativo: true, vendas: 0 },
  { id: "beb07", nome: "Guaraná Antarctica 2L", categoria: "Bebidas", preco: 14, custo: 6.5, ativo: true, vendas: 0 },
  { id: "beb08", nome: "Coca-Cola 1L", categoria: "Bebidas", preco: 11, custo: 5, ativo: true, vendas: 0 },
  { id: "beb09", nome: "Coca-Cola 600ml", categoria: "Bebidas", preco: 9, custo: 4.5, ativo: true, vendas: 0 },
  { id: "beb10", nome: "Coca-Cola (Lata)", categoria: "Bebidas", preco: 8, custo: 4, ativo: true, vendas: 0 },
  { id: "beb11", nome: "Refrigerante (Lata)", categoria: "Bebidas", preco: 8, custo: 4, ativo: true, vendas: 0 },
  { id: "beb12", nome: "Suco Laranja (Jarra)", categoria: "Bebidas", preco: 18, custo: 8, ativo: true, vendas: 0 },
  { id: "beb13", nome: "Suco Laranja (Copo)", categoria: "Bebidas", preco: 9, custo: 4, ativo: true, vendas: 0 },
  { id: "beb14", nome: "Vinho (Taça)", categoria: "Bebidas", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "beb15", nome: "Eisenbahn (Garrafa)", categoria: "Bebidas", preco: 16, custo: 7, ativo: true, vendas: 0 },
  { id: "beb16", nome: "Antarctica (Garrafa)", categoria: "Bebidas", preco: 13, custo: 5.5, ativo: true, vendas: 0 },
  { id: "beb17", nome: "Heineken (Garrafa)", categoria: "Bebidas", preco: 18, custo: 8, ativo: true, vendas: 0 },
  { id: "beb18", nome: "Antarctica (Lata)", categoria: "Bebidas", preco: 8, custo: 3.5, ativo: true, vendas: 0 },
  // ==========================================
  // ADICIONAIS
  // ==========================================
  { id: "adi01", nome: "Azeitona", categoria: "Adicionais", preco: 5, custo: 2, ativo: true, vendas: 0 },
  { id: "adi02", nome: "Bacon", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi03", nome: "Calabresa Adicional", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi04", nome: "Catupiry Adicional", categoria: "Adicionais", preco: 10, custo: 4, ativo: true, vendas: 0 },
  { id: "adi05", nome: "Cebola Adicional", categoria: "Adicionais", preco: 8, custo: 3, ativo: true, vendas: 0 },
  { id: "adi06", nome: "Champignon", categoria: "Adicionais", preco: 20, custo: 8, ativo: true, vendas: 0 },
  { id: "adi07", nome: "Cheddar Adicional", categoria: "Adicionais", preco: 20, custo: 8, ativo: true, vendas: 0 },
  { id: "adi08", nome: "Gorgonzola", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi09", nome: "Lombo Adicional", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi10", nome: "Milho Adicional", categoria: "Adicionais", preco: 8, custo: 3, ativo: true, vendas: 0 },
  { id: "adi11", nome: "Mussarela Adicional", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi12", nome: "Palmito Adicional", categoria: "Adicionais", preco: 20, custo: 8, ativo: true, vendas: 0 },
  { id: "adi13", nome: "Parmesão Adicional", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi14", nome: "Pimenta Biquinho", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi15", nome: "Presunto Adicional", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi16", nome: "Tomate Adicional", categoria: "Adicionais", preco: 10, custo: 4, ativo: true, vendas: 0 },
  { id: "adi17", nome: "Tomate Seco Adicional", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  { id: "adi18", nome: "Morango Adicional", categoria: "Adicionais", preco: 10, custo: 4, ativo: true, vendas: 0 },
  { id: "adi19", nome: "Chocolate Adicional", categoria: "Adicionais", preco: 12, custo: 5, ativo: true, vendas: 0 },
  // ==========================================
  // RODÍZIO
  // ==========================================
  { id: "rod01", nome: "Rodízio Inteira (12+ anos)", categoria: "Rodízio", preco: 45, custo: 18, ativo: true, vendas: 0 },
  { id: "rod02", nome: "Rodízio Meia (8-11 anos)", categoria: "Rodízio", preco: 22, custo: 9, ativo: true, vendas: 0 },
  { id: "rod03", nome: "Rodízio Infantil (até 7 anos)", categoria: "Rodízio", preco: 0, custo: 0, ativo: true, vendas: 0 },
];

// --------------------------------- Clientes --------------------------------

export type Customer = {
  id: string;
  nome: string;
  telefone: string;
  pedidos: number;
  gasto: number;
  ultimoPedido: number; // dias atrás
  tier: "VIP" | "Recorrente" | "Novo" | "Inativo";
};

export function maskPhone(phone: string) {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length < 4) return phone;
  return `(***) ****-${cleaned.slice(-4)}`;
}

export function buildCustomers(orders: Order[]): Customer[] {
  const map = new Map<
    string,
    { nome: string; telefone: string; pedidos: number; gasto: number; ultimo: number }
  >();
  for (const o of orders) {
    if (o.status === "cancelado") continue;
    const key = o.telefone || o.cliente;
    const prev = map.get(key) ?? {
      nome: o.cliente,
      telefone: o.telefone,
      pedidos: 0,
      gasto: 0,
      ultimo: 0,
    };
    prev.pedidos += 1;
    prev.gasto += o.total;
    prev.ultimo = Math.max(prev.ultimo, new Date(o.createdAt).getTime());
    map.set(key, prev);
  }
  const dia = 86_400_000;
  return [...map.entries()].map(([key, c]) => {
    const ultimoPedido = Math.floor((Date.now() - c.ultimo) / dia);
    const tier: Customer["tier"] =
      ultimoPedido > 30
        ? "Inativo"
        : c.gasto >= 400
          ? "VIP"
          : c.pedidos > 1
            ? "Recorrente"
            : "Novo";
    return {
      id: key,
      nome: c.nome,
      telefone: c.telefone,
      pedidos: c.pedidos,
      gasto: c.gasto,
      ultimoPedido,
      tier,
    };
  });
}

// ------------------------------ Relatórios ---------------------------------

export type Analytics = ReturnType<typeof buildAnalytics>;

const nomesDias = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function buildAnalytics(orders: Order[]) {
  const validos = orders.filter((o) => o.status !== "cancelado");

  // vendas por horário
  const horas = new Map<number, { pedidos: number; receita: number }>();
  for (const o of validos) {
    const h = new Date(o.createdAt).getHours();
    const cur = horas.get(h) ?? { pedidos: 0, receita: 0 };
    cur.pedidos += 1;
    cur.receita += o.total;
    horas.set(h, cur);
  }
  const porHora = [...horas.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([h, v]) => ({ hora: `${String(h).padStart(2, "0")}h`, ...v }));
  const pico = [...porHora].sort((a, b) => b.receita - a.receita)[0];

  // receita por dia da semana
  const dias = nomesDias.map((dia) => ({ dia, receita: 0, promo: 0 }));
  for (const o of validos) {
    const d = new Date(o.createdAt).getDay();
    dias[d].receita += o.total;
    if (o.cupom) dias[d].promo += o.total;
  }
  const porDia = [...dias.slice(1), dias[0]];

  // sabores, meio a meio, bordas, bebidas
  const sabores = new Map<string, { pedidos: number; receita: number }>();
  const combos = new Map<string, number>();
  const bordas = new Map<string, number>();
  const bebidas = new Map<string, { qtd: number; receita: number }>();
  let inteiras = 0;
  let metades = 0;

  for (const o of validos) {
    for (const i of o.itens ?? []) {
      if (i.tipo === "pizza") {
        const lista = i.sabores ?? [];
        if (lista.length > 1) metades += i.qtd;
        else inteiras += i.qtd;
        const fatia = lista.length > 0 ? i.preco / lista.length : 0;
        for (const s of lista) {
          const cur = sabores.get(s) ?? { pedidos: 0, receita: 0 };
          cur.pedidos += i.qtd;
          cur.receita += fatia * i.qtd;
          sabores.set(s, cur);
        }
        if (lista.length === 2) {
          const combo = [...lista].sort().join(" / ");
          combos.set(combo, (combos.get(combo) ?? 0) + i.qtd);
        }
        const b = i.borda?.trim() || "Sem borda";
        bordas.set(b, (bordas.get(b) ?? 0) + i.qtd);
      } else if (i.tipo === "bebida") {
        const nome = i.nome ?? "Bebida";
        const cur = bebidas.get(nome) ?? { qtd: 0, receita: 0 };
        cur.qtd += i.qtd;
        cur.receita += i.preco * i.qtd;
        bebidas.set(nome, cur);
      }
    }
  }

  const totalSabores = [...sabores.values()].reduce((s, v) => s + v.pedidos, 0) || 1;
  const rankingSabores = [...sabores.entries()]
    .map(([sabor, v]) => ({ sabor, ...v, share: (v.pedidos / totalSabores) * 100 }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 10)
    .map((s, idx) => ({ pos: idx + 1, ...s }));

  const meioAMeio = [...combos.entries()]
    .map(([combo, pedidos]) => ({ combo, pedidos }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, 6);

  const totalBordas = [...bordas.values()].reduce((s, v) => s + v, 0) || 1;
  const bordasAdicionais = [...bordas.entries()]
    .map(([nome, pedidos]) => ({ nome, pedidos, share: Math.round((pedidos / totalBordas) * 100) }))
    .sort((a, b) => b.pedidos - a.pedidos);

  const rankingBebidas = [...bebidas.entries()]
    .map(([nome, v]) => ({ nome, ...v }))
    .sort((a, b) => b.qtd - a.qtd);

  // formas de pagamento
  const pag = new Map<string, number>();
  for (const o of validos) pag.set(o.pagamento, (pag.get(o.pagamento) ?? 0) + o.total);
  const totalPag = [...pag.values()].reduce((s, v) => s + v, 0) || 1;
  const pagamentos = [...pag.entries()]
    .map(([nome, valor]) => ({
      nome: pagamentoLabel[nome] ?? nome,
      valor,
      share: Math.round((valor / totalPag) * 100),
    }))
    .sort((a, b) => b.valor - a.valor);

  return {
    porHora,
    pico: pico?.hora ?? "—",
    porDia,
    rankingSabores,
    meioAMeio,
    bordasAdicionais,
    rankingBebidas,
    pagamentos,
    inteiras,
    metades,
  };
}
