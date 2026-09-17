import { useState } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Flame,
  BookOpen,
  Ticket,
  Users,
  Wallet,
  Settings,
  Plug,
  LogOut,
  Moon,
  Sun,
  X,
  Package,
  HeadphonesIcon,
  Utensils,
} from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/lib/theme";
import { usePizza } from "@/lib/pizza-store";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
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

const nav = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/pedidos", label: "Pedidos em Tempo Real", icon: Flame },
  { to: "/mesas", label: "Mesas do Salão", icon: Utensils },
  { to: "/atendente", label: "Painel do Atendente", icon: HeadphonesIcon },
  { to: "/cardapio", label: "Cardápio & Preços", icon: BookOpen },
  { to: "/estoque", label: "Estoque de Insumos", icon: Package },
  { to: "/cupons", label: "Cupons & Promoções", icon: Ticket },
  { to: "/clientes", label: "Clientes & CRM", icon: Users },
  { to: "/financeiro", label: "Financeiro & Caixa", icon: Wallet },
  { to: "/integracoes", label: "Integração & Webhook", icon: Plug },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AppSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { theme, toggle } = useTheme();
  const { orders, coupons, settings, estoque } = usePizza();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [confirm, setConfirm] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const emAberto = orders.filter((o) =>
    ["novo", "producao", "forno", "rota"].includes(o.status),
  ).length;
  const cuponsAtivos = coupons.filter((c) => c.ativo).length;
  const estoqueBaixo = estoque.filter((e) => e.quantidadeAtual <= e.quantidadeMinima).length;

  const badge = (to: string) =>
    to === "/pedidos" ? emAberto : to === "/cupons" ? cuponsAtivos : to === "/estoque" ? estoqueBaixo : 0;

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-5">
          <Link to="/" className="flex items-center gap-2.5">
            <img
              src="/izilda.png"
              alt="Painel Administrativo"
              className="size-9 rounded-xl object-cover"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-semibold tracking-tight text-sidebar-foreground">
                Painel <span className="text-primary">Administrativo</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                Gestão da loja
              </span>
            </span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-sidebar-accent lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          <p className="px-3 pb-2 pt-1 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            Operação
          </p>
          {nav.map((item) => {
            const active = pathname === item.to;
            const count = badge(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                <span className="flex-1 truncate">{item.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-surface-hover text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-1 border-t border-sidebar-border p-3">
          <div className="mb-2 flex items-center gap-2 rounded-lg bg-surface-hover px-3 py-2.5">
            <span
              className={cn(
                "size-2 shrink-0 rounded-full",
                settings.aberto ? "bg-success animate-pulse" : "bg-destructive",
              )}
            />
            <span className="text-xs font-medium text-foreground">
              {settings.aberto ? "Loja aberta" : "Loja fechada"}
            </span>
          </div>
          <button
            onClick={() => {
              toggle();
              toast.success(theme === "dark" ? "Modo claro ativado" : "Modo escuro ativado");
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? "Modo claro" : "Modo escuro"}
          </button>
          <button
            onClick={() => setConfirm(true)}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      </aside>

      <AlertDialog open={confirm} onOpenChange={setConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Encerrar sessão?</AlertDialogTitle>
            <AlertDialogDescription>
              Você será desconectado do painel da {settings.nome} neste dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void signOut().then(() => {
                  toast.success("Sessão encerrada");
                  void navigate({ to: "/auth" });
                });
              }}
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
