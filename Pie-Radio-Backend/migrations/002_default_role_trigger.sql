-- ============================================================================
-- Migration: 002_default_role_trigger.sql
-- Description: Create trigger to automatically assign 'listener' role to new users
-- Author: Antigravity
-- Date: 2024-12-23
-- ============================================================================

-- Function to handle new user registration
-- This runs when a new user is created in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_name TEXT;
  user_avatar TEXT;
BEGIN
  -- Extract metadata from auth user if available
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1)
  );
  
  user_avatar := NEW.raw_user_meta_data->>'avatar_url';

  -- Insert new profile with default 'listener' role
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    username,
    avatar_url,
    role,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    LOWER(REPLACE(user_name, ' ', '_')) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4),
    user_avatar,
    'listener',  -- Default role for all new users
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to fire after new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- MIGRATION FOR EXISTING USERS
-- Assign 'listener' role to any existing users without a role
-- ============================================================================

-- Update existing profiles that have NULL role
UPDATE public.profiles
SET 
  role = 'listener',
  updated_at = NOW()
WHERE role IS NULL;

-- Log the migration
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % profiles to default listener role', updated_count;
END $$;
