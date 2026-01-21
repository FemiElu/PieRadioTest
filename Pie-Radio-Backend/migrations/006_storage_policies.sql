-- Migration: 006_storage_policies.sql
-- Description: Create 'avatars' bucket and set up RLS policies for secure access
-- Author: Antigravity
-- Date: 2024-01-19

-- ============================================================================
-- 1. CREATE AVATARS BUCKET
-- ============================================================================
-- Insert the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5MB limit 
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- ============================================================================
-- 2. ENABLE RLS
-- ============================================================================
-- Ensure RLS is enabled on storage.objects (usually is by default)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY; -- Commented out to avoid ownership errors

-- ============================================================================
-- 3. DROP EXISTING POLICIES (for idempotency)
-- ============================================================================
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Presenters can manage their own avatars" ON storage.objects;

-- ============================================================================
-- 4. CREATE NEW POLICIES
-- ============================================================================

-- Policy 1: Public Read Access
-- Anyone can view images in the 'avatars' bucket
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING ( bucket_id = 'avatars' );

-- Policy 2: Admin Full Access
-- Admins can Insert, Update, Delete any file in 'avatars' bucket
-- This covers uploading to 'temp/' for new users as well
CREATE POLICY "Admins can manage all avatars"
ON storage.objects FOR ALL
USING (
    bucket_id = 'avatars' 
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'admin'
    )
);

-- Policy 3: Presenter Self-Management
-- Presenters can upload/update/delete files ONLY in their own folder
-- Path convention: avatars/{user_id}/{filename}
CREATE POLICY "Presenters can manage their own avatars"
ON storage.objects FOR ALL
USING (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
    AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND role = 'presenter'
    )
);
