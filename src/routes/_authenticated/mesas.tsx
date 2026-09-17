import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, RefreshCw, Utensils, X, ShoppingBasket } from "lucide-react";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Mesa = { id: string; numero: number; nome: string; status: "livre" | "aberta"; pessoas: number; updated_at: string };
type Pedido = { id: string; mesa_id: string | null; itens: Array<{ nome?: string; quantidade?: number; preco?: number }>; total: number; status: string };

export const Route = createFileRoute("/_authenticated/mesas")({
  head: () => ({ meta: [{ title: "Mesas — Painel Administrativo" }] }),
  component: MesasPage,
});

function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesaSelecionada, setMesaSelecionada] = useState<Mesa | null>(null);
  const carregar = async () => {
    setLoading(true);
    const [{ data: mesasData }, { data: pedidosData }] = await Promise.all([
      supabase.from("mesas" as any).select("id,numero,nome,status,pessoas,updated_at").order("numero"),
      supabase.from("pedidos" as any).select("id,mesa_id,itens,total,status").eq("canal", "mesa").in("status", ["em_preparo", "preparando", "pendente"]),
    ]);
    setMesas((mesasData ?? []) as unknown as Mesa[]);
    setPedidos((pedidosData ?? []) as unknown as Pedido[]);
    setLoading(false);
  };
  useEffect(() => {
    void carregar();
    const channel = supabase.channel("mesas-painel").on("postgres_changes", { event: "*", schema: "public", table: "mesas" }, () => void carregar()).on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, () => void carregar()).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  const abertas = mesas.filter((m) => m.status === "aberta");
  return <PizzaPage title="Mesas do salão" subtitle="Veja as mesas abertas e conectadas ao atendimento."
    action={<Button variant="outline" size="sm" onClick={() => void carregar()}><RefreshCw className="mr-2 size-4" />Atualizar</Button>}>
    <div className="mb-4 grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Mesas cadastradas</p><p className="mt-1 text-2xl font-semibold">{mesas.length}</p></div>
      <div className="rounded-xl border border-success/30 bg-card p-4"><p className="text-xs text-muted-foreground">Mesas abertas</p><p className="mt-1 text-2xl font-semibold text-success">{abertas.length}</p></div>
      <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">Pessoas no salão</p><p className="mt-1 text-2xl font-semibold">{abertas.reduce((sum, m) => sum + (m.pessoas ?? 0), 0)}</p></div>
    </div>
    {loading ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Carregando mesas...</div> : mesas.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nenhuma mesa conectada ainda.</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{mesas.map((mesa) => { const pedido = pedidos.find((p) => p.mesa_id === mesa.id); const itens = pedido?.itens ?? []; return <button type="button" key={mesa.id} onClick={() => setMesaSelecionada(mesa)} className={cn("rounded-xl border bg-card p-4 text-left transition hover:border-primary hover:shadow-md", mesa.status === "aberta" ? "border-success/40" : "border-border")}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Utensils className="size-4 text-primary" /><span className="font-semibold">Mesa {mesa.numero}</span></div><span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold uppercase", mesa.status === "aberta" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{mesa.status === "aberta" ? "Aberta" : "Livre"}</span></div><p className="mt-3 text-sm text-foreground">{mesa.nome || "Sem cliente identificado"}</p>{mesa.status === "aberta" && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" />{mesa.pessoas > 0 ? mesa.pessoas : "Pessoas não informadas"}</p>}{itens.length > 0 && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"><ShoppingBasket className="size-3" />{itens.length} {itens.length === 1 ? "item" : "itens"} · R$ {(pedido?.total ?? 0).toFixed(2).replace(".", ",")}</p>}</button>})}</div>}
    {mesaSelecionada && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-background"><div className="mx-auto min-h-screen w-full max-w-4xl p-4 sm:p-8"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-sm text-muted-foreground">Consumo da mesa</p><h2 className="text-2xl font-semibold">Mesa {mesaSelecionada.numero}</h2><p className="text-sm text-muted-foreground">{mesaSelecionada.nome || "Cliente não identificado"}</p></div><Button variant="outline" size="icon" aria-label="Fechar detalhes" onClick={() => setMesaSelecionada(null)}><X className="size-4" /></Button></div>{(() => { const pedido = pedidos.find((p) => p.mesa_id === mesaSelecionada.id); const itens = pedido?.itens ?? []; return <div className="mt-8">{itens.length === 0 ? <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Nenhum item lançado nesta mesa.</div> : <><div className="divide-y divide-border rounded-xl border border-border bg-card">{itens.map((item, index) => <div key={index} className="flex items-center justify-between gap-4 p-5"><div><p className="font-medium">{item.nome || "Item"}</p><p className="text-sm text-muted-foreground">Quantidade: {item.quantidade ?? 1}</p></div><p className="font-semibold">R$ {((item.preco ?? 0) * (item.quantidade ?? 1)).toFixed(2).replace(".", ",")}</p></div>)}</div><div className="mt-5 flex justify-end text-xl font-bold">Total: R$ {(pedido?.total ?? 0).toFixed(2).replace(".", ",")}</div></>}</div>})()}</div></div>}
  </PizzaPage>;
}
