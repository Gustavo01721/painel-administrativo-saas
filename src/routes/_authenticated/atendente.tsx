import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { usePizza } from "@/lib/pizza-store";
import { currency, orderStatusLabel, maskPhone, type Order, type OrderStatus } from "@/lib/pizza-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  ChefHat,
  Truck,
  XCircle,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/atendente")({
  head: () => ({
    meta: [
      { title: "Painel do Atendente — Painel Administrativo" },
      {
        name: "description",
        content: "Painel simplificado para atendentes: pedidos, clientes e ações rápidas.",
      },
      { property: "og:title", content: "Painel do Atendente — Painel Administrativo" },
    ],
  }),
  component: AtendentePage,
});

const statusConfig: Record<
  OrderStatus,
  { label: string; icon: typeof Clock; color: string; next?: OrderStatus }
> = {
  novo: { label: "Novo", icon: Clock, color: "bg-chart-5/15 text-chart-5", next: "producao" },
  producao: { label: "Produção", icon: ChefHat, color: "bg-chart-4/15 text-chart-4", next: "forno" },
  forno: { label: "Forno", icon: ChefHat, color: "bg-chart-3/15 text-chart-3", next: "rota" },
  rota: { label: "Rota", icon: Truck, color: "bg-primary-soft text-primary", next: "entregue" },
  entregue: { label: "Entregue", icon: CheckCircle2, color: "bg-success/15 text-success" },
  cancelado: { label: "Cancelado", icon: XCircle, color: "bg-destructive/10 text-destructive" },
};

function AtendentePage() {
  const { orders, setOrderStatus, customers, search } = usePizza();
  const [filtro, setFiltro] = useState<"todos" | OrderStatus>("todos");
  const [pedidoSel, setPedidoSel] = useState<Order | null>(null);
  const [busca, setBusca] = useState("");

  const q = (busca || search).trim().toLowerCase();
  const pedidosFiltrados = orders
    .filter((o) => {
      if (filtro !== "todos" && o.status !== filtro) return false;
      if (q) {
        return (
          o.cliente.toLowerCase().includes(q) ||
          o.numero.toLowerCase().includes(q) ||
          o.telefone.includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const fila = orders.filter((o) => ["novo", "producao", "forno"].includes(o.status));
  const emRota = orders.filter((o) => o.status === "rota");
  const entregues = orders.filter((o) => o.status === "entregue");

  const avancarStatus = async (pedido: Order) => {
    const config = statusConfig[pedido.status];
    if (!config.next) return;
    await setOrderStatus(pedido.id, config.next);
    toast.success(`Pedido ${pedido.numero} → ${orderStatusLabel[config.next]}`);
    setPedidoSel(null);
  };

  const cancelarPedido = async (pedido: Order) => {
    if (!confirm(`Cancelar pedido ${pedido.numero}?`)) return;
    await setOrderStatus(pedido.id, "cancelado");
    toast.success(`Pedido ${pedido.numero} cancelado`);
    setPedidoSel(null);
  };

  return (
    <PizzaPage
      title="Painel do Atendente"
      subtitle="Visão simplificada para acompanhamento e ações rápidas."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="size-4 text-chart-5" />
            Na fila
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{fila.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="size-4 text-primary" />
            Em rota
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{emRota.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
            Entregues hoje
          </div>
          <p className="mt-2 text-2xl font-bold text-foreground">{entregues.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, nº ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
        {(["todos", "novo", "producao", "forno", "rota", "entregue"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltro(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filtro === s
                ? "bg-primary-soft text-primary"
                : "text-muted-foreground hover:bg-surface-hover"
            }`}
          >
            {s === "todos" ? "Todos" : orderStatusLabel[s]}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pedidosFiltrados.map((pedido) => {
          const config = statusConfig[pedido.status];
          const Icon = config.icon;
          return (
            <div
              key={pedido.id}
              className="cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              onClick={() => setPedidoSel(pedido)}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-foreground">{pedido.numero}</span>
                <Badge className={config.color} variant="outline">
                  <Icon className="mr-1 size-3" />
                  {config.label}
                </Badge>
              </div>
              <p className="mt-2 text-sm font-medium text-foreground">{pedido.cliente}</p>
              <p className="text-xs text-muted-foreground">{maskPhone(pedido.telefone)}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-mono text-sm font-semibold text-success">
                  {currency(pedido.total)}
                </span>
                <span className="text-[10px] text-muted-foreground">{pedido.hora}</span>
              </div>
              {pedido.observacao && (
                <p className="mt-1 truncate text-[11px] text-muted-foreground">
                  📝 {pedido.observacao}
                </p>
              )}
              {config.next && (
                <Button
                  size="sm"
                  className="mt-3 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    avancarStatus(pedido);
                  }}
                >
                  Avançar → {orderStatusLabel[config.next]}
                </Button>
              )}
            </div>
          );
        })}
        {pedidosFiltrados.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
            Nenhum pedido encontrado
          </div>
        )}
      </div>

      <Dialog open={!!pedidoSel} onOpenChange={() => setPedidoSel(null)}>
        <DialogContent className="max-w-lg">
          {pedidoSel && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="font-mono">{pedidoSel.numero}</span>
                  <Badge className={statusConfig[pedidoSel.status].color} variant="outline">
                    {statusConfig[pedidoSel.status].label}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <User className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{pedidoSel.cliente}</p>
                      <p className="text-xs text-muted-foreground">{maskPhone(pedidoSel.telefone)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 size-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">{pedidoSel.endereco || "Sem endereço"}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-surface-hover p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Itens do pedido</p>
                  {pedidoSel.itens.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-foreground">
                        {item.qtd}x {item.tipo === "pizza" ? (item.sabores ?? []).join(" / ") : item.nome}
                      </span>
                      <span className="font-mono text-muted-foreground">{currency(item.preco * item.qtd)}</span>
                    </div>
                  ))}
                  <div className="mt-2 border-t border-border pt-2 flex justify-between font-semibold">
                    <span className="text-foreground">Total</span>
                    <span className="font-mono text-success">{currency(pedidoSel.total)}</span>
                  </div>
                </div>

                {pedidoSel.observacao && (
                  <div className="rounded-lg border border-border bg-surface-hover p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Observação</p>
                    <p className="text-sm text-foreground">{pedidoSel.observacao}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  {statusConfig[pedidoSel.status].next && (
                    <Button className="flex-1" onClick={() => avancarStatus(pedidoSel)}>
                      Avançar → {orderStatusLabel[statusConfig[pedidoSel.status].next!]}
                    </Button>
                  )}
                  {pedidoSel.status !== "cancelado" && pedidoSel.status !== "entregue" && (
                    <Button
                      variant="destructive"
                      onClick={() => cancelarPedido(pedidoSel)}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PizzaPage>
  );
}
