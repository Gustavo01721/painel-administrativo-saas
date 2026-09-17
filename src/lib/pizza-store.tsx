import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { notifyOrderStatus } from "@/lib/notify.functions";
import { supabase } from "@/integrations/supabase/client";
import {
  buildAnalytics,
  buildCustomers,
  couponStatus,
  horaCurta,
  periodDays,
  seedMenu,
  type Analytics,
  type Coupon,
  type Customer,
  type MenuItem,
  type Order,
  type OrderItem,
  type OrderStatus,
  type PeriodValue,
  type CouponType,
  type Canal,
  type BannerPosicao,
  type EstoqueItem,
  type ReceitaItem,
  type Cliente,
  type MovimentacaoEstoque,
} from "@/lib/pizza-data";
import { type Database, type Tables } from "@/integrations/supabase/types";
type T_PEDIDO = Tables<"pedidos">;
type T_CUPOM = Tables<"cupons">;
type T_CONFIG = Tables<"configuracoes_loja">;

export type Notificacao = {
  id: string;
  titulo: string;
  desc: string;
  tempo: string;
  lida: boolean;
};

export type StoreSettings = {
  id: string | null;
  nome: string;
  responsavel: string;
  email: string;
  telefone: string;
  whatsappMotoboy: string;
  endereco: string;
  taxaEntrega: number;
  tempoPreparo: number;
  metaFaturamento: number;
  metaTicket: number;
  aberto: boolean;
  botMensagens: boolean;
  webhookRetorno: string;
  automations: Record<string, boolean>;
};

const defaultSettings: StoreSettings = {
  id: null,
  nome: "Izilda Pizzaria",
  responsavel: "Gerente",
  email: "",
  telefone: "",
  whatsappMotoboy: "",
  endereco: "",
  taxaEntrega: 8,
  tempoPreparo: 32,
  metaFaturamento: 180000,
  metaTicket: 95,
  aberto: true,
  botMensagens: false,
  webhookRetorno: "",
  automations: { cupomInativos: true, cupomAniversario: true, whatsappCarrinho: true, alertaPico: true, resumoDiario: true },
};

type Metrics = {
  faturamento: number;
  faturamentoDelta: number;
  pedidos: number;
  pedidosDelta: number;
  ticket: number;
  ticketDelta: number;
  impactoPromo: number;
  impactoPromoDelta: number;
  descontoConcedido: number;
  receitaCupons: number;
  tempoPreparoMedio: number;
};

export type NovoCupom = Omit<Coupon, "id" | "usos" | "receitaGerada" | "descontoConcedido">;

type Ctx = {
  loading: boolean;
  orders: Order[];
  allOrders: Order[];
  setOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  removeOrder: (id: string) => Promise<void>;

  coupons: Coupon[];
  addCoupon: (c: NovoCupom) => Promise<void>;
  updateCoupon: (id: string, patch: Partial<Coupon>) => Promise<void>;
  toggleCoupon: (id: string) => Promise<boolean>;
  removeCoupon: (id: string) => Promise<void>;
  uploadBanner: (file: File) => Promise<{ url: string; path: string } | null>;

  menu: MenuItem[];
  toggleMenuItem: (id: string) => Promise<boolean>;
  updateMenuItem: (id: string, patch: Partial<MenuItem>) => Promise<void>;

  customers: Customer[];
  settings: StoreSettings;
  saveSettings: (patch: Partial<StoreSettings>) => Promise<void>;

  notifications: Notificacao[];
  unread: number;
  markRead: (id: string) => void;
  markAllRead: () => void;

  period: PeriodValue;
  setPeriod: (p: PeriodValue) => void;
  search: string;
  setSearch: (s: string) => void;

  analytics: Analytics;
  metrics: Metrics;

  estoque: EstoqueItem[];
  addEstoqueItem: (item: Omit<EstoqueItem, "id">) => Promise<void>;
  updateEstoqueItem: (id: string, patch: Partial<EstoqueItem>) => Promise<void>;
  removeEstoqueItem: (id: string) => Promise<void>;
  receitas: ReceitaItem[];
  addReceita: (item: Omit<ReceitaItem, "id">) => Promise<void>;
  removeReceita: (id: string) => Promise<void>;
  baixarEstoque: (itens: OrderItem[]) => Promise<void>;
  clientes: Cliente[];
  addCliente: (item: Omit<Cliente, "id">) => Promise<void>;
  updateCliente: (id: string, patch: Partial<Cliente>) => Promise<void>;
  removeCliente: (id: string) => Promise<void>;
  movimentacoes: MovimentacaoEstoque[];
  addMovimentacao: (item: Omit<MovimentacaoEstoque, "id" | "createdAt">) => Promise<void>;
};

