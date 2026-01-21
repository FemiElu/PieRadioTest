-- ============================================================================
-- Migration: 003_role_helpers.sql
-- Description: Helper functions for role validation
-- Author: Antigravity
-- Date: 2024-12-23
-- ============================================================================

-- ============================================================================
-- FUNCTION: has_role
-- Check if current authenticated user has a specific role
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role::TEXT = required_role
  );
END;
$$;

-- ============================================================================
-- FUNCTION: has_any_role
-- Check if current authenticated user has any of the specified roles
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role::TEXT = ANY(required_roles)
  );
END;
$$;

-- ============================================================================
-- FUNCTION: current_user_role
-- Get the role of the current authenticated user
-- Returns NULL if not authenticated or no profile found
-- ============================================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  user_role TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT role::TEXT INTO user_role
  FROM public.profiles
  WHERE id = auth.uid();
  
  RETURN user_role;
END;
$$;

-- ============================================================================
-- FUNCTION: is_admin
-- Convenience function to check if current user is an admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN public.has_role('admin');
END;
$$;

-- ============================================================================
-- FUNCTION: is_presenter
-- Convenience function to check if current user is a presenter
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_presenter()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN public.has_role('presenter');
END;
$$;

-- ============================================================================
-- FUNCTION: is_presenter_or_admin
-- Convenience function to check if current user is presenter or admin
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_presenter_or_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN public.has_any_role(ARRAY['presenter', 'admin']);
END;
$$;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================
GRANT EXECUTE ON FUNCTION public.has_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_any_role(TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_presenter() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_presenter_or_admin() TO authenticated;
