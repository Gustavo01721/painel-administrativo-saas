import { useMemo, useState } from "react";
import { Bell, Menu, Search, Ticket } from "lucide-react";
import { toast } from "sonner";
import { currency, periodOptions, couponValueLabel, type PeriodValue } from "@/lib/pizza-data";
import { usePizza } from "@/lib/pizza-store";
import { useAuth } from "@/lib/auth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CouponDialog } from "./coupon-dialog";
import { cn } from "@/lib/utils";

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const {
    period,
    setPeriod,
    search,
    setSearch,
    orders,
    coupons,
    customers,
    notifications,
    unread,
    markAllRead,
    markRead,
    settings,
    saveSettings,
  } = usePizza();
  const { user } = useAuth();
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [] as { tipo: string; titulo: string; desc: string }[];
    const out: { tipo: string; titulo: string; desc: string }[] = [];
    orders
      .filter(
        (o) =>
          o.cliente.toLowerCase().includes(q) || o.numero.includes(q) || o.telefone.includes(q),
      )
      .slice(0, 3)
      .forEach((o) =>
        out.push({ tipo: "Pedido", titulo: `${o.numero} — ${o.cliente}`, desc: currency(o.total) }),
      );
    coupons
      .filter((c) => c.codigo.toLowerCase().includes(q))
      .slice(0, 3)
      .forEach((c) => out.push({ tipo: "Cupom", titulo: c.codigo, desc: couponValueLabel(c) }));
    customers
      .filter((c) => c.nome.toLowerCase().includes(q) || c.telefone.includes(q))
      .slice(0, 3)
      .forEach((c) => out.push({ tipo: "Cliente", titulo: c.nome, desc: `${c.pedidos} pedidos` }));
    return out.slice(0, 7);
  }, [search, orders, coupons, customers]);

  const initials = settings.responsavel
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onMenu}
          className="rounded-md p-2 text-muted-foreground hover:bg-surface-hover lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="relative hidden min-w-0 flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            placeholder="Buscar pedidos, cupons, clientes…"
            className="h-10 w-full max-w-md rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
          />
          {focused && results.length > 0 && (
            <div className="absolute left-0 top-12 w-full max-w-md overflow-hidden rounded-lg border border-border bg-popover shadow-xl">
              {results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 border-b border-border/60 px-3 py-2.5 last:border-0 hover:bg-surface-hover"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{r.titulo}</p>
                    <p className="text-xs text-muted-foreground">{r.desc}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-primary-soft px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {r.tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => {
              saveSettings({ aberto: !settings.aberto });
              toast.success(
                settings.aberto ? "Loja fechada para pedidos" : "Loja aberta para pedidos",
              );
            }}
            className={cn(
              "hidden h-9 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors sm:flex",
              settings.aberto
                ? "border-success/40 bg-success/10 text-success"
                : "border-destructive/40 bg-destructive/10 text-destructive",
            )}
          >
            <span
              className={cn(
                "size-2 rounded-full",
                settings.aberto ? "bg-success" : "bg-destructive",
              )}
            />
            {settings.aberto ? "Aberto" : "Fechado"}
          </button>

          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodValue)}>
            <SelectTrigger className="h-9 w-[140px] text-xs sm:w-[168px] sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periodOptions.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                aria-label="Notificações"
              >
                <Bell className="size-5" />
                {unread > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive font-mono text-[9px] font-bold text-destructive-foreground">
                    {unread}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-foreground">Notificações</p>
                <button
                  onClick={() => {
                    markAllRead();
                    toast.success("Tudo marcado como lido");
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Marcar todas
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className="flex w-full gap-3 border-b border-border/60 px-4 py-3 text-left last:border-0 hover:bg-surface-hover"
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.lida ? "bg-transparent" : "bg-primary",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{n.titulo}</p>
                      <p className="text-xs text-muted-foreground">{n.desc}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{n.tempo}</p>
                    </div>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <CouponDialog
            trigger={
              <Button size="sm" className="h-9 gap-1.5">
                <Ticket className="size-4" />
                <span className="hidden sm:inline">Novo cupom</span>
              </Button>
            }
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-surface-hover">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-primary-soft text-xs font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden text-left lg:block">
                  <span className="block text-xs font-semibold leading-tight text-foreground">
                    {settings.responsavel}
                  </span>
                  <span className="block text-[11px] leading-tight text-muted-foreground">
                    {settings.nome}
                  </span>
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-medium text-foreground">{settings.responsavel}</p>
                <p className="text-xs font-normal text-muted-foreground">{user?.email ?? "—"}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => toast.info("Perfil disponível em Configurações")}>
                Meu perfil
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => toast.info("Relatório enviado para seu e-mail")}>
                Enviar relatório do dia
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
