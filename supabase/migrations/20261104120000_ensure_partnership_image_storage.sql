BEGIN;

-- Partnership uploads share the public news image bucket. Some preview
-- projects were created without that bucket; provision it explicitly without
-- changing the settings of an existing bucket or any existing news policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'news-images',
  'news-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS partnership_images_admin_insert ON storage.objects;
CREATE POLICY partnership_images_admin_insert
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'news-images'
    AND (storage.foldername(name))[1] = 'partnerships'
    AND public.is_admin()
  );

DROP POLICY IF EXISTS partnership_images_admin_read ON storage.objects;
CREATE POLICY partnership_images_admin_read
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'news-images'
    AND (storage.foldername(name))[1] = 'partnerships'
    AND public.is_admin()
  );

-- Public image URLs are intentional for logos, flyers and gallery assets.
-- Supabase serves downloads from a public bucket without a SELECT policy.
COMMIT;
