import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Users, RefreshCw, Utensils } from "lucide-react";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

type Mesa = { id: string; numero: number; nome: string; status: "livre" | "aberta"; pessoas: number; updated_at: string };

export const Route = createFileRoute("/_authenticated/mesas")({
  head: () => ({ meta: [{ title: "Mesas — Painel Administrativo" }] }),
  component: MesasPage,
});

function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const carregar = async () => {
    setLoading(true);
    const { data } = await supabase.from("mesas" as any).select("id,numero,nome,status,pessoas,updated_at").order("numero");
    setMesas((data ?? []) as Mesa[]);
    setLoading(false);
  };
  useEffect(() => {
    void carregar();
    const channel = supabase.channel("mesas-painel").on("postgres_changes", { event: "*", schema: "public", table: "mesas" }, () => void carregar()).subscribe();
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
    {loading ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Carregando mesas...</div> : mesas.length === 0 ? <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nenhuma mesa conectada ainda.</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{mesas.map((mesa) => <div key={mesa.id} className={cn("rounded-xl border bg-card p-4", mesa.status === "aberta" ? "border-success/40" : "border-border")}><div className="flex items-center justify-between"><div className="flex items-center gap-2"><Utensils className="size-4 text-primary" /><span className="font-semibold">Mesa {mesa.numero}</span></div><span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold uppercase", mesa.status === "aberta" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>{mesa.status === "aberta" ? "Aberta" : "Livre"}</span></div><p className="mt-3 text-sm text-foreground">{mesa.nome || "Sem cliente identificado"}</p>{mesa.status === "aberta" && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Users className="size-3" />{mesa.pessoas || 0} pessoas</p>}</div>)}</div>}
  </PizzaPage>;
}
