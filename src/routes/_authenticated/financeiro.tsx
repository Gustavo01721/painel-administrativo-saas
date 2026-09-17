import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownRight, ArrowUpRight, Banknote, CreditCard, Percent, Wallet } from "lucide-react";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { usePizza } from "@/lib/pizza-store";
import { currency } from "@/lib/pizza-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro & Caixa — Painel Administrativo" },
      {
        name: "description",
        content: "Fechamento de caixa, formas de pagamento, custos e lucro líquido da pizzaria.",
      },
      { property: "og:title", content: "Financeiro & Caixa — Painel Administrativo" },
      {
        property: "og:description",
        content: "Resultado consolidado: receita, descontos, custos operacionais e margem.",
      },
    ],
  }),
  component: FinanceiroPage,
});

function FinanceiroPage() {
  const { metrics, settings, orders } = usePizza();

  const receita = metrics.faturamento;
  const descontos = metrics.descontoConcedido;
  const cmv = receita * 0.34;
  const entregas = orders.filter((o) => o.canal === "delivery").length * settings.taxaEntrega * 26;
  const operacional = receita * 0.19;
  const lucro = receita - descontos - cmv - operacional;
  const margem = receita > 0 ? (lucro / receita) * 100 : 0;

  const linhas = [
    { label: "Receita bruta", valor: receita, tipo: "in" as const },
    { label: "Descontos e cupons", valor: -descontos, tipo: "out" as const },
    { label: "CMV (ingredientes)", valor: -cmv, tipo: "out" as const },
    { label: "Custos operacionais", valor: -operacional, tipo: "out" as const },
  ];

  const pagamentos = [
    { nome: "Pix", share: 41, icon: Banknote },
    { nome: "Cartão de crédito", share: 34, icon: CreditCard },
    { nome: "Cartão de débito", share: 16, icon: CreditCard },
    { nome: "Dinheiro", share: 9, icon: Wallet },
  ];

  return (
    <PizzaPage title="Financeiro & Caixa" subtitle="Resultado consolidado do período selecionado.">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Receita bruta", value: currency(receita), tone: "text-foreground" },
          {
            label: "Descontos concedidos",
            value: `-${currency(descontos)}`,
            tone: "text-destructive",
          },
          { label: "Lucro líquido", value: currency(lucro), tone: "text-success" },
          {
            label: "Margem líquida",
            value: `${margem.toFixed(1)}%`,
            tone: margem > 25 ? "text-success" : "text-warning",
          },
        ].map((c, i) => (
          <div
            key={c.label}
            className="animate-fade rounded-xl border border-border bg-card p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <p className="text-[13px] font-medium text-muted-foreground">{c.label}</p>
            <p className={cn("mt-3 font-mono text-2xl font-semibold", c.tone)}>{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Demonstrativo do período</h2>
          <p className="text-xs text-muted-foreground">Da receita bruta ao lucro líquido</p>
          <ul className="mt-5 space-y-3">
            {linhas.map((l) => (
              <li
                key={l.label}
                className="flex items-center justify-between gap-3 border-b border-border/60 pb-3 last:border-0"
              >
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  {l.tipo === "in" ? (
                    <ArrowUpRight className="size-4 text-success" />
                  ) : (
                    <ArrowDownRight className="size-4 text-destructive" />
                  )}
                  {l.label}
                </span>
                <span
                  className={cn(
                    "font-mono text-sm",
                    l.tipo === "in" ? "text-success" : "text-destructive",
                  )}
                >
                  {currency(l.valor)}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 rounded-lg bg-surface-hover px-3 py-3">
              <span className="text-sm font-semibold text-foreground">Lucro líquido</span>
              <span className="font-mono text-base font-semibold text-success">
                {currency(lucro)}
              </span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-muted-foreground">
            Taxa de entrega estimada no período:{" "}
            <span className="font-mono text-foreground">{currency(entregas)}</span>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold text-foreground">Formas de pagamento</h2>
          <p className="text-xs text-muted-foreground">Participação no faturamento</p>
          <ul className="mt-5 space-y-4">
            {pagamentos.map((p) => (
              <li key={p.nome}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <p.icon className="size-4 text-primary" /> {p.nome}
                  </span>
                  <span className="font-mono text-foreground">{p.share}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${p.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center gap-2 rounded-lg border border-border bg-surface-hover p-3 text-xs text-muted-foreground">
            <Percent className="size-4 shrink-0 text-primary" />
            Descontos representam {receita > 0 ? ((descontos / receita) * 100).toFixed(1) : "0"}% da
            receita bruta.
          </div>
        </div>
      </div>
    </PizzaPage>
  );
}
