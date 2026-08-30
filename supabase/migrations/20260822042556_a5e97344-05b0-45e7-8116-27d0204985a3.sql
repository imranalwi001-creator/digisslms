CREATE OR REPLACE FUNCTION public.active_term_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY INVOKER SET search_path = public AS $$
  SELECT id FROM public.academic_terms WHERE is_active LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION public.sync_active_term() FROM PUBLIC, anon, authenticated;
