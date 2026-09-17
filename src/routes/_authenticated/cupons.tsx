import { createFileRoute } from "@tanstack/react-router";
import { Ticket, TrendingUp, PiggyBank, Percent, Plus, Sparkles } from "lucide-react";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { CouponsTable } from "@/components/pizza/coupons-table";
import { CouponDialog } from "@/components/pizza/coupon-dialog";
import { usePizza } from "@/lib/pizza-store";
import { couponStatus, currency } from "@/lib/pizza-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cupons")({
  head: () => ({
    meta: [
      { title: "Cupons & Promoções — Painel Administrativo" },
      {
        name: "description",
        content:
          "Crie cupons de desconto, defina regras de uso e acompanhe o faturamento gerado por cada campanha.",
      },
      { property: "og:title", content: "Cupons & Promoções — Painel Administrativo" },
      {
        property: "og:description",
        content: "Gestão completa de cupons: percentual, valor fixo, frete grátis e itens brinde.",
      },
    ],
  }),
  component: CuponsPage,
});

const estrategias = [
  {
    titulo: "Reativação de inativos (30 dias)",
    desc: "Dispara no WhatsApp um cupom de R$ 15 para quem não pede há 30 dias, válido por 72h.",
  },
  {
    titulo: "Terça da borda",
    desc: "Brinde de borda recheada nas terças e quartas para preencher os dias de menor movimento.",
  },
  {
    titulo: "Carrinho abandonado",
    desc: "Cupom de 10% enviado 40 min após o cliente sair do checkout sem concluir.",
  },
  {
    titulo: "Aniversariante do mês",
    desc: "Pizza doce grátis acima de R$ 80 no mês do aniversário — alta taxa de recompra.",
  },
  {
    titulo: "Retirada premiada",
    desc: "20% off só na retirada em horários de pico para aliviar a fila de entregadores.",
  },
  {
    titulo: "Indicação com código próprio",
    desc: "Cada cliente VIP ganha um código; quem indica e quem usa recebem R$ 10.",
  },
];

function CuponsPage() {
  const { coupons } = usePizza();

  const investido = coupons.reduce((s, c) => s + c.descontoConcedido, 0);
  const gerado = coupons.reduce((s, c) => s + c.receitaGerada, 0);
  const usos = coupons.reduce((s, c) => s + c.usos, 0);
  const roi = investido > 0 ? gerado / investido : 0;
  const maisUsado = [...coupons].sort((a, b) => b.usos - a.usos)[0];
  const ativos = coupons.filter((c) => couponStatus(c) === "ativo").length;

  const cards = [
    {
      icon: PiggyBank,
      label: "Investido em descontos",
      value: currency(investido),
      hint: `${usos} usos no total`,
    },
    {
      icon: TrendingUp,
      label: "Faturamento via cupons",
      value: currency(gerado),
      hint: `ROI de ${roi.toFixed(1)}x`,
    },
    {
      icon: Percent,
      label: "Taxa de conversão",
      value: "18,4%",
      hint: "visitas com cupom aplicado",
    },
    {
      icon: Ticket,
      label: "Cupom mais usado",
      value: maisUsado?.codigo ?? "—",
      hint: `${maisUsado?.usos ?? 0} usos · ${ativos} ativos`,
    },
  ];

  return (
    <PizzaPage
      title="Cupons & Promoções"
      subtitle="Lance campanhas, defina regras e acompanhe o retorno de cada oferta."
      action={
        <CouponDialog
          trigger={
            <Button className="gap-1.5">
              <Plus className="size-4" /> Novo cupom
            </Button>
          }
        />
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
              <c.icon className="size-4 text-primary" />
              {c.label}
            </p>
            <p className="mt-3 font-mono text-2xl font-semibold tracking-tight text-foreground">
              {c.value}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      <CouponsTable />

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Estratégias de cupons automatizados
            </h2>
            <p className="text-xs text-muted-foreground">
              Campanhas sugeridas com base no comportamento da sua base
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {estrategias.map((e) => (
            <div key={e.titulo} className="rounded-lg border border-border bg-surface-hover p-4">
              <p className="text-sm font-medium text-foreground">{e.titulo}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{e.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </PizzaPage>
  );
}
