import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, RefreshCw, Utensils, X, ShoppingBasket } from "lucide-react";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Mesa = { id: string; numero: number; nome: string; status: "livre" | "aberta"; pessoas: number; updated_at: string };
type Pedido = { id: string; table_id: string | null; total: number; status: string; payment_status?: string };

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
      supabase.from("tables" as any).select("id,status,data,updated_at").order("id"),
      supabase.from("orders" as any).select("id,table_id,total,status,payment_status").eq("channel", "mesa").in("status", ["pending", "confirmed", "producao"]),
    ]);
    setMesas(((mesasData ?? []) as any[]).map((row) => ({ id: row.id, numero: Number(row.data?.numero ?? (String(row.id).replace(/\D/g, "") || 0)), nome: row.data?.nome ?? "", pessoas: Number(row.data?.pessoas ?? 0), status: row.status === "aberta" ? "aberta" : "livre", updated_at: row.updated_at })));
    setPedidos((pedidosData ?? []) as unknown as Pedido[]);
    setLoading(false);
  };
  useEffect(() => {
    void carregar();
    const channel = supabase.channel("mesas-painel").on("postgres_changes", { event: "*", schema: "public", table: "tables" }, () => void carregar()).on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void carregar()).subscribe();
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
    {loading ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Carregando mesas...</div> : mesas.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nenhuma mesa conectada ainda.</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{mesas.map((mesa) => { const pedido = pedidos.find((p) => p.table_id === mesa.id); return <button type="button" key={mesa.id} onClick={() => setMesaSelecionada(mesa)} className={cn("rounded-xl border bg-card p-4 text-left transition hover:border-primary hover:shadow-md", mesa.status === "aberta" ? "border-success/40" : "border-border")}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Utensils className="size-4 text-primary" /><span className="font-semibold">Mesa {mesa.numero}</span></div><span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold uppercase", mesa.status === "aberta" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{mesa.status === "aberta" ? "Aberta" : "Livre"}</span></div><p className="mt-3 text-sm text-foreground">{mesa.nome || "Sem cliente identificado"}</p>{mesa.status === "aberta" && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" />{mesa.pessoas > 0 ? mesa.pessoas : "Pessoas não informadas"}</p>}{pedido && <p className="mt-2 flex items-center gap-1 text-xs font-medium text-primary"><ShoppingBasket className="size-3" />Pedido ativo · R$ {(pedido.total ?? 0).toFixed(2).replace(".", ",")}</p>}</button>})}</div>}
    {mesaSelecionada && <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 overflow-y-auto bg-background"><div className="mx-auto min-h-screen w-full max-w-4xl p-4 sm:p-8"><div className="flex items-center justify-between border-b border-border pb-5"><div><p className="text-sm text-muted-foreground">Consumo da mesa</p><h2 className="text-2xl font-semibold">Mesa {mesaSelecionada.numero}</h2><p className="text-sm text-muted-foreground">{mesaSelecionada.nome || "Cliente não identificado"}</p></div><Button variant="outline" size="icon" aria-label="Fechar detalhes" onClick={() => setMesaSelecionada(null)}><X className="size-4" /></Button></div>{(() => { const pedido = pedidos.find((p) => p.table_id === mesaSelecionada.id); return <div className="mt-8">{!pedido ? <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">Nenhum pedido ativo nesta mesa.</div> : <div className="rounded-xl border border-border bg-card p-6"><p className="font-medium">Pedido ativo</p><p className="mt-2 text-sm text-muted-foreground">Status: {pedido.status}</p><div className="mt-5 flex justify-end text-xl font-bold">Total: R$ {(pedido.total ?? 0).toFixed(2).replace(".", ",")}</div></div>}</div>})()}</div></div>}
  </PizzaPage>;
}
