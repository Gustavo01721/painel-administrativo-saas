import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Bike, Store, Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { usePizza } from "@/lib/pizza-store";
import {
  currency,
  maskPhone,
  kdsColumns,
  orderStatusLabel,
  itemLabel,
  type OrderStatus,
} from "@/lib/pizza-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Motoboy = { id: string; nome: string; whatsapp: string; ativo: boolean };

export const Route = createFileRoute("/_authenticated/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos em Tempo Real — Painel Administrativo" },
      {
        name: "description",
        content: "Painel KDS em kanban com os pedidos da pizzaria do recebimento à entrega.",
      },
      { property: "og:title", content: "Pedidos em Tempo Real — Painel Administrativo" },
      {
        property: "og:description",
        content: "Acompanhe montagem, forno, rota e entrega de cada pedido.",
      },
    ],
  }),
  component: PedidosPage,
});

const colTone: Record<OrderStatus, string> = {
  novo: "border-primary/40",
  producao: "border-warning/40",
  forno: "border-chart-4/40",
  rota: "border-chart-5/40",
  entregue: "border-success/40",
  cancelado: "border-destructive/40",
};

function PedidosPage() {
  const { orders, setOrderStatus, removeOrder, search } = usePizza();
  const [motoboys, setMotoboys] = useState<Motoboy[]>([]);
  useEffect(() => { void supabase.from("motoboys" as any).select("id,nome,whatsapp,ativo").eq("ativo", true).order("nome").then(({ data }) => setMotoboys((data ?? []) as unknown as Motoboy[])); }, []);
  const [canal, setCanal] = useState<"todos" | "delivery" | "retirada">("todos");

  const q = search.trim().toLowerCase();
  const lista = orders.filter(
    (o) =>
      (canal === "todos" || o.canal === canal) &&
      (q ? o.cliente.toLowerCase().includes(q) || o.id.includes(q) : true),
  );

  const avancar = (status: OrderStatus): OrderStatus | null => {
    const i = kdsColumns.indexOf(status);
    return i >= 0 && i < kdsColumns.length - 1 ? kdsColumns[i + 1] : null;
  };

  return (
    <PizzaPage
      title="Pedidos em tempo real"
      subtitle="Arraste o pedido pelas etapas da cozinha usando os botões de avanço."
      action={
        <div className="flex gap-1.5">
          {(["todos", "delivery", "retirada"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCanal(c)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors",
                canal === c
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-surface-hover",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {kdsColumns.map((col) => {
          const items = lista.filter((o) => o.status === col);
          return (
            <div
              key={col}
              className={cn("rounded-xl border-t-2 bg-card p-3 ring-1 ring-border", colTone[col])}
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-foreground">
                  {orderStatusLabel[col]}
                </p>
                <span className="rounded-full bg-surface-hover px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map((o) => {
                  const next = avancar(o.status);
                  return (
                    <div key={o.id} className="rounded-lg border border-border bg-surface p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-muted-foreground">{o.id}</span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          {o.canal === "delivery" ? (
                            <Bike className="size-3" />
                          ) : (
                            <Store className="size-3" />
                          )}
                          {o.hora}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {o.cliente}
                        <span className="ml-2 block text-[10px] text-muted-foreground">
                          {maskPhone(o.telefone)}
                        </span>
                      </p>
                      <ul className="mt-1.5 space-y-0.5">
                        {o.itens.map((i, idx) => (
                          <li key={idx} className="text-[11px] leading-snug text-muted-foreground">
                            • {itemLabel(i)}
                          </li>
                        ))}
                      </ul>
                      {o.canal === "delivery" && <select className="mt-2 h-8 w-full rounded-md border border-border bg-background px-2 text-xs" value={o.motoboyId ?? ""} onChange={(e) => { const id = e.target.value || null; void supabase.from("pedidos" as any).update({ motoboy_id: id }).eq("id", o.id); toast.success(id ? "Motoboy vinculado ao pedido" : "Motoboy removido do pedido"); }}><option value="">Selecionar motoboy</option>{motoboys.map((m) => <option key={m.id} value={m.id}>{m.nome} · {m.whatsapp}</option>)}</select>}
                      {o.cupom && (
                        <span className="mt-2 inline-block rounded-md bg-primary-soft px-2 py-0.5 font-mono text-[10px] font-semibold text-primary">
                          {o.cupom} · -{currency(o.desconto)}
                        </span>
                      )}
                      <div className="mt-3 space-y-2 border-t border-border pt-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {currency(o.total)}
                          </span>
                          <button
                            onClick={() => {
                              removeOrder(o.id);
                              toast.success(`Pedido ${o.id} removido`);
                            }}
                            className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label={`Remover ${o.id}`}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                        {next && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-full px-2 text-[11px]"
                            onClick={() => {
                              setOrderStatus(o.id, next);
                              if (next === "rota" && o.motoboyId) {
                                const m = motoboys.find((item) => item.id === o.motoboyId);
                                if (m) window.open(`https://wa.me/${m.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`Nova entrega disponível: pedido ${o.numero || o.id}, cliente ${o.cliente}, endereço ${o.endereco}, total ${currency(o.total)}.`)}`, "_blank", "noopener,noreferrer");
                              }
                              toast.success(`${o.id} → ${orderStatusLabel[next]}`);
                            }}
                          >
                            {orderStatusLabel[next]}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Sem pedidos
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-5 text-sm">
        <Clock className="size-4 text-primary" />
        <span className="text-muted-foreground">
          Tempo médio de preparo hoje: <span className="font-mono text-foreground">32 min</span>
        </span>
        <span className="text-muted-foreground">
          Cancelados:{" "}
          <span className="font-mono text-destructive">
            {orders.filter((o) => o.status === "cancelado").length}
          </span>
        </span>
      </div>
    </PizzaPage>
  );
}
