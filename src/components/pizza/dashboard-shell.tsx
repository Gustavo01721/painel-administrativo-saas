import { useState, type ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";

export function DashboardShell({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar open={menu} onClose={() => setMenu(false)} />
      <div className="lg:pl-64">
        <TopBar onMenu={() => setMenu(true)} />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export function PizzaPage({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>
          {action}
        </div>
        {children}
      </div>
    </DashboardShell>
  );
}
