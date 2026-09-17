-- The role-based policies introduced in 2026-08 call has_role().
-- Keep the helper safe (SECURITY DEFINER + fixed search_path) while allowing
-- authenticated sessions to evaluate policies through it.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role, uuid) TO authenticated;

-- Public menu responses must never expose internal costs. This is enforced in
-- the API route too, but the column remains private at the database boundary.
REVOKE SELECT (custo) ON public.menu_items FROM anon;
