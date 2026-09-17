import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { usePizza } from "@/lib/pizza-store";
import {
  currency,
  estoqueCategoriaOptions,
  estoqueUnidadeOptions,
  movimentacaoTipoOptions,
  movimentacaoMotivoOptions,
  type EstoqueCategoria,
  type EstoqueUnidade,
  type EstoqueItem,
} from "@/lib/pizza-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Package, AlertTriangle, Plus, Trash2, ArrowDown, ArrowUp, History } from "lucide-react";

export const Route = createFileRoute("/_authenticated/estoque")({
  head: () => ({
    meta: [
      { title: "Estoque — Painel Administrativo" },
      {
        name: "description",
        content: "Controle de insumos, estoque mínimo e custos da pizzaria.",
      },
      { property: "og:title", content: "Estoque — Painel Administrativo" },
      {
        property: "og:description",
        content: "Gerencie insumos, alertas de estoque baixo e custos por item.",
      },
    ],
  }),
  component: EstoquePage,
});

const categoriasFiltro = ["Todas", ...estoqueCategoriaOptions] as const;

function EstoquePage() {
  const { estoque, addEstoqueItem, updateEstoqueItem, removeEstoqueItem, movimentacoes, addMovimentacao } = usePizza();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSaidaOpen, setDialogSaidaOpen] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<(typeof categoriasFiltro)[number]>("Todas");
  const [abaTab, setAbaTab] = useState<"estoque" | "movimentacoes">("estoque");

  // Form novo item
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<EstoqueCategoria>("Laticínios");
  const [unidade, setUnidade] = useState<EstoqueUnidade>("kg");
  const [qtdAtual, setQtdAtual] = useState("");
  const [qtdMinima, setQtdMinima] = useState("");
  const [custo, setCusto] = useState("");
  // Pacote
  const [precoPacote, setPrecoPacote] = useState("");
  const [qtdPorPacote, setQtdPorPacote] = useState("");
  const [unidadePacote, setUnidadePacote] = useState("");
  const [fornecedor, setFornecedor] = useState("");

  // Form saída
  const [saidaEstoqueId, setSaidaEstoqueId] = useState("");
  const [saidaQtd, setSaidaQtd] = useState("");
  const [saidaMotivo, setSaidaMotivo] = useState("Produção de pizza");
  const [saidaResponsavel, setSaidaResponsavel] = useState("");
  const [saidaObservacao, setSaidaObservacao] = useState("");

  const lista = estoque.filter(
    (e) => filtro === "Todas" || e.categoria === filtro,
  );

  const itensAbaixoMinimo = estoque.filter((e) => e.quantidadeAtual <= e.quantidadeMinima);
  const valorTotalEstoque = estoque.reduce((s, e) => s + e.quantidadeAtual * e.custoUnitario, 0);

  const limparForm = () => {
    setNome("");
    setCategoria("Laticínios");
    setUnidade("kg");
    setQtdAtual("");
    setQtdMinima("");
    setCusto("");
    setPrecoPacote("");
    setQtdPorPacote("");
    setUnidadePacote("");
    setFornecedor("");
    setEditando(null);
  };

  const limparFormSaida = () => {
    setSaidaEstoqueId("");
    setSaidaQtd("");
    setSaidaMotivo("Produção de pizza");
    setSaidaResponsavel("");
    setSaidaObservacao("");
  };

  const abrirEdicao = (item: EstoqueItem) => {
    setEditando(item.id);
    setNome(item.nome);
    setCategoria(item.categoria);
    setUnidade(item.unidade);
    setQtdAtual(String(item.quantidadeAtual));
    setQtdMinima(String(item.quantidadeMinima));
    setCusto(String(item.custoUnitario));
    setPrecoPacote(String(item.precoPacote || ""));
    setQtdPorPacote(String(item.quantidadePorPacote || ""));
    setUnidadePacote(item.unidadePacote || "");
    setFornecedor(item.fornecedor || "");
    setDialogOpen(true);
  };

  const salvar = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do insumo");
      return;
    }
    const qtd = Number(qtdAtual.replace(",", "."));
    const min = Number(qtdMinima.replace(",", "."));
    const c = Number(custo.replace(",", "."));
    const precoPct = Number(precoPacote.replace(",", "."));
    const qtdPct = Number(qtdPorPacote.replace(",", "."));
    if (isNaN(qtd) || isNaN(min) || isNaN(c)) {
      toast.error("Preencha todos os campos numéricos");
      return;
    }

    const dados = {
      nome: nome.trim(),
      categoria,
      unidade,
      quantidadeAtual: qtd,
      quantidadeMinima: min,
      custoUnitario: c,
      precoPacote: isNaN(precoPct) ? 0 : precoPct,
      quantidadePorPacote: isNaN(qtdPct) ? 1 : qtdPct,
      unidadePacote: unidadePacote.trim(),
      fornecedor: fornecedor.trim(),
      ultimoPrecoPacote: isNaN(precoPct) ? 0 : precoPct,
    };

    if (editando) {
      await updateEstoqueItem(editando, dados);
      toast.success("Item atualizado");
    } else {
      await addEstoqueItem(dados);
    }
    limparForm();
    setDialogOpen(false);
  };

  const excluir = async (id: string, nomeItem: string) => {
    if (!confirm(`Remover "${nomeItem}" do estoque?`)) return;
    await removeEstoqueItem(id);
    toast.success("Item removido");
  };

  const registrarSaida = async () => {
    if (!saidaEstoqueId) {
      toast.error("Selecione o insumo");
      return;
    }
    const qtd = Number(saidaQtd.replace(",", "."));
    if (isNaN(qtd) || qtd <= 0) {
      toast.error("Informe uma quantidade válida");
      return;
    }
    const itemEstoque = estoque.find((e) => e.id === saidaEstoqueId);
    if (!itemEstoque) {
      toast.error("Insumo não encontrado");
      return;
    }
    if (qtd > itemEstoque.quantidadeAtual) {
      toast.error(`Estoque insuficiente. Disponível: ${itemEstoque.quantidadeAtual} ${itemEstoque.unidade}`);
      return;
    }

    await addMovimentacao({
      estoqueId: saidaEstoqueId,
      tipo: "saida",
      quantidade: qtd,
      motivo: saidaMotivo,
      responsavel: saidaResponsavel,
      observacao: saidaObservacao,
    });
    limparFormSaida();
    setDialogSaidaOpen(false);
  };

  const itensPorCategoria = estoque.reduce<Record<string, number>>((acc, e) => {
    acc[e.categoria] = (acc[e.categoria] || 0) + 1;
    return acc;
  }, {});

  return (
    <PizzaPage
      title="Estoque de Insumos"
      subtitle="Controle seus ingredientes, alertas de estoque baixo e custos."
      action={
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              limparFormSaida();
              setDialogSaidaOpen(true);
            }}
          >
            <ArrowDown className="mr-1.5 size-3.5" />
            Registrar saída
          </Button>
          <Button
            size="sm"
            onClick={() => {
              limparForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-3.5" />
            Novo insumo
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="size-4 text-primary" />
            Total de itens
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{estoque.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertTriangle className="size-4 text-destructive" />
            Abaixo do mínimo
          </div>
          <p className="mt-2 text-2xl font-bold text-destructive">{itensAbaixoMinimo.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="size-4 text-success" />
            Valor em estoque
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{currency(valorTotalEstoque)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <History className="size-4 text-chart-4" />
            Movimentações
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{movimentacoes.length}</p>
        </div>
      </div>

      <div className="flex gap-1 rounded-lg bg-surface-hover p-1">
        <button
          onClick={() => setAbaTab("estoque")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            abaTab === "estoque" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <Package className="mr-1.5 inline size-4" />
          Estoque
        </button>
        <button
          onClick={() => setAbaTab("movimentacoes")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            abaTab === "movimentacoes" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
          }`}
        >
          <History className="mr-1.5 inline size-4" />
          Histórico de Saídas
        </button>
      </div>

      {abaTab === "estoque" && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {categoriasFiltro.map((c) => (
              <button
                key={c}
                onClick={() => setFiltro(c)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  filtro === c
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-surface-hover"
                }`}
              >
                {c} {c !== "Todas" && itensPorCategoria[c] ? `(${itensPorCategoria[c]})` : ""}
              </button>
            ))}
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-hover">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Insumo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Categoria</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Estoque</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Mínimo</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Custo/un</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Pacote</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lista.map((item) => {
                  const abaixo = item.quantidadeAtual <= item.quantidadeMinima;
                  return (
                    <tr key={item.id} className="hover:bg-surface-hover/50">
                      <td className="px-4 py-3 font-medium text-foreground">{item.nome}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.categoria}</td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {item.quantidadeAtual} {item.unidade}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-muted-foreground">
                        {item.quantidadeMinima} {item.unidade}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-foreground">
                        {currency(item.custoUnitario)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {item.precoPacote > 0 ? (
                          <div>
                            <span className="font-medium text-foreground">{currency(item.precoPacote)}</span>
                            <span> / {item.quantidadePorPacote} {item.unidadePacote || item.unidade}</span>
                            {item.fornecedor && <span className="block text-[10px]">{item.fornecedor}</span>}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={abaixo ? "destructive" : "default"}>
                          {abaixo ? "Baixo" : "OK"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => abrirEdicao(item)}>
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:text-destructive" onClick={() => excluir(item.id, item.nome)}>
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {lista.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-sm text-muted-foreground">
                      Nenhum insumo cadastrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {abaTab === "movimentacoes" && (
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-hover">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Insumo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-muted-foreground">Tipo</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Quantidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Motivo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Responsável</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Obs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {movimentacoes.map((mov) => {
                const itemEstoque = estoque.find((e) => e.id === mov.estoqueId);
                const tipoCor = mov.tipo === "saida" || mov.tipo === "perda" ? "text-destructive" : "text-success";
                return (
                  <tr key={mov.id} className="hover:bg-surface-hover/50">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(mov.createdAt).toLocaleDateString("pt-BR")} {new Date(mov.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">{itemEstoque?.nome ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={mov.tipo === "saida" || mov.tipo === "perda" ? "destructive" : "default"}>
                        {mov.tipo === "saida" ? "Saída" : mov.tipo === "entrada" ? "Entrada" : mov.tipo === "perda" ? "Perda" : "Ajuste"}
                      </Badge>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-semibold ${tipoCor}`}>
                      {mov.tipo === "saida" || mov.tipo === "perda" ? "-" : "+"}{mov.quantidade} {itemEstoque?.unidade ?? ""}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{mov.motivo}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{mov.responsavel || "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{mov.observacao || "—"}</td>
                  </tr>
                );
              })}
              {movimentacoes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    Nenhuma movimentação registrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog Novo Item */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) limparForm(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editando ? "Editar insumo" : "Novo insumo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input placeholder="Ex: Mussarela, Farinha, Tomate..." value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={(v) => setCategoria(v as EstoqueCategoria)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estoqueCategoriaOptions.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={unidade} onValueChange={(v) => setUnidade(v as EstoqueUnidade)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {estoqueUnidadeOptions.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Qtd atual</Label>
                <Input type="number" step="0.1" value={qtdAtual} onChange={(e) => setQtdAtual(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Qtd mínima</Label>
                <Input type="number" step="0.1" value={qtdMinima} onChange={(e) => setQtdMinima(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Custo/un (R$)</Label>
                <Input type="number" step="0.01" value={custo} onChange={(e) => setCusto(e.target.value)} />
              </div>
            </div>
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Dados do Pacote (PCT)</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Input placeholder="Ex: Laticínios Boi Gordo" value={fornecedor} onChange={(e) => setFornecedor(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Preço do pacote (R$)</Label>
                  <Input type="number" step="0.01" placeholder="Ex: 320" value={precoPacote} onChange={(e) => setPrecoPacote(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Qtd no pacote</Label>
                  <Input type="number" step="0.1" placeholder="Ex: 10" value={qtdPorPacote} onChange={(e) => setQtdPorPacote(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Unidade do pacote</Label>
                  <Input placeholder="Ex: kg, L, un" value={unidadePacote} onChange={(e) => setUnidadePacote(e.target.value)} />
                </div>
              </div>
              {precoPacote && qtdPorPacote && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Custo por unidade no pacote: <span className="font-semibold text-foreground">
                    {currency(Number(precoPacote.replace(",", ".")) / Number(qtdPorPacote.replace(",", ".")))}
                  </span>
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); limparForm(); }}>Cancelar</Button>
            <Button onClick={salvar}>{editando ? "Salvar" : "Adicionar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Registrar Saída */}
      <Dialog open={dialogSaidaOpen} onOpenChange={(v) => { setDialogSaidaOpen(v); if (!v) limparFormSaida(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDown className="size-5 text-destructive" />
              Registrar Saída de Estoque
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Insumo</Label>
              <Select value={saidaEstoqueId} onValueChange={setSaidaEstoqueId}>
                <SelectTrigger><SelectValue placeholder="Selecione o insumo..." /></SelectTrigger>
                <SelectContent>
                  {estoque.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nome} — {e.quantidadeAtual} {e.unidade} disponível
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade que saiu</Label>
                <Input type="number" step="0.1" placeholder="Ex: 3" value={saidaQtd} onChange={(e) => setSaidaQtd(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Motivo</Label>
                <Select value={saidaMotivo} onValueChange={setSaidaMotivo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {movimentacaoMotivoOptions.map((m) => (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input placeholder="Quem fez a saída?" value={saidaResponsavel} onChange={(e) => setSaidaResponsavel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Input placeholder="Ex: Sexta e sábado, saíram 3 pacotes de farinha" value={saidaObservacao} onChange={(e) => setSaidaObservacao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogSaidaOpen(false); limparFormSaida(); }}>Cancelar</Button>
            <Button onClick={registrarSaida}>Registrar saída</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PizzaPage>
  );
}
