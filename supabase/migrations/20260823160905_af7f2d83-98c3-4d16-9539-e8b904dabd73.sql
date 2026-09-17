
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role only for api keys" ON public.api_keys;
CREATE POLICY "Service role only for api keys" ON public.api_keys
    FOR ALL TO service_role
    USING (true)
    WITH CHECK (true);
