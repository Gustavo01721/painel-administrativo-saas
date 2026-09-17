import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { usePizza } from "@/lib/pizza-store";
import { currency, type MenuItem } from "@/lib/pizza-data";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/cardapio")({
  head: () => ({
    meta: [
      { title: "Cardápio & Preços — Painel Administrativo" },
      {
        name: "description",
        content:
          "Gerencie sabores, bordas e bebidas, ajuste preços e acompanhe a margem de cada item.",
      },
      { property: "og:title", content: "Cardápio & Preços — Painel Administrativo" },
      {
        property: "og:description",
        content: "Controle de preços, custos e disponibilidade dos itens da pizzaria.",
      },
    ],
  }),
  component: CardapioPage,
});

const categorias = ["Todas", "Salgadas", "Doces", "Bordas", "Esfihas", "Bebidas", "Adicionais", "Rodízio"] as const;

function CardapioPage() {
  const { menu, toggleMenuItem, updateMenuItem, search } = usePizza();
  const [cat, setCat] = useState<(typeof categorias)[number]>("Todas");
  const [editando, setEditando] = useState<string | null>(null);
  const [preco, setPreco] = useState("");

  const q = search.trim().toLowerCase();
  const lista = menu.filter(
    (m) =>
      (cat === "Todas" || m.categoria === cat) && (q ? m.nome.toLowerCase().includes(q) : true),
  );

  const margem = (m: MenuItem) => ((m.preco - m.custo) / m.preco) * 100;

  const salvar = (m: MenuItem) => {
    const v = Number(preco.replace(",", "."));
    if (!v || v <= m.custo) {
      toast.error("O preço precisa ser maior que o custo");
      return;
    }
    updateMenuItem(m.id, { preco: v });
    setEditando(null);
    toast.success(`${m.nome} atualizado para ${currency(v)}`);
  };

  return (
    <PizzaPage
      title="Cardápio & Preços"
      subtitle="Ative ou pause itens e ajuste preços com visibilidade de margem."
      action={
        <div className="flex flex-wrap gap-1.5">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                cat === c
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((m) => (
          <div key={m.id} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{m.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {m.categoria} · {m.vendas} vendas
                </p>
              </div>
              <Switch
                checked={m.ativo}
                onCheckedChange={async () => {
                  const on = await toggleMenuItem(m.id);
                  toast.success(on ? `${m.nome} disponível` : `${m.nome} pausado no cardápio`);
                }}
              />
            </div>

            <div className="mt-4 flex items-end justify-between gap-3">
              {editando === m.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && salvar(m)}
                    className="h-9 w-24"
                  />
                  <button
                    onClick={() => salvar(m)}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Salvar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditando(m.id);
                    setPreco(String(m.preco));
                  }}
                  className="text-left"
                >
                  <span className="font-mono text-2xl font-semibold text-foreground">
                    {currency(m.preco)}
                  </span>
                  <span className="ml-2 text-[11px] text-primary hover:underline">editar</span>
                </button>
              )}
              <div className="text-right">
                <p className="text-[11px] text-muted-foreground">custo {currency(m.custo)}</p>
                <p
                  className={cn(
                    "font-mono text-sm font-semibold",
                    margem(m) > 60 ? "text-success" : "text-warning",
                  )}
                >
                  {margem(m).toFixed(0)}% margem
                </p>
              </div>
            </div>
          </div>
        ))}
        {lista.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum item encontrado.
          </p>
        )}
      </div>
    </PizzaPage>
  );
}
