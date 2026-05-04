-- Add new columns to episodes table to support standalone presenter uploads
ALTER TABLE public.episodes 
ADD COLUMN IF NOT EXISTS presenter_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS aired_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT;

-- Update RLS for episodes table
-- The initial schema already has public read access:
-- CREATE POLICY "Allow public read access" ON "public"."episodes" FOR SELECT USING (true);

-- Allow presenters to insert their own episodes
CREATE POLICY "Allow presenters to insert own episodes"
ON public.episodes FOR INSERT
TO authenticated
WITH CHECK (
    (public.is_presenter() OR public.is_admin())
    AND (presenter_id = auth.uid() OR public.is_admin())
);

-- Allow presenters to update their own episodes
CREATE POLICY "Allow presenters to update own episodes"
ON public.episodes FOR UPDATE
TO authenticated
USING (presenter_id = auth.uid() OR public.is_admin())
WITH CHECK (presenter_id = auth.uid() OR public.is_admin());

-- Allow presenters to delete their own episodes
CREATE POLICY "Allow presenters to delete own episodes"
ON public.episodes FOR DELETE
TO authenticated
USING (presenter_id = auth.uid() OR public.is_admin());
