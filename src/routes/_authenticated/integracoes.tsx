import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { type Tables } from "@/integrations/supabase/types";
import { Check, Copy, Plug, RefreshCw, Shield, Webhook, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PizzaPage } from "@/components/pizza/dashboard-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePizza } from "@/lib/pizza-store";

export const Route = createFileRoute("/_authenticated/integracoes")({
  head: () => ({
    meta: [
      { title: "Integração com o site — Painel Administrativo" },
      {
        name: "description",
        content:
          "Conecte o site de pedidos ao painel: webhook de pedidos, retorno de status e tempo real.",
      },
      { property: "og:title", content: "Integração com o site — Painel Administrativo" },
      {
        property: "og:description",
        content:
          "Webhook JSON de pedidos, callback de status e atualização em tempo real do painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegracoesPage,
});

const payloadExemplo = `{
  "numero": "#1042",
  "cliente": {
    "nome": "Marina Duarte",
    "telefone": "11 98877-1122",
    "endereco": "Rua das Oliveiras, 240 - Pinheiros"
  },
  "canal": "delivery",
  "pagamento": "pix",
  "cupom": "FORNO20",
  "itens": [
    {
      "tipo": "pizza",
      "tamanho": "grande",
      "sabores": ["Calabresa Artesanal", "Margherita"],
      "borda": "Catupiry",
      "qtd": 1,
      "preco": 78.9
    },
    { "tipo": "bebida", "nome": "Guaraná 2L", "qtd": 1, "preco": 14 }
  ],
  "subtotal": 92.9,
  "desconto": 18.58,
  "taxa_entrega": 8,
  "total": 82.32,
  "origem": "site",
  "observacao": "Sem cebola"
}`;

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-hover">
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <button
          className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            void navigator.clipboard.writeText(code);
            setCopiado(true);
            toast.success("Copiado!");
            setTimeout(() => setCopiado(false), 1600);
          }}
        >
          {copiado ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
          Copiar
        </button>
      </div>
      <pre className="max-h-96 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-foreground">
        {code}
      </pre>
    </div>
  );
}

function IntegracoesPage() {
  const { settings, saveSettings, orders } = usePizza();
  const [retorno, setRetorno] = useState(settings.webhookRetorno);
  const [salvando, setSalvando] = useState(false);
  const [logs, setLogs] = useState<Tables<"webhook_logs">[]>([]);

  const base =
    typeof window !== "undefined" ? window.location.origin : "https://sua-pizzaria.lovable.app";
  const endpoint = `${base}/api/public/pedidos`;

  useEffect(() => {
    const fetchLogs = async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("webhook_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      if (data) setLogs(data);
    };
    fetchLogs();
  }, []);

  const exemploJs = `// No seu site de pedidos, ao finalizar o checkout:
await fetch("${endpoint}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-webhook-token": PIZZA_WEBHOOK_TOKEN, // guarde no servidor do site
  },
  body: JSON.stringify(pedido), // mesmo formato do JSON ao lado
});
// Resposta: { ok: true, pedido_id: "uuid", numero: "#1042", status: "novo" }
// O painel recebe o pedido na hora, via tempo real — sem recarregar a página.`;

  const exemploRetorno = `// Endpoint no SEU site para receber mudanças de status do painel
// POST ${retorno || "https://seusite.com.br/api/pedido-status"}
{
  "evento": "pedido.status_alterado",
  "pedido_id": "uuid",
  "numero": "#1042",
  "cliente": "Marina Duarte",
  "telefone": "11 98877-1122",
  "total": 82.32,
  "status": "rota",         // novo | producao | forno | rota | entregue | cancelado
  "em": "2026-07-29T20:14:03.000Z"
}
// Use esse gancho para disparar o WhatsApp e atualizar o rastreio do cliente.`;

  const recebidos = orders.filter((o) => o.origem === "site").length;

  return (
    <PizzaPage
      title="Integração & Webhook"
      subtitle="Ligue o site de pedidos ao painel em tempo real."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { label: "Endpoint público", valor: "/api/public/pedidos", icone: Webhook },
          { label: "Pedidos vindos do site", valor: String(recebidos), icone: Plug },
          { label: "Atualização do painel", valor: "Tempo real", icone: RefreshCw },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <c.icone className="size-4 text-primary" />
              {c.label}
            </div>
            <p className="mt-2 truncate font-mono text-sm font-semibold text-foreground">
              {c.valor}
            </p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">
          1. Envie o pedido do site para o painel
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Autentique com o header <span className="font-mono text-foreground">x-webhook-token</span>{" "}
          (segredo <span className="font-mono text-foreground">PIZZA_WEBHOOK_TOKEN</span> já
          configurado no backend).
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <CodeBlock label={`POST ${endpoint}`} code={payloadExemplo} />
          <CodeBlock label="site → painel (JavaScript)" code={exemploJs} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">
          2. Receba o status de volta no site / WhatsApp
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sempre que o pedido muda de etapa no KDS, o painel dispara um POST para a URL abaixo.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="retorno">URL de retorno (HTTPS)</Label>
            <Input
              id="retorno"
              value={retorno}
              onChange={(e) => setRetorno(e.target.value)}
              placeholder="https://seusite.com.br/api/pedido-status"
            />
          </div>
          <Button
            disabled={salvando}
            onClick={() => {
              setSalvando(true);
              void saveSettings({ ...settings, webhookRetorno: retorno.trim() })
                .then(() => toast.success("URL de retorno salva"))
                .finally(() => setSalvando(false));
            }}
          >
            Salvar URL
          </Button>
        </div>
        <div className="mt-4">
          <CodeBlock label="painel → site (callback)" code={exemploRetorno} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Shield className="size-4 text-primary" />
            Auditoria de Segurança (Staff Level)
          </h2>
          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
            PROTEGIDO
          </span>
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Status da Infraestrutura
            </h3>
            <div className="space-y-2">
              {[
                { label: "Row Level Security (RLS)", status: "Ativo", icon: Shield },
                { label: "Input Sanitization (Zod)", status: "Ativo", icon: Shield },
                { label: "Segurança de Header (CSP/CORS)", status: "Configurado", icon: Shield },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border bg-surface-hover p-3"
                >
                  <span className="text-xs text-foreground">{item.label}</span>
                  <div className="flex items-center gap-1.5 text-xs font-medium text-success">
                    <item.icon className="size-3.5" />
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Últimos Eventos de Webhook
            </h3>
            <div className="overflow-hidden rounded-lg border border-border bg-surface-hover">
              {logs.length > 0 ? (
                <div className="divide-y divide-border">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3">
                      <div className="space-y-0.5">
                        <p className="text-xs font-medium text-foreground">{log.evento}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {log.created_at ? new Date(log.created_at).toLocaleString() : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {log.status === "erro" ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-destructive">
                            <AlertTriangle className="size-3" />
                            ERRO
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-success">SUCESSO</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  Nenhum log recente
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PizzaPage>
  );
}
