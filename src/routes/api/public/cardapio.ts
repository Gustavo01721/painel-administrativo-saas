import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const storeIdSchema = z.string().uuid();

const corsHeaders = (origin: string | null) => {
  const allowed = (process.env.ALLOWED_ORIGINS || "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  const corsOrigin = origin && allowed.includes(origin) ? origin : null;

  return {
    ...(corsOrigin ? { "Access-Control-Allow-Origin": corsOrigin } : {}),
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json",
    Vary: "Origin",
    "X-Content-Type-Options": "nosniff",
    "Cache-Control": "public, max-age=60, s-maxage=120",
  };
};

export const Route = createFileRoute("/api/public/cardapio")({
  server: {
    handlers: {
      OPTIONS: async ({ request }) =>
        new Response(null, {
          status:
            request.headers.get("origin") &&
            !corsHeaders(request.headers.get("origin"))["Access-Control-Allow-Origin"]
              ? 403
              : 204,
          headers: corsHeaders(request.headers.get("origin")),
        }),
      GET: async ({ request }) => {
        const origin = request.headers.get("origin");
        const headers = corsHeaders(origin);

        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), { status, headers });

        const requestedStoreId = new URL(request.url).searchParams.get("store_id");
        const storeId = storeIdSchema.safeParse(requestedStoreId ?? process.env.PUBLIC_STORE_ID);

        if (!storeId.success) {
          return json({ ok: false, error: "store_id obrigatório e inválido" }, 400);
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const [menuResult, configResult] = await Promise.all([
            supabaseAdmin
              .from("menu_items")
              .select("id, nome, categoria, preco, ativo")
              .eq("store_id", storeId.data)
              .eq("ativo", true)
              .order("categoria")
              .order("nome"),
            supabaseAdmin
              .from("configuracoes_loja")
              .select("loja, telefone, endereco, taxa_entrega, loja_aberta")
              .eq("store_id", storeId.data)
              .limit(1)
              .maybeSingle(),
          ]);

          if (menuResult.error) {
            return json({ ok: false, error: "Erro ao buscar cardápio" }, 500);
          }

          const categorias: Record<string, unknown[]> = {};
          const sabores: Array<{ nome: string; categoria: string }> = [];

          for (const item of menuResult.data ?? []) {
            const cat = item.categoria;
            if (!categorias[cat]) categorias[cat] = [];

            const entry: Record<string, unknown> = {
              id: item.id,
              nome: item.nome,
              preco: Number(item.preco),
            };

            categorias[cat].push(entry);

            if (cat === "Salgadas" || cat === "Doces") {
              sabores.push({ nome: item.nome, categoria: cat });
            }
          }

          const config = configResult.data;

          return json({
            ok: true,
            cardapio: categorias,
            sabores,
            total: menuResult.data?.length ?? 0,
            loja: {
              nome: config?.loja ?? "Pizzaria",
              telefone: config?.telefone ?? "",
              endereco: config?.endereco ?? "",
              taxaEntrega: Number(config?.taxa_entrega ?? 8),
              aberta: config?.loja_aberta !== false,
            },
          });
        } catch {
          return json({ ok: false, error: "Erro interno" }, 500);
        }
      },
    },
  },
});
