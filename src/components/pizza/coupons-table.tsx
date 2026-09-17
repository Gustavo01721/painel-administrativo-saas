import { useMemo, useState } from "react";
import { MoreHorizontal, Pause, Pencil, Play, Trash2, Copy, ImageOff } from "lucide-react";
import { toast } from "sonner";
import {
  couponStatus,
  couponStatusLabel,
  couponTypeLabel,
  couponValueLabel,
  currency,
  diasSemana,
  posicaoLabel,
  type CouponStatus,
} from "@/lib/pizza-data";
import { usePizza } from "@/lib/pizza-store";
import { CouponDialog } from "./coupon-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

const statusTone: Record<CouponStatus, string> = {
  ativo: "bg-success/12 text-success border-success/25",
  agendado: "bg-primary-soft text-primary border-primary/25",
  esgotado: "bg-warning/12 text-warning border-warning/25",
  expirado: "bg-muted text-muted-foreground border-border",
  pausado: "bg-destructive/10 text-destructive border-destructive/25",
};

const filtros: { value: "todos" | CouponStatus; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ativo", label: "Ativos" },
  { value: "agendado", label: "Agendados" },
  { value: "pausado", label: "Pausados" },
  { value: "esgotado", label: "Esgotados" },
  { value: "expirado", label: "Expirados" },
];

const fmtData = (v: string) =>
  v
    ? new Date(v).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export function CouponsTable() {
  const { coupons, toggleCoupon, removeCoupon, search } = usePizza();
  const [filtro, setFiltro] = useState<"todos" | CouponStatus>("todos");
  const [ordem, setOrdem] = useState<"recentes" | "usos" | "receita">("recentes");
  const [pagina, setPagina] = useState(1);
  const [excluir, setExcluir] = useState<string | null>(null);
  const porPagina = 6;

  const lista = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = coupons.filter((c) => (q ? c.codigo.toLowerCase().includes(q) : true));
    if (filtro !== "todos") out = out.filter((c) => couponStatus(c) === filtro);
    if (ordem === "usos") out = [...out].sort((a, b) => b.usos - a.usos);
    if (ordem === "receita") out = [...out].sort((a, b) => b.receitaGerada - a.receitaGerada);
    return out;
  }, [coupons, filtro, ordem, search]);

  const totalPaginas = Math.max(1, Math.ceil(lista.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = lista.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina);
  const alvo = coupons.find((c) => c.id === excluir);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div className="flex flex-wrap gap-1.5">
          {filtros.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setFiltro(f.value);
                setPagina(1);
              }}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filtro === f.value
                  ? "bg-primary-soft text-primary"
                  : "text-muted-foreground hover:bg-surface-hover hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          Ordenar:
          {(["recentes", "usos", "receita"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrdem(o)}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                ordem === o ? "bg-surface-hover text-foreground" : "hover:text-foreground",
              )}
            >
              {o === "recentes" ? "Recentes" : o === "usos" ? "Mais usados" : "Receita"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Código</th>
              <th className="px-4 py-3 font-medium">Desconto</th>
              <th className="px-4 py-3 font-medium">Regras</th>
              <th className="px-4 py-3 font-medium">Validade</th>
              <th className="px-4 py-3 font-medium">Usos</th>
              <th className="px-4 py-3 font-medium">Receita</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {visiveis.map((c) => {
              const st = couponStatus(c);
              const pct = c.limiteTotal > 0 ? Math.min(100, (c.usos / c.limiteTotal) * 100) : 0;
              return (
                <tr
                  key={c.id}
                  className="border-b border-border/60 transition-colors last:border-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-hover">
                        {c.bannerUrl ? (
                          <img
                            src={c.bannerUrl}
                            alt={`Banner ${c.codigo}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <ImageOff className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-foreground">
                          {c.codigo}
                        </p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {couponTypeLabel[c.tipo]} · {posicaoLabel[c.posicao]}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{couponValueLabel(c)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>
                      Mín. {currency(c.minimo)} · {c.limitePorCliente}x/cliente
                    </p>
                    <p>
                      {c.canal === "todos"
                        ? "Delivery e retirada"
                        : c.canal === "delivery"
                          ? "Só delivery"
                          : "Só retirada"}
                      {c.dias.length > 0 &&
                        ` · ${c.dias.map((d) => diasSemana[d].label).join(", ")}`}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    <p>{fmtData(c.inicio)}</p>
                    <p>até {fmtData(c.fim)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-sm text-foreground">
                      {c.usos}
                      <span className="text-muted-foreground">/{c.limiteTotal || "∞"}</span>
                    </p>
                    {c.limiteTotal > 0 && (
                      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-track">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-success">
                    {currency(c.receitaGerada)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "rounded-md border px-2 py-1 text-[11px] font-semibold",
                        statusTone[st],
                      )}
                    >
                      {couponStatusLabel[st]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          aria-label={`Ações de ${c.codigo}`}
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem
                          onSelect={() => {
                            navigator.clipboard?.writeText(c.codigo);
                            toast.success(`${c.codigo} copiado`);
                          }}
                        >
                          <Copy className="mr-2 size-4" /> Copiar código
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => {
                            void toggleCoupon(c.id).then((ativo) =>
                              toast.success(
                                ativo ? `${c.codigo} reativado` : `${c.codigo} pausado`,
                              ),
                            );
                          }}
                        >
                          {c.ativo ? (
                            <Pause className="mr-2 size-4" />
                          ) : (
                            <Play className="mr-2 size-4" />
                          )}
                          {c.ativo ? "Pausar cupom" : "Reativar cupom"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={() => setExcluir(c.id)}
                        >
                          <Trash2 className="mr-2 size-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <CouponDialog
                      coupon={c}
                      trigger={
                        <button
                          className="ml-1 rounded-md p-1.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"
                          aria-label={`Editar ${c.codigo}`}
                        >
                          <Pencil className="size-4" />
                        </button>
                      }
                    />
                  </td>
                </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Nenhum cupom encontrado com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-muted-foreground">
        <span>
          {lista.length} cupom(ns) · página {paginaAtual} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={paginaAtual === 1}
            onClick={() => setPagina(paginaAtual - 1)}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={paginaAtual === totalPaginas}
            onClick={() => setPagina(paginaAtual + 1)}
          >
            Próxima
          </Button>
        </div>
      </div>

      <AlertDialog open={!!excluir} onOpenChange={(o) => !o && setExcluir(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {alvo?.codigo}?</AlertDialogTitle>
            <AlertDialogDescription>
              O histórico de uso desta campanha será removido do painel. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (excluir) removeCoupon(excluir);
                toast.success("Cupom excluído");
                setExcluir(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