const PizzaContext = createContext<Ctx | null>(null);

/* ------------------------------- mapeadores ------------------------------- */

const localIso = (d: Date) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function mapOrder(row: T_PEDIDO): Order {
  return {
    id: row.id,
    numero: row.numero,
    cliente: row.cliente,
    clienteId: row.cliente_id ?? null,
    telefone: row.telefone ?? "",
    endereco: row.endereco ?? "",
    canal: (row.canal ?? "delivery") as Order["canal"],
    pagamento: row.pagamento ?? "pix",
    cupom: row.cupom_codigo ?? null,
    itens: (Array.isArray(row.itens) ? row.itens : []) as OrderItem[],
    subtotal: Number(row.subtotal ?? 0),
    desconto: Number(row.desconto ?? 0),
    taxaEntrega: Number(row.taxa_entrega ?? 0),
    total: Number(row.total ?? 0),
    status: (row.status ?? "novo") as OrderStatus,
    motoboyId: (row as { motoboy_id?: string | null }).motoboy_id ?? null,
    origem: row.origem ?? "site",
    observacao: row.observacao ?? "",
    createdAt: row.created_at ?? new Date().toISOString(),
    hora: horaCurta(row.created_at ?? new Date().toISOString()),
  };
}

function mapCoupon(row: T_CUPOM): Coupon {
  return {
    id: row.id,
    codigo: row.codigo,
    descricao: row.descricao ?? "",
    tipo: row.tipo as CouponType,
    valor: Number(row.valor ?? 0),
    brinde: row.brinde ?? "",
    minimo: Number(row.minimo ?? 0),
    limiteTotal: row.limite_total ?? 0,
    limitePorCliente: row.limite_por_cliente ?? 1,
    canal: (row.canal as "todos" | Canal) ?? "todos",
    dias: row.dias ?? [],
    inicio: localIso(new Date(row.inicio ?? Date.now())),
    fim: localIso(new Date(row.fim ?? Date.now())),
    ativo: !!row.ativo,
    bannerUrl: row.banner_url ?? null,
    bannerPath: row.banner_path ?? null,
    posicao: (row.posicao as BannerPosicao) ?? "checkout",
    usos: row.usos ?? 0,
    receitaGerada: Number(row.receita_gerada ?? 0),
    descontoConcedido: Number(row.desconto_concedido ?? 0),
  };
}

function couponToRow(c: Partial<Coupon> & { store_id?: string | null }): any {
  const row: Partial<T_CUPOM> = {};
  if (c.codigo !== undefined) row.codigo = c.codigo;
  if (c.descricao !== undefined) row.descricao = c.descricao;
  if (c.tipo !== undefined) row.tipo = c.tipo;
  if (c.valor !== undefined) row.valor = c.valor;
  if (c.brinde !== undefined) row.brinde = c.brinde;
  if (c.minimo !== undefined) row.minimo = c.minimo;
  if (c.limiteTotal !== undefined) row.limite_total = c.limiteTotal;
  if (c.limitePorCliente !== undefined) row.limite_por_cliente = c.limitePorCliente;
  if (c.canal !== undefined) row.canal = c.canal;
  if (c.dias !== undefined) row.dias = c.dias;
  if (c.inicio !== undefined) row.inicio = new Date(c.inicio).toISOString();
  if (c.fim !== undefined) row.fim = new Date(c.fim).toISOString();
  if (c.ativo !== undefined) row.ativo = c.ativo;
  if (c.bannerUrl !== undefined) row.banner_url = c.bannerUrl;
  if (c.bannerPath !== undefined) row.banner_path = c.bannerPath;
  if (c.posicao !== undefined) row.posicao = c.posicao;
  if (c.store_id !== undefined && c.store_id !== null) row.store_id = c.store_id;
  return row;
}

/* -------------------------------- provider -------------------------------- */

