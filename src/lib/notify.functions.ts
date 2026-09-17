import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { type Database } from "@/integrations/supabase/types";

const schema = z.object({
  pedidoId: z.string().uuid(),
  status: z.string().min(1).max(30),
});

type WebhookLogInsert = Database["public"]["Tables"]["webhook_logs"]["Insert"];

export const notifyOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) => schema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: cfg } = await context.supabase
      .from("configuracoes_loja")
      .select("webhook_retorno, store_id")
      .limit(1)
      .maybeSingle();

    const url = cfg?.webhook_retorno?.trim();
    if (!url) return { enviado: false, motivo: "sem-url" as const };

    // Proteção SSRF: Apenas HTTPS, bloquear IPs privados e domínios suspeitos
    if (!/^https:\/\//.test(url)) return { enviado: false, motivo: "url-insegura" as const };

    const host = new URL(url).hostname.toLowerCase();
    const isPrivate =
      /^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(host) ||
      host.endsWith(".local");
    if (isPrivate) return { enviado: false, motivo: "url-proibida" as const };

    const { data: pedido } = await context.supabase
      .from("pedidos")
      .select("numero, cliente, telefone, status, total")
      .eq("id", data.pedidoId)
      .maybeSingle();

    if (!pedido) return { enviado: false, motivo: "pedido-nao-encontrado" as const };

    const storeId = cfg?.store_id ?? null;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "FornalhaWebhook/1.0",
        },
        signal: AbortSignal.timeout(5000), // Timeout de 5 segundos
        body: JSON.stringify({
          evento: "pedido.status_alterado",
          pedido_id: data.pedidoId,
          numero: pedido.numero,
          cliente: pedido.cliente,
          telefone: pedido.telefone,
          total: pedido.total,
          status: data.status,
          em: new Date().toISOString(),
        }),
      });

      const logEntry: WebhookLogInsert = {
        evento: "pedido.status_alterado",
        status: res.ok ? "ok" : "erro",
        pedido_id: data.pedidoId,
        payload: { status: data.status, destino: url },
        erro: res.ok ? null : `HTTP ${res.status}`,
        store_id: storeId,
      };

      await context.supabase.from("webhook_logs").insert(logEntry);
      return { enviado: res.ok, motivo: res.ok ? ("ok" as const) : ("http-erro" as const) };
    } catch (e) {
      const logEntry: WebhookLogInsert = {
        evento: "pedido.status_alterado",
        status: "erro",
        pedido_id: data.pedidoId,
        payload: { status: data.status, destino: url },
        erro: e instanceof Error ? e.message : "falha de rede",
        store_id: storeId,
      };

      await context.supabase.from("webhook_logs").insert(logEntry);
      return { enviado: false, motivo: "falha" as const };
    }
  });
