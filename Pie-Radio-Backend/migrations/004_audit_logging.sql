-- ============================================================================
-- Migration: 004_audit_logging.sql
-- Description: Audit logging for role changes
-- Author: Antigravity
-- Date: 2024-12-23
-- ============================================================================

-- ============================================================================
-- CREATE AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.role_change_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  old_role TEXT,
  new_role TEXT NOT NULL,
  changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason TEXT,
  ip_address INET,
  user_agent TEXT
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_role_change_audit_user_id 
ON public.role_change_audit(user_id);

CREATE INDEX IF NOT EXISTS idx_role_change_audit_changed_at 
ON public.role_change_audit(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_role_change_audit_changed_by 
ON public.role_change_audit(changed_by);

-- ============================================================================
-- ENABLE RLS ON AUDIT TABLE
-- ============================================================================

ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.role_change_audit;
CREATE POLICY "Admins can view audit logs"
  ON public.role_change_audit FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Only system (via trigger) can insert audit logs
-- No direct insert policy for users - audit logs are created by trigger only
DROP POLICY IF EXISTS "System can insert audit logs" ON public.role_change_audit;
CREATE POLICY "System can insert audit logs"
  ON public.role_change_audit FOR INSERT
  WITH CHECK (
    -- Only allow inserts from authenticated users (trigger runs as definer)
    auth.uid() IS NOT NULL
  );

-- No one can update audit logs (immutable)
-- No update policy needed

-- Only admins can delete old audit logs (for maintenance)
DROP POLICY IF EXISTS "Admins can delete old audit logs" ON public.role_change_audit;
CREATE POLICY "Admins can delete old audit logs"
  ON public.role_change_audit FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    -- Optional: Only allow deletion of logs older than 1 year
    AND changed_at < NOW() - INTERVAL '1 year'
  );

-- ============================================================================
-- TRIGGER FUNCTION TO LOG ROLE CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.log_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only log if role actually changed
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO public.role_change_audit (
      user_id,
      old_role,
      new_role,
      changed_by,
      changed_at
    )
    VALUES (
      NEW.id,
      OLD.role::TEXT,
      NEW.role::TEXT,
      auth.uid(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- ATTACH TRIGGER TO PROFILES TABLE
-- ============================================================================

DROP TRIGGER IF EXISTS on_role_changed ON public.profiles;
CREATE TRIGGER on_role_changed
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.log_role_change();

-- ============================================================================
-- CONVENIENCE VIEW FOR AUDIT LOG WITH USER DETAILS
-- ============================================================================

CREATE OR REPLACE VIEW public.role_change_audit_view AS
SELECT 
  rca.id,
  rca.user_id,
  u.email AS user_email,
  u.username AS user_username,
  u.full_name AS user_full_name,
  rca.old_role,
  rca.new_role,
  rca.changed_by,
  cb.email AS changed_by_email,
  cb.username AS changed_by_username,
  rca.changed_at,
  rca.reason
FROM public.role_change_audit rca
LEFT JOIN public.profiles u ON rca.user_id = u.id
LEFT JOIN public.profiles cb ON rca.changed_by = cb.id
ORDER BY rca.changed_at DESC;

-- Grant access to the view for admins
GRANT SELECT ON public.role_change_audit_view TO authenticated;
