-- Defense in depth for databases upgraded from the original single-store schema.
-- PostgreSQL combines permissive policies with OR, so legacy USING (true)
-- policies must not remain alongside the role-based multi-tenant policies.
DROP POLICY IF EXISTS "Painel le pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Painel cria pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Painel edita pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Painel apaga pedidos" ON public.pedidos;

DROP POLICY IF EXISTS "Painel le cupons" ON public.cupons;
DROP POLICY IF EXISTS "Painel cria cupons" ON public.cupons;
DROP POLICY IF EXISTS "Painel edita cupons" ON public.cupons;
DROP POLICY IF EXISTS "Painel apaga cupons" ON public.cupons;

DROP POLICY IF EXISTS "Painel le config" ON public.configuracoes_loja;
DROP POLICY IF EXISTS "Painel cria config" ON public.configuracoes_loja;
DROP POLICY IF EXISTS "Painel edita config" ON public.configuracoes_loja;

DROP POLICY IF EXISTS "Painel le logs" ON public.webhook_logs;
DROP POLICY IF EXISTS "Painel apaga logs" ON public.webhook_logs;
