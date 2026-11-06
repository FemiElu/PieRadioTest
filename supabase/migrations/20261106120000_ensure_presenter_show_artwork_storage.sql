BEGIN;

-- Some preview environments lack the bucket used by the existing show uploader.
-- Preserve the configuration of any existing bucket, including production.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/*'])
ON CONFLICT (id) DO NOTHING;

-- Show artwork is uploaded by admins to a unique object, never upserted.
-- Do not change avatar/profile policies or grant update/delete access.
DROP POLICY IF EXISTS presenter_show_artwork_admin_insert ON storage.objects;
CREATE POLICY presenter_show_artwork_admin_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = 'show-covers'
    AND public.is_admin()
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id::text = (storage.foldername(name))[2]
        AND p.role = 'presenter'
    )
  );

COMMIT;
