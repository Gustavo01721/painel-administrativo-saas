import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { PizzaProvider } from "@/lib/pizza-store";
import { useAuth } from "@/lib/auth";

// Local demo mode is opt-in through .env and never enabled by production defaults.
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === "true";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Carregando…</div>;
  if (!session && !AUTH_DISABLED) return <Navigate to="/auth" />;
  return <PizzaProvider><Outlet /></PizzaProvider>;
}
