-- Storage RLS policies for the 'pie-episodes' bucket

-- 1. Allow authenticated users with 'presenter' or 'admin' role to upload to 'pie-episodes' bucket
CREATE POLICY "Allow presenters to upload episodes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'pie-episodes' 
    AND (public.is_presenter() OR public.is_admin())
);

-- 2. Allow public read access to objects in 'pie-episodes'
-- (This complements making the bucket public in the UI)
CREATE POLICY "Allow public to read episodes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'pie-episodes');

-- 3. Allow presenters to update their own uploaded episodes
CREATE POLICY "Allow presenters to update own episodes"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'pie-episodes' 
    AND (auth.uid() = owner OR public.is_admin())
)
WITH CHECK (
    bucket_id = 'pie-episodes' 
    AND (auth.uid() = owner OR public.is_admin())
);

-- 4. Allow presenters to delete their own uploaded episodes
CREATE POLICY "Allow presenters to delete own episodes"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'pie-episodes' 
    AND (auth.uid() = owner OR public.is_admin())
);
