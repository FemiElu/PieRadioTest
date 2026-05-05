-- Increase the file size limit for the 'pie-episodes' bucket to 150MB (157286400 bytes)
UPDATE storage.buckets
SET file_size_limit = 157286400
WHERE id = 'pie-episodes';
