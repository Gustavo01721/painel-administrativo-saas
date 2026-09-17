import { createFileRoute } from "@tanstack/react-router";
import { MessageCircle, Star, UserPlus, Users } from "lucide-react";
import { toast } from "sonner";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { usePizza } from "@/lib/pizza-store";
import { currency, maskPhone } from "@/lib/pizza-data";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes & CRM — Painel Administrativo" },
      {
        name: "description",
        content:
          "Base de clientes da pizzaria com histórico de pedidos, ticket e ações de reativação.",
      },
      { property: "og:title", content: "Clientes & CRM — Painel Administrativo" },
      {
        property: "og:description",
        content: "Segmente VIPs, recorrentes e inativos e dispare cupons por WhatsApp.",
      },
    ],
  }),
  component: ClientesPage,
});

const tierTone: Record<string, string> = {
  VIP: "bg-primary-soft text-primary border-primary/25",
  Recorrente: "bg-success/12 text-success border-success/25",
  Novo: "bg-chart-5/15 text-chart-5 border-chart-5/25",
  Inativo: "bg-destructive/10 text-destructive border-destructive/25",
};

function ClientesPage() {
  const { customers, search, coupons } = usePizza();
  const q = search.trim().toLowerCase();
  const lista = customers.filter((c) =>
    q ? c.nome.toLowerCase().includes(q) || c.telefone.includes(q) : true,
  );

  const inativos = customers.filter((c) => c.tier === "Inativo");
  const cupomReativacao =
    coupons.find((c) => c.codigo === "VOLTAPRAGENTE")?.codigo ?? "VOLTAPRAGENTE";
  const ltv = customers.length > 0 ? customers.reduce((s, c) => s + c.gasto, 0) / customers.length : 0;

  const cards = [
    { icon: Users, label: "Clientes na base", value: customers.length.toString() },
    {
      icon: Star,
      label: "VIPs",
      value: customers.filter((c) => c.tier === "VIP").length.toString(),
    },
    { icon: UserPlus, label: "LTV médio", value: currency(ltv) },
    { icon: MessageCircle, label: "Inativos (30d+)", value: inativos.length.toString() },
  ];

  return (
    <PizzaPage
      title="Clientes & CRM"
      subtitle="Conheça quem mais compra e reative quem sumiu."
      action={
        <Button
          className="gap-1.5"
          onClick={() =>
            toast.success(
              `Cupom ${cupomReativacao} enviado para ${inativos.length} clientes inativos no WhatsApp`,
            )
          }
        >
          <MessageCircle className="size-4" /> Reativar inativos
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className="animate-fade rounded-xl border border-border bg-card p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground">
              <c.icon className="size-4 text-primary" /> {c.label}
            </p>
            <p className="mt-3 font-mono text-2xl font-semibold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="border-b border-border p-5">
          <h2 className="text-sm font-semibold text-foreground">Base de clientes</h2>
          <p className="text-xs text-muted-foreground">
            Ordenada por valor gasto no estabelecimento
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Pedidos</th>
                <th className="px-5 py-3 font-medium">Gasto total</th>
                <th className="px-5 py-3 font-medium">Último pedido</th>
                <th className="px-5 py-3 font-medium">Segmento</th>
                <th className="px-5 py-3 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {[...lista]
                .sort((a, b) => b.gasto - a.gasto)
                .map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border/60 last:border-0 hover:bg-surface-hover"
                  >
                    <td className="px-5 py-3 font-medium text-foreground">{c.nome}</td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                      {maskPhone(c.telefone)}
                    </td>
                    <td className="px-5 py-3 font-mono text-muted-foreground">{c.pedidos}</td>
                    <td className="px-5 py-3 font-mono text-success">{currency(c.gasto)}</td>
                    <td className="px-5 py-3 text-xs text-muted-foreground">
                      {c.ultimoPedido === 0 ? "hoje" : `há ${c.ultimoPedido} dias`}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded-md border px-2 py-1 text-[11px] font-semibold",
                          tierTone[c.tier],
                        )}
                      >
                        {c.tier}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toast.success(`Cupom enviado para ${c.nome} no WhatsApp`)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Enviar cupom
                      </button>
                    </td>
                  </tr>
                ))}
              {lista.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </PizzaPage>
  );
}
