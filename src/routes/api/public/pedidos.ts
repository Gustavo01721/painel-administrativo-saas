import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const payloadSchema = z.object({
  numero: z.string().min(1).max(30).optional(),
  cliente: z.object({
    nome: z.string().min(1).max(120),
    telefone: z.string().max(30).optional(),
    endereco: z.string().max(240).optional(),
  }),
  canal: z.enum(["delivery", "retirada", "balcao", "mesa"]).default("delivery"),
  mesa_id: z.string().uuid().optional(),
  pagamento: z.string().max(30).default("pix"),
  cupom: z.string().max(30).nullable().optional(),
  itens: z.array(z.object({
    product_id: z.string().uuid().optional(),
    nome: z.string().min(1).max(120),
    qtd: z.number().int().min(1).max(50).default(1),
  })).min(1).max(60),
  origem: z.string().max(40).default("site"),
  observacao: z.string().max(500).optional(),
});

const corsHeaders = (origin: string | null) => {
  const allowed = (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean);
  const corsOrigin = origin && allowed.includes(origin) ? origin : null;
  
  return {
    ...(corsOrigin ? { "Access-Control-Allow-Origin": corsOrigin } : {}),
    "Access-Control-Allow-Headers": "content-type, x-webhook-signature, x-webhook-timestamp, x-idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Vary": "Origin",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
  };
};

export const Route = createFileRoute("/api/public/pedidos")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) => new Response(null, { 
        status: request.headers.get("origin") && !corsHeaders(request.headers.get("origin"))["Access-Control-Allow-Origin"] ? 403 : 204, 
        headers: corsHeaders(request.headers.get("origin")) 
      }),
      POST: async ({ request }) => {
        const signature = request.headers.get("x-webhook-signature");
        const timestamp = request.headers.get("x-webhook-timestamp");
        const idempotencyKey = request.headers.get("x-idempotency-key");
        const origin = request.headers.get("origin");
        const secret = process.env.PIZZA_WEBHOOK_SECRET;
        const headers = corsHeaders(origin);

        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), { status, headers });

        if (!secret || !signature || !timestamp || !idempotencyKey) {
          return json({ ok: false, error: "Não autorizado ou chaves obrigatórias ausentes" }, 401);
        }

        if (!/^[0-9a-f]{64}$/i.test(signature)) {
          return json({ ok: false, error: "Assinatura malformada" }, 401);
        }

        const now = Math.floor(Date.now() / 1000);
        const requestTime = parseInt(timestamp, 10);
        if (isNaN(requestTime) || Math.abs(now - requestTime) > 300) {
          return json({ ok: false, error: "Timestamp inválido ou expirado" }, 401);
        }

        let bodyText: string;
        try {
          bodyText = await request.text();
        } catch {
          return json({ ok: false, error: "Corpo da requisição inválido" }, 400);
        }

        const { createHmac, timingSafeEqual, createHash } = await import("crypto");
        const expectedSignature = createHmac("sha256", secret)
          .update(`${timestamp}.${bodyText}`)
          .digest("hex");

        const sigBuf = Buffer.from(signature, "hex");
        const expBuf = Buffer.from(expectedSignature, "hex");

        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return json({ ok: false, error: "Assinatura inválida" }, 401);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        
        // Lookup integration
        const keyHash = createHash("sha256").update(secret).digest("hex");
        const { data: apiKeyEntry } = await supabaseAdmin
          .from("api_keys")
          .select("store_id, id")
          .eq("key_hash", keyHash)
          .single();

        if (!apiKeyEntry) {
          return json({ ok: false, error: "Integração não configurada" }, 403);
        }

        // Rate Limiting
        const ip = request.headers.get("x-forwarded-for") || "0.0.0.0";
        const rateLimitKey = `${apiKeyEntry.id}:${ip}`;
        const { data: allowed } = await (supabaseAdmin as any).rpc("check_rate_limit", {
          p_key: rateLimitKey,
          p_store_id: apiKeyEntry.store_id
        });

        if (!allowed) {
          return json({ ok: false, error: "Muitas requisições (Rate Limit)" }, 429);
        }

        let p: any;
        try {
          p = JSON.parse(bodyText);
        } catch {
          return json({ ok: false, error: "JSON inválido" }, 400);
        }

        const parsed = payloadSchema.safeParse(p);
        if (!parsed.success) {
          return json({ ok: false, error: "Payload inválido", detalhes: parsed.error.issues }, 422);
        }

        const data = parsed.data;
        const numero = data.numero ?? `PED-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

        const { data: result, error: rpcError } = await (supabaseAdmin as any).rpc("create_order_v2", {
          p_store_id: apiKeyEntry.store_id,
          p_idempotency_key: idempotencyKey,
          p_numero: numero,
          p_cliente: data.cliente.nome,
          p_telefone: data.cliente.telefone ?? "",
          p_endereco: data.cliente.endereco ?? "",
          p_canal: data.canal,
          p_pagamento: data.pagamento,
          p_cupom_codigo: data.cupom ?? "",
          p_itens: data.itens as any,
          p_origem: data.origem,
          p_observacao: data.observacao ?? "",
          p_webhook_payload: data as any,
        });

        if (rpcError || !result) {
          await supabaseAdmin.from("webhook_logs").insert({
            evento: "pedido.recebido",
            status: "erro",
            payload: data as any,
            erro: rpcError?.message ?? "Falha na transação",
            store_id: apiKeyEntry.store_id,
          });
          return json({ ok: false, error: "Erro interno no processamento" }, 500);
        }

        const resData = result as { ok: boolean; pedido_id: string; status: string };
        if (data.mesa_id) {
          const { error: mesaError } = await supabaseAdmin
            .from("pedidos")
            .update({ mesa_id: data.mesa_id })
            .eq("id", resData.pedido_id)
            .eq("store_id", apiKeyEntry.store_id);
          if (mesaError) {
            return json({ ok: false, error: "Pedido criado, mas não foi possível vincular a mesa" }, 500);
          }
        }
        return json(
          {
            ok: true,
            pedido_id: resData.pedido_id,
            numero: numero,
            status: resData.status === "idempotent" ? "existing" : "novo",
          },
          resData.status === "idempotent" ? 200 : 201
        );
      },
    },
  },
});
