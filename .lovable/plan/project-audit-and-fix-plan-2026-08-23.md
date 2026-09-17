# Project Audit and Fix Plan

Perform a full audit and fix of the `src/` directory, following developer instructions.

## Proposed Changes

### 1. Type Safety & Code Quality

- Replace all instances of `any` with proper TypeScript interfaces/types.
- Fix `prefer-const` and other ESLint errors/warnings.
- Re-enable strict ESLint rules for `any` and `prefer-const`.
- Update `createServerFn` to use the non-deprecated `validator()` method in `src/lib/notify.functions.ts`.

### 2. File Specific Fixes

#### `src/integrations/supabase/previewAuthStorage.ts`

- Fix `timer` assignment logic to correctly use `let` and clear the timer safely.
- Replace `any` in `msg` with `Record<string, unknown>`.

#### `src/lib/pizza-store.tsx`

- Import `Tables` from `@/integrations/supabase/types`.
- Use `Tables<"pedidos">`, `Tables<"cupons">`, and `Tables<"configuracoes_loja">` for mapping functions and store state.
- Remove all `any` casts in mapping logic.

#### `src/routes/_authenticated/integracoes.tsx`

- Type the `logs` state using `Tables<"webhook_logs">[]`.
- Ensure type-safe access to log properties (`evento`, `status`, etc.).

### 3. Auditing `src/`

- Review `hooks`, `services`, and `components` for mocked or broken logic.
- Ensure all Supabase interactions use RLS-safe patterns (already enforced by the gateway but verified in code).
- Check mobile responsiveness and accessibility in UI components.

## Technical Details

- **Stack**: React, TypeScript, TanStack Start, Tailwind CSS, Supabase.
- **Verification**: `bun run build`, `bun x eslint .`, and `bun x tsc --noEmit`.
