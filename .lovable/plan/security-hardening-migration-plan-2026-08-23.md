# Security Hardening & Migration Plan

This plan addresses P0 security issues, multi-tenancy enforcement, and infrastructure reliability.

## User-Facing Changes

- No immediate visual changes.
- Improved system reliability and security for multi-store management.
- Hardened API for order processing.

## Technical Details

### 1. Database Migrations & Multi-tenancy

- **Action**: Consolidar schemas no diretório `supabase/migrations/`.
- **Details**:
  - Ensure `stores`, `user_roles`, and `app_role` are fully defined in migrations.
  - Validate `store_id` columns exist on `pedidos`, `cupons`, `configuracoes_loja`, and `webhook_logs`.
  - Apply constraints and foreign keys for data integrity.
  - Update `webhook_logs` schema to match the code expectations.

### 2. RLS & Authorization Hardening

- **Action**: Replace permissive policies with strict ownership checks.
- **Details**:
  - Audit all policies to ensure `USING (true)` is removed.
  - Use `has_role(auth.uid(), role, store_id)` for all operations.
  - Gate the `_authenticated` route to verify store association in `user_roles`.

### 3. API & Webhook Security (`/api/public/pedidos`)

- **Action**: Implement robust verification and idempotency.
- **Details**:
  - **HMAC**: Enforce 64-char hex signatures, use constant-time comparison with `timingSafeEqual`.
  - **Idempotency**: Require `x-idempotency-key`. Store and check keys in a dedicated `idempotency_keys` table.
  - **Server-side Validation**: Ignore prices from payload. Fetch menu/products from the database and recalculate all totals in the handler.
  - **Transactional Logic**: Move order creation to a PostgreSQL RPC function to ensure atomic updates (order creation + coupon increment + idempotency log).

### 4. Infrastructure & Environment

- **Action**: Cleanup secrets and git configuration.
- **Details**:
  - Standardize on `PIZZA_WEBHOOK_SECRET`.
  - Update `.gitignore` to exclude `.env*` but keep `!.env.example`.
  - Implement SSRF protections for the status notification webhook (IP/loopback blocking).

### 5. Quality Assurance

- **Action**: Standardize build and validation scripts.
- **Details**:
  - Add `typecheck`, `lint`, and `test` scripts to `package.json`.
  - Verify the build passes after removing `as any` casts.
