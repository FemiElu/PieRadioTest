-- Allow presenters/authenticated users to insert their own schedule entries
-- This is necessary for the "Demo Mode" feature in the Presenter Dashboard
CREATE POLICY "Presenters can insert their own shows" 
ON "public"."schedules" 
FOR INSERT 
TO "authenticated" 
WITH CHECK (auth.uid() = presenter_id);

-- Also allow presenters to update their own shows (if they need to mark as live/offline)
CREATE POLICY "Presenters can update their own shows" 
ON "public"."schedules" 
FOR UPDATE 
TO "authenticated" 
USING (auth.uid() = presenter_id)
WITH CHECK (auth.uid() = presenter_id);

-- Ensure presenters can delete their own test shows
CREATE POLICY "Presenters can delete their own shows" 
ON "public"."schedules" 
FOR DELETE 
TO "authenticated" 
USING (auth.uid() = presenter_id);
