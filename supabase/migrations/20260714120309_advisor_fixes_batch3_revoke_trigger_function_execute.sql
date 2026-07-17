-- Fixes from Supabase Security Advisor: anon/authenticated_security_definer_function_executable.
-- rls_auto_enable() and update_updated_at_column() are SECURITY DEFINER trigger-support
-- functions with no business being callable directly via PostgREST RPC by anon/authenticated.
-- Trigger firing does not require EXECUTE privilege on the trigger function for the
-- DML-issuing role, so revoking direct callability here does not affect existing triggers.
-- (can_review_product, has_role, and verify_certificate are left untouched — those are
-- intentionally public-facing: review eligibility checks, role checks used inside other
-- RLS policies, and the public /verify certificate lookup page.)

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO postgres, service_role;
