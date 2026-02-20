-- SECURITY FIX: Set search_path to public for all public functions to prevent search_path hijacking
ALTER FUNCTION public.has_role(text) SET search_path = public;
ALTER FUNCTION public.get_user_role() SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_presenter() SET search_path = public;
ALTER FUNCTION public.is_presenter_or_admin() SET search_path = public;
ALTER FUNCTION public.has_any_role(text[]) SET search_path = public;
ALTER FUNCTION public.current_user_role() SET search_path = public;
ALTER FUNCTION public.protect_music_request_mutation() SET search_path = public;
ALTER FUNCTION public.prevent_role_change() SET search_path = public;
ALTER FUNCTION public.enforce_music_request_update_rules() SET search_path = public;
ALTER FUNCTION public.log_role_change() SET search_path = public;

-- SECURITY FIX: role_change_audit_view is SECURITY DEFINER (Error 0010)
-- Re-create it as SECURITY INVOKER (default) to enforce the caller's RLS
DROP VIEW IF EXISTS public.role_change_audit_view;
CREATE VIEW public.role_change_audit_view AS
SELECT 
    a.id,
    a.user_id,
    u.email as user_email,
    u.full_name as user_full_name,
    a.old_role,
    a.new_role,
    a.changed_by,
    c.full_name as changed_by_name,
    a.changed_at,
    a.reason
FROM public.role_change_audit a
JOIN public.profiles u ON a.user_id = u.id
LEFT JOIN public.profiles c ON a.changed_by = c.id;

-- SECURITY FIX: Permissive RLS policies (Warning 0024)
-- station_metadata: "Admins update metadata" is ALL true for authenticated
-- Restrict it to only those who are actually admins
DROP POLICY IF EXISTS "Admins update metadata" ON public.station_metadata;
CREATE POLICY "Admins update metadata" ON public.station_metadata
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- station_metadata_history: "Admins update history" is ALL true for authenticated
DROP POLICY IF EXISTS "Admins update history" ON public.station_metadata_history;
CREATE POLICY "Admins update history" ON public.station_metadata_history
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- presenter_messages: "Anyone can send messages to presenters" is INSERT true
-- While "Anyone" is the goal, we should ensure the data is validated or Rate Limited (handled in app layer)
-- But we can at least ensure it's a permissive policy that doesn't bypass other checks.
-- Current: FOR INSERT WITH CHECK (true)
-- Recommendation: Keep as is for public contact form, but ensure app-layer validation (already done via Zod).
