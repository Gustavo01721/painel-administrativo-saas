# Security Implementation Plan

## 1. Clean up `src/routes/index.tsx`

- Remove the hidden `div` containing the instructional text.

## 2. Authentication Hardening (`src/routes/auth.tsx`)

- Remove "Criar conta" (Sign Up) toggle and functionality.
- Remove direct call to `supabase.auth.signUp`.
- Restrict Google Login to prevent automatic administrative access (handled via RLS/Roles in DB).

## 3. Database Schema (Incremental Migrations)

Create `src/integrations/supabase/migrations/20240323000000_security_hardening.sql`:

- Create `public.app_role` enum (`owner`, `manager`, `operator`).
- Create `public.stores` table.
- Create `public.user_roles` table (mapping user -> store -> role).
- Add `store_id` to `pedidos`, `cupons`, `configuracoes_loja`, `webhook_logs`.
- Implement `public.has_role()` security definer function.
- Fix `webhook_logs` table: align status (varchar), add `erro` (text) and `pedido_id` (uuid).

## 4. Row Level Security (RLS)

- Replace `USING (true)` / `WITH CHECK (true)` with policies that check `auth.uid()` and `store_id` via `user_roles`.

## 5. API Protection (`src/routes/api/public/pedidos.ts`)

- Recalculate totals on the server.
- Validate coupons and limits.
- Use `supabaseAdmin` with transaction logic (RPC).
- Add HMAC signature validation.
- Implement rate limiting (simple memory-based for now or recommended via cloud headers).
- Restrict CORS.
- Idempotency check.

## 6. SSRF Protection

- Implement a helper to validate URLs in webhooks.

## 7. Environment & Git

- Update `.gitignore` to include `.env*`.
- Create `.env.example`.

## 8. Code Cleanup

- Remove `as never` where possible by updating types or using proper casting.

---

Technical details:

- TanStack Start `createServerFn` will be used for internal logic.
- `supabaseAdmin` (service_role) used ONLY for privileged API operations after validation.
- All RLS policies will be strictly scoped.