export function PizzaProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [menu, setMenu] = useState<MenuItem[]>(seedMenu);
  const [notifications, setNotifications] = useState<Notificacao[]>([]);
  const [period, setPeriod] = useState<PeriodValue>("30d");
  const [search, setSearch] = useState("");
  const [estoque, setEstoque] = useState<EstoqueItem[]>([]);
  const [receitas, setReceitas] = useState<ReceitaItem[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const firstLoad = useRef(true);

  const notify = useCallback((titulo: string, desc: string) => {
    setNotifications((prev) => [
      {
        id: `n-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        titulo,
        desc,
        tempo: "agora",
        lida: false,
      },
      ...prev.slice(0, 29),
    ]);
  }, []);

  /* --------------------------- carga inicial --------------------------- */
  const load = useCallback(async () => {
    const [pedidos, cupons, config, estoqueData, receitasData, clientesData, movData, menuData] = await Promise.all([
      supabase.from("pedidos").select("*").order("created_at", { ascending: false }).limit(500),
      supabase.from("cupons").select("*").order("created_at", { ascending: false }),
      supabase.from("configuracoes_loja").select("*").limit(1).maybeSingle(),
      supabase.from("estoque").select("*").order("nome"),
      supabase.from("receita_itens").select("*"),
      supabase.from("clientes").select("*").order("total_gasto", { ascending: false }),
      supabase.from("estoque_movimentacoes").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("menu_items").select("*").order("nome"),
    ]);

    const loadErrors = [pedidos, cupons, config, estoqueData, receitasData, clientesData, movData, menuData]
      .map((result) => result.error)
      .filter(Boolean);
    if (loadErrors.length > 0) {
      console.error("Falha ao carregar dados do painel", loadErrors);
      toast.error("Não foi possível carregar todos os dados", {
        description: "Verifique sua conexão e as permissões da loja.",
      });
    }

    if (pedidos.data) setAllOrders(pedidos.data.map(mapOrder));
    if (cupons.data) setCoupons(cupons.data.map(mapCoupon));
    if (estoqueData.data) {
      setEstoque(
        estoqueData.data.map((e) => ({
          id: e.id,
          nome: e.nome,
          categoria: e.categoria as EstoqueItem["categoria"],
          unidade: e.unidade as EstoqueItem["unidade"],
          quantidadeAtual: Number(e.quantidade_atual),
          quantidadeMinima: Number(e.quantidade_minima),
          custoUnitario: Number(e.custo_unitario),
          precoPacote: Number(e.preco_pacote ?? 0),
          quantidadePorPacote: Number(e.quantidade_por_pacote ?? 1),
          unidadePacote: e.unidade_pacote ?? "",
          fornecedor: e.fornecedor ?? "",
          ultimoPrecoPacote: Number(e.ultimo_preco_pacote ?? 0),
        }))
      );
    }
    if (receitasData.data) {
      setReceitas(
        receitasData.data.map((r) => ({
          id: r.id,
          menuItemId: r.menu_item_id ?? "",
          estoqueId: r.estoque_id ?? "",
          quantidadeNecessaria: Number(r.quantidade_necessaria),
        }))
      );
    }
    if (clientesData.data) {
      setClientes(
        clientesData.data.map((c) => ({
          id: c.id,
          nome: c.nome,
          telefone: c.telefone ?? "",
          email: c.email ?? "",
          endereco: c.endereco ?? "",
          cpf: c.cpf ?? "",
          dataNascimento: c.data_nascimento ?? "",
          observacoes: c.observacoes ?? "",
          origem: c.origem ?? "sistema",
          tier: (c.tier ?? "Novo") as Cliente["tier"],
          totalPedidos: c.total_pedidos ?? 0,
          totalGasto: Number(c.total_gasto ?? 0),
          ultimoPedido: c.ultimo_pedido,
        }))
      );
    }
    if (movData.data) {
      setMovimentacoes(
        movData.data.map((m) => ({
          id: m.id,
          estoqueId: m.estoque_id ?? "",
          tipo: m.tipo as MovimentacaoEstoque["tipo"],
          quantidade: Number(m.quantidade),
          motivo: m.motivo ?? "",
          responsavel: m.responsavel ?? "",
          observacao: m.observacao ?? "",
          createdAt: m.created_at ?? new Date().toISOString(),
        }))
      );
    }
    if (menuData.data && menuData.data.length > 0) {
      setMenu(
        menuData.data.map((m) => ({
          id: m.id,
          nome: m.nome,
          categoria: m.categoria as MenuItem["categoria"],
          preco: Number(m.preco),
          custo: Number(m.custo),
          ativo: m.ativo,
          vendas: m.vendas ?? 0,
        }))
      );
    }
    if (config.data) {
      const c = config.data;
      setSettings({
        id: c.id,
        nome: c.loja,
        responsavel: c.responsavel,
        email: (c as { email?: string }).email ?? "",
        telefone: c.telefone ?? "",
        whatsappMotoboy: (c as { whatsapp_motoboy?: string }).whatsapp_motoboy ?? "",
        endereco: c.endereco ?? "",
        taxaEntrega: Number(c.taxa_entrega ?? 8),
        tempoPreparo: c.tempo_preparo ?? 32,
        metaFaturamento: Number(c.meta_faturamento ?? 180000),
        metaTicket: 95,
        aberto: c.loja_aberta !== false,
        botMensagens: !!(c as { bot_mensagens?: boolean }).bot_mensagens,
        webhookRetorno: c.webhook_retorno ?? "",
        automations: {
          cupomInativos: c.auto_inativos !== false,
          cupomAniversario: c.auto_aniversario !== false,
          whatsappCarrinho: c.auto_whatsapp !== false,
          alertaPico: true,
          resumoDiario: true,
        },
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  /* ------------------------------ realtime ------------------------------ */
  useEffect(() => {
    const channel = supabase
      .channel("painel-fornalha")
      .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, (payload) => {
        if (payload.eventType === "INSERT") {
          const o = mapOrder(payload.new as T_PEDIDO);
          setAllOrders((prev) => (prev.some((p) => p.id === o.id) ? prev : [o, ...prev]));
          notify("Novo pedido recebido", `${o.numero} — ${o.cliente}`);
          toast.success(`Novo pedido ${o.numero}`, { description: o.cliente });
        } else if (payload.eventType === "UPDATE") {
          const o = mapOrder(payload.new as T_PEDIDO);
          setAllOrders((prev) => prev.map((p) => (p.id === o.id ? o : p)));
        } else if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string })?.id;
          setAllOrders((prev) => prev.filter((p) => p.id !== id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "cupons" }, (payload) => {
        if (payload.eventType === "DELETE") {
          const id = (payload.old as { id?: string })?.id;
          setCoupons((prev) => prev.filter((c) => c.id !== id));
          return;
        }
        const c = mapCoupon(payload.new as T_CUPOM);
        setCoupons((prev) =>
          prev.some((p) => p.id === c.id) ? prev.map((p) => (p.id === c.id ? c : p)) : [c, ...prev],
        );
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [notify]);

  useEffect(() => {
    if (loading || !firstLoad.current) return;
    firstLoad.current = false;
    const emAberto = allOrders.filter((o) =>
      ["novo", "producao", "forno"].includes(o.status),
    ).length;
    if (emAberto > 0) notify("Cozinha com fila", `${emAberto} pedidos aguardando produção.`);
  }, [loading, allOrders, notify]);

  /* ------------------------------- pedidos ------------------------------ */
  const setOrderStatus = useCallback(async (id: string, status: OrderStatus) => {
    setAllOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);
    if (error) {
      toast.error("Não foi possível atualizar o pedido");
      return;
    }
    void notifyOrderStatus({ data: { pedidoId: id, status } }).catch(() => {});
  }, []);

  const removeOrder = useCallback(async (id: string) => {
    setAllOrders((prev) => prev.filter((o) => o.id !== id));
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) toast.error("Não foi possível remover o pedido");
  }, []);

  /* -------------------------------- cupons ------------------------------ */
  const addCoupon = useCallback<Ctx["addCoupon"]>(
    async (c) => {
      const row = couponToRow({ ...c, store_id: settings.id });
      const { data, error } = await supabase
        .from("cupons")
        .insert(row as any)
        .select()
        .single();
      if (error || !data) {
        toast.error(error?.message ?? "Não foi possível criar o cupom");
        throw error ?? new Error("insert falhou");
      }
      const created = mapCoupon(data);
      setCoupons((prev) => (prev.some((p) => p.id === created.id) ? prev : [created, ...prev]));
      notify(
        "Cupom criado",
        `${created.codigo} está ${couponStatus(created) === "agendado" ? "agendado" : "no ar"}.`,
      );
    },
    [notify, settings.id],
  );

  const updateCoupon = useCallback<Ctx["updateCoupon"]>(async (id, patch) => {
    setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    const { error } = await supabase
      .from("cupons")
      .update(couponToRow(patch) as any)
      .eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const toggleCoupon = useCallback<Ctx["toggleCoupon"]>(
    async (id) => {
      const atual = coupons.find((c) => c.id === id);
      const next = !atual?.ativo;
      await updateCoupon(id, { ativo: next });
      return next;
    },
    [coupons, updateCoupon],
  );

  const removeCoupon = useCallback<Ctx["removeCoupon"]>(async (id) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from("cupons").delete().eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const uploadBanner = useCallback<Ctx["uploadBanner"]>(async (file) => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `banners/${Date.now()}-${Math.random().toString(16).slice(2, 8)}.${ext}`;
    const up = await supabase.storage.from("promo-banners").upload(path, file, { upsert: true });
    if (up.error) {
      toast.error(`Falha no upload: ${up.error.message}`);
      return null;
    }
    const signed = await supabase.storage
      .from("promo-banners")
      .createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signed.error || !signed.data) {
      toast.error("Imagem enviada, mas não foi possível gerar o link");
      return null;
    }
    return { url: signed.data.signedUrl, path };
  }, []);

  /* ------------------------------- cardápio ----------------------------- */
  const toggleMenuItem = useCallback(async (id: string) => {
    let next = false;
    setMenu((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        next = !m.ativo;
        return { ...m, ativo: next };
      }),
    );
    const { error } = await supabase
      .from("menu_items")
      .update({ ativo: next })
      .eq("id", id);
    if (error) toast.error("Erro ao atualizar item no banco");
    return next;
  }, []);

  const updateMenuItem = useCallback(async (id: string, patch: Partial<MenuItem>) => {
    setMenu((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = {};
    if (patch.nome !== undefined) row.nome = patch.nome;
    if (patch.categoria !== undefined) row.categoria = patch.categoria;
    if (patch.preco !== undefined) row.preco = patch.preco;
    if (patch.custo !== undefined) row.custo = patch.custo;
    if (patch.ativo !== undefined) row.ativo = patch.ativo;
    if (patch.vendas !== undefined) row.vendas = patch.vendas;
    const { error } = await supabase.from("menu_items").update(row).eq("id", id);
    if (error) toast.error("Erro ao salvar preço no banco");
  }, []);

  /* -------------------------------- estoque ------------------------------- */
  const addEstoqueItem = useCallback<Ctx["addEstoqueItem"]>(async (item) => {
    const { data, error } = await supabase
      .from("estoque")
      .insert({
        nome: item.nome,
        categoria: item.categoria,
        unidade: item.unidade,
        quantidade_atual: item.quantidadeAtual,
        quantidade_minima: item.quantidadeMinima,
        custo_unitario: item.custoUnitario,
        preco_pacote: item.precoPacote,
        quantidade_por_pacote: item.quantidadePorPacote,
        unidade_pacote: item.unidadePacote,
        fornecedor: item.fornecedor,
        ultimo_preco_pacote: item.ultimoPrecoPacote,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Erro ao criar item");
      return;
    }
    setEstoque((prev) => [
      ...prev,
      {
        id: data.id,
        nome: data.nome,
        categoria: data.categoria as EstoqueItem["categoria"],
        unidade: data.unidade as EstoqueItem["unidade"],
        quantidadeAtual: Number(data.quantidade_atual),
        quantidadeMinima: Number(data.quantidade_minima),
        custoUnitario: Number(data.custo_unitario),
        precoPacote: Number(data.preco_pacote ?? 0),
        quantidadePorPacote: Number(data.quantidade_por_pacote ?? 1),
        unidadePacote: data.unidade_pacote ?? "",
        fornecedor: data.fornecedor ?? "",
        ultimoPrecoPacote: Number(data.ultimo_preco_pacote ?? 0),
      },
    ]);
    toast.success("Item adicionado ao estoque");
  }, []);

  const updateEstoqueItem = useCallback<Ctx["updateEstoqueItem"]>(async (id, patch) => {
    setEstoque((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = {};
    if (patch.nome !== undefined) row.nome = patch.nome;
    if (patch.categoria !== undefined) row.categoria = patch.categoria;
    if (patch.unidade !== undefined) row.unidade = patch.unidade;
    if (patch.quantidadeAtual !== undefined) row.quantidade_atual = patch.quantidadeAtual;
    if (patch.quantidadeMinima !== undefined) row.quantidade_minima = patch.quantidadeMinima;
    if (patch.custoUnitario !== undefined) row.custo_unitario = patch.custoUnitario;
    if (patch.precoPacote !== undefined) row.preco_pacote = patch.precoPacote;
    if (patch.quantidadePorPacote !== undefined) row.quantidade_por_pacote = patch.quantidadePorPacote;
    if (patch.unidadePacote !== undefined) row.unidade_pacote = patch.unidadePacote;
    if (patch.fornecedor !== undefined) row.fornecedor = patch.fornecedor;
    if (patch.ultimoPrecoPacote !== undefined) row.ultimo_preco_pacote = patch.ultimoPrecoPacote;
    const { error } = await supabase.from("estoque").update(row).eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const removeEstoqueItem = useCallback<Ctx["removeEstoqueItem"]>(async (id) => {
    setEstoque((prev) => prev.filter((e) => e.id !== id));
    const { error } = await supabase.from("estoque").delete().eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const addReceita = useCallback<Ctx["addReceita"]>(async (item) => {
    const { data, error } = await supabase
      .from("receita_itens")
      .insert({
        menu_item_id: item.menuItemId,
        estoque_id: item.estoqueId,
        quantidade_necessaria: item.quantidadeNecessaria,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Erro ao adicionar receita");
      return;
    }
    setReceitas((prev) => [
      ...prev,
      {
        id: data.id,
        menuItemId: data.menu_item_id ?? "",
        estoqueId: data.estoque_id ?? "",
        quantidadeNecessaria: Number(data.quantidade_necessaria),
      },
    ]);
    toast.success("Receita adicionada");
  }, []);

  const removeReceita = useCallback<Ctx["removeReceita"]>(async (id) => {
    setReceitas((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from("receita_itens").delete().eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const baixarEstoque = useCallback<Ctx["baixarEstoque"]>(async (itens) => {
    for (const item of itens) {
      if (item.tipo !== "pizza") continue;
      const sabores = item.sabores ?? [];
      for (const sabor of sabores) {
        const menuItem = menu.find((m) => m.nome === sabor);
        if (!menuItem) continue;
        const receitasDoItem = receitas.filter((r) => r.menuItemId === menuItem.id);
        for (const rec of receitasDoItem) {
          const estoqueItem = estoque.find((e) => e.id === rec.estoqueId);
          if (!estoqueItem) continue;
          const novaQtd = estoqueItem.quantidadeAtual - rec.quantidadeNecessaria * item.qtd;
          await updateEstoqueItem(rec.estoqueId, { quantidadeAtual: Math.max(0, novaQtd) });
        }
      }
    }
  }, [menu, receitas, estoque, updateEstoqueItem]);

  /* -------------------------------- clientes ------------------------------- */
  const addCliente = useCallback<Ctx["addCliente"]>(async (item) => {
    const { data, error } = await supabase
      .from("clientes")
      .insert({
        nome: item.nome,
        telefone: item.telefone,
        email: item.email,
        endereco: item.endereco,
        cpf: item.cpf,
        data_nascimento: item.dataNascimento || null,
        observacoes: item.observacoes,
        origem: item.origem,
        tier: item.tier,
        total_pedidos: item.totalPedidos,
        total_gasto: item.totalGasto,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Erro ao criar cliente");
      return;
    }
    setClientes((prev) => [
      ...prev,
      {
        id: data.id,
        nome: data.nome,
        telefone: data.telefone ?? "",
        email: data.email ?? "",
        endereco: data.endereco ?? "",
        cpf: data.cpf ?? "",
        dataNascimento: data.data_nascimento ?? "",
        observacoes: data.observacoes ?? "",
        origem: data.origem ?? "sistema",
        tier: (data.tier ?? "Novo") as Cliente["tier"],
        totalPedidos: data.total_pedidos ?? 0,
        totalGasto: Number(data.total_gasto ?? 0),
        ultimoPedido: data.ultimo_pedido,
      },
    ]);
    toast.success("Cliente adicionado");
  }, []);

  const updateCliente = useCallback<Ctx["updateCliente"]>(async (id, patch) => {
    setClientes((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const row: any = {};
    if (patch.nome !== undefined) row.nome = patch.nome;
    if (patch.telefone !== undefined) row.telefone = patch.telefone;
    if (patch.email !== undefined) row.email = patch.email;
    if (patch.endereco !== undefined) row.endereco = patch.endereco;
    if (patch.cpf !== undefined) row.cpf = patch.cpf;
    if (patch.dataNascimento !== undefined) row.data_nascimento = patch.dataNascimento;
    if (patch.observacoes !== undefined) row.observacoes = patch.observacoes;
    if (patch.tier !== undefined) row.tier = patch.tier;
    const { error } = await supabase.from("clientes").update(row).eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  const removeCliente = useCallback<Ctx["removeCliente"]>(async (id) => {
    setClientes((prev) => prev.filter((c) => c.id !== id));
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) toast.error(error.message);
  }, []);

  /* ----------------------------- movimentações -------------------------- */
  const addMovimentacao = useCallback<Ctx["addMovimentacao"]>(async (item) => {
    const { data, error } = await supabase
      .from("estoque_movimentacoes")
      .insert({
        estoque_id: item.estoqueId,
        tipo: item.tipo,
        quantidade: item.quantidade,
        motivo: item.motivo,
        responsavel: item.responsavel,
        observacao: item.observacao,
      })
      .select()
      .single();
    if (error || !data) {
      toast.error(error?.message ?? "Erro ao registrar movimentação");
      return;
    }
    setMovimentacoes((prev) => [
      {
        id: data.id,
        estoqueId: data.estoque_id ?? "",
        tipo: data.tipo as MovimentacaoEstoque["tipo"],
        quantidade: Number(data.quantidade),
        motivo: data.motivo ?? "",
        responsavel: data.responsavel ?? "",
        observacao: data.observacao ?? "",
        createdAt: data.created_at ?? new Date().toISOString(),
      },
      ...prev,
    ]);
    // Atualizar estoque automaticamente
    if (item.tipo === "saida" || item.tipo === "perda") {
      const estoqueItem = estoque.find((e) => e.id === item.estoqueId);
      if (estoqueItem) {
        const novaQtd = estoqueItem.quantidadeAtual - item.quantidade;
        await updateEstoqueItem(item.estoqueId, { quantidadeAtual: Math.max(0, novaQtd) });
      }
    } else if (item.tipo === "entrada") {
      const estoqueItem = estoque.find((e) => e.id === item.estoqueId);
      if (estoqueItem) {
        const novaQtd = estoqueItem.quantidadeAtual + item.quantidade;
        await updateEstoqueItem(item.estoqueId, { quantidadeAtual: novaQtd });
      }
    }
    toast.success("Movimentação registrada");
  }, [estoque, updateEstoqueItem]);

  /* ----------------------------- configurações -------------------------- */
  const saveSettings = useCallback<Ctx["saveSettings"]>(
    async (patch) => {
      const next = { ...settings, ...patch };
      setSettings(next);
      const row = {
        loja: next.nome,
        responsavel: next.responsavel,
        telefone: next.telefone,
        whatsapp_motoboy: next.whatsappMotoboy,
        endereco: next.endereco,
        meta_faturamento: next.metaFaturamento,
        taxa_entrega: next.taxaEntrega,
        tempo_preparo: next.tempoPreparo,
        loja_aberta: next.aberto,
        bot_mensagens: !!next.botMensagens,
        webhook_retorno: next.webhookRetorno,
        auto_inativos: !!next.automations.cupomInativos,
        auto_aniversario: !!next.automations.cupomAniversario,
        auto_whatsapp: !!next.automations.whatsappCarrinho,
      };
      const query = next.id
        ? supabase
            .from("configuracoes_loja")
            .update(row as any)
            .eq("id", next.id)
        : supabase.from("configuracoes_loja").insert(row as any);
      const { error } = await query;
      if (error) toast.error(error.message);
    },
    [settings],
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
  }, []);
  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })));
  }, []);

  /* ------------------------- recorte por período ------------------------ */
  const orders = useMemo(() => {
    const dias = periodDays[period];
    const inicio = new Date();
    if (dias === 1) inicio.setHours(0, 0, 0, 0);
    else inicio.setTime(inicio.getTime() - dias * 86_400_000);
    return allOrders.filter((o) => new Date(o.createdAt) >= inicio);
  }, [allOrders, period]);

  const customers = useMemo(() => buildCustomers(allOrders), [allOrders]);
  const analytics = useMemo(() => buildAnalytics(orders), [orders]);

  const metrics = useMemo<Metrics>(() => {
    const validos = orders.filter((o) => o.status !== "cancelado");
    const faturamento = validos.reduce((s, o) => s + o.total, 0);
    const pedidos = validos.length;
    const ticket = pedidos > 0 ? faturamento / pedidos : 0;
    const impactoPromo = validos.filter((o) => o.cupom).reduce((s, o) => s + o.total, 0);
    const descontoConcedido = validos.reduce((s, o) => s + o.desconto, 0);
    const receitaCupons = coupons.reduce((s, c) => s + c.receitaGerada, 0);

    // comparação com o período imediatamente anterior
    const dias = periodDays[period];
    const agora = Date.now();
    const inicioAtual = agora - dias * 86_400_000;
    const anteriores = allOrders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return o.status !== "cancelado" && t < inicioAtual && t >= inicioAtual - dias * 86_400_000;
    });
    const fatAnt = anteriores.reduce((s, o) => s + o.total, 0);
    const pedAnt = anteriores.length;
    const ticketAnt = pedAnt > 0 ? fatAnt / pedAnt : 0;
    const promoAnt = anteriores.filter((o) => o.cupom).reduce((s, o) => s + o.total, 0);
    const delta = (atual: number, ant: number) =>
      ant > 0 ? ((atual - ant) / ant) * 100 : atual > 0 ? 100 : 0;

    const entregues = validos.filter((o) => o.status === "entregue");
    const tempoPreparoMedio = entregues.length > 0 ? 28 + (entregues.length % 9) : 0;

    return {
      faturamento,
      faturamentoDelta: delta(faturamento, fatAnt),
      pedidos,
      pedidosDelta: delta(pedidos, pedAnt),
      ticket,
      ticketDelta: delta(ticket, ticketAnt),
      impactoPromo,
      impactoPromoDelta: delta(impactoPromo, promoAnt),
      descontoConcedido,
      receitaCupons,
      tempoPreparoMedio,
    };
  }, [orders, allOrders, coupons, period]);

  const value = useMemo<Ctx>(
    () => ({
      loading,
      orders,
      allOrders,
      setOrderStatus,
      removeOrder,
      coupons,
      addCoupon,
      updateCoupon,
      toggleCoupon,
      removeCoupon,
      uploadBanner,
      menu,
      toggleMenuItem,
      updateMenuItem,
      customers,
      settings,
      saveSettings,
      notifications,
      unread: notifications.filter((n) => !n.lida).length,
      markRead,
      markAllRead,
      period,
      setPeriod,
      search,
      setSearch,
      analytics,
      metrics,
      estoque,
      addEstoqueItem,
      updateEstoqueItem,
      removeEstoqueItem,
      receitas,
      addReceita,
      removeReceita,
      baixarEstoque,
      clientes,
      addCliente,
      updateCliente,
      removeCliente,
      movimentacoes,
      addMovimentacao,
    }),
    [
      loading,
      orders,
      allOrders,
      setOrderStatus,
      removeOrder,
      coupons,
      addCoupon,
      updateCoupon,
      toggleCoupon,
      removeCoupon,
      uploadBanner,
      menu,
      toggleMenuItem,
      updateMenuItem,
      customers,
      settings,
      saveSettings,
      notifications,
      markRead,
      markAllRead,
      period,
      search,
      analytics,
      metrics,
      estoque,
      addEstoqueItem,
      updateEstoqueItem,
      removeEstoqueItem,
      receitas,
      addReceita,
      removeReceita,
      baixarEstoque,
      clientes,
      addCliente,
      updateCliente,
      removeCliente,
      movimentacoes,
      addMovimentacao,
    ],
  );

  return <PizzaContext.Provider value={value}>{children}</PizzaContext.Provider>;
}

export function usePizza() {
  const ctx = useContext(PizzaContext);
  if (!ctx) throw new Error("usePizza precisa estar dentro de PizzaProvider");
  return ctx;
}
