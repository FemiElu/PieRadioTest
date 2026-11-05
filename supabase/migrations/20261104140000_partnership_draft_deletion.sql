BEGIN;

-- No FK to partnership_pages: cleanup must remain retryable after deletion.
CREATE TABLE IF NOT EXISTS public.partnership_cleanup_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL UNIQUE,
  requested_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  objects JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(objects) = 'array'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  lock_token UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS partnership_cleanup_jobs_pending_idx
  ON public.partnership_cleanup_jobs (next_attempt_at)
  WHERE status <> 'completed';

ALTER TABLE public.partnership_cleanup_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS partnership_cleanup_jobs_admin ON public.partnership_cleanup_jobs;
CREATE POLICY partnership_cleanup_jobs_admin ON public.partnership_cleanup_jobs
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
GRANT SELECT, INSERT, UPDATE ON public.partnership_cleanup_jobs TO authenticated;
GRANT ALL ON public.partnership_cleanup_jobs TO service_role;

-- Inspect only known saved-content tables, using to_jsonb so older preview
-- schemas do not need every optional image-column migration first.
CREATE OR REPLACE FUNCTION public.partnership_storage_object_referenced(
  p_name TEXT,
  p_ignore_page UUID DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_table TEXT;
  v_found BOOLEAN;
BEGIN
  IF NOT (coalesce(public.is_admin(), false) OR coalesce(auth.role(), '') = 'service_role') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.partnership_pages p
    WHERE p.id IS DISTINCT FROM p_ignore_page
      AND strpos(to_jsonb(p)::text, p_name) > 0
  ) OR EXISTS (
    SELECT 1 FROM public.episodes e
    WHERE (p_ignore_page IS NULL OR e.partnership_page_id IS DISTINCT FROM p_ignore_page)
      AND (e.file_key = p_name OR strpos(to_jsonb(e)::text, p_name) > 0)
  ) THEN RETURN true; END IF;

  FOREACH v_table IN ARRAY ARRAY['news_articles', 'events', 'profiles', 'shows', 'presenters'] LOOP
    IF to_regclass(format('public.%I', v_table)) IS NOT NULL THEN
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I r WHERE strpos(to_jsonb(r)::text, $1) > 0)', v_table)
        INTO v_found USING p_name;
      IF v_found THEN RETURN true; END IF;
    END IF;
  END LOOP;
  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_partnership_draft(p_id UUID, p_updated_at TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_page public.partnership_pages%ROWTYPE;
  v_job_id UUID;
  v_objects JSONB;
  v_prefix TEXT := 'partnerships/' || p_id::text || '/';
BEGIN
  IF auth.uid() IS NULL OR NOT coalesce(public.is_admin(), false) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_page FROM public.partnership_pages WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    SELECT id INTO v_job_id FROM public.partnership_cleanup_jobs WHERE page_id = p_id;
    RETURN jsonb_build_object('outcome', CASE WHEN v_job_id IS NULL THEN 'not_found' ELSE 'already_deleted' END,
      'page_id', p_id, 'job_id', v_job_id);
  END IF;
  IF v_page.status <> 'draft' THEN
    RETURN jsonb_build_object('outcome', 'blocked', 'page_id', p_id, 'error', 'Only draft pages can be permanently deleted.');
  END IF;
  IF v_page.updated_at IS DISTINCT FROM p_updated_at THEN
    RETURN jsonb_build_object('outcome', 'conflict', 'page_id', p_id, 'error', 'This draft changed after you selected it. Refresh before deleting.');
  END IF;

  -- Imported presenter/show episodes are shared source records. A draft
  -- deletion must never guess that they or their original files are owned.
  IF EXISTS (
    SELECT 1 FROM public.episodes e WHERE e.partnership_page_id = p_id
      AND (e.presenter_id IS NOT NULL OR e.show_id IS NOT NULL OR e.file_key IS NULL
        OR left(e.file_key, length(v_prefix)) <> v_prefix
        OR public.partnership_storage_object_referenced(e.file_key, p_id))
  ) THEN
    RETURN jsonb_build_object('outcome', 'blocked', 'page_id', p_id,
      'error', 'This draft contains imported or shared mixes. Resolve their ownership before deleting this draft.');
  END IF;

  SELECT coalesce(jsonb_agg(jsonb_build_object('bucket', o.bucket_id, 'path', o.name)), '[]'::jsonb)
    INTO v_objects FROM storage.objects o
    WHERE o.bucket_id IN ('news-images', 'partnership-audio')
      AND left(o.name, length(v_prefix)) = v_prefix;

  INSERT INTO public.partnership_cleanup_jobs (page_id, requested_by, objects)
    VALUES (p_id, auth.uid(), v_objects)
    ON CONFLICT (page_id) DO UPDATE SET objects = EXCLUDED.objects, status = 'pending',
      next_attempt_at = now(), last_error = NULL, lock_token = NULL, locked_at = NULL, completed_at = NULL
    RETURNING id INTO v_job_id;

  -- Delete mixes first in the same transaction. ON DELETE SET NULL on the
  -- page FK would otherwise make these formerly private mixes public.
  DELETE FROM public.episodes WHERE partnership_page_id = p_id;
  DELETE FROM public.partnership_pages WHERE id = p_id;

  RETURN jsonb_build_object('outcome', 'deleted', 'page_id', p_id, 'job_id', v_job_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_partnership_cleanup_job(p_job_id UUID, p_force BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE v_job public.partnership_cleanup_jobs%ROWTYPE;
BEGIN
  IF NOT (coalesce(public.is_admin(), false) OR coalesce(auth.role(), '') = 'service_role') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_job FROM public.partnership_cleanup_jobs WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF v_job.status = 'completed' THEN RETURN to_jsonb(v_job); END IF;
  IF v_job.status = 'processing' AND v_job.locked_at > now() - interval '10 minutes' THEN RETURN NULL; END IF;
  IF NOT p_force AND v_job.next_attempt_at > now() THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.partnership_pages WHERE id = v_job.page_id) THEN
    RAISE EXCEPTION 'Cannot clean media for an existing page' USING ERRCODE = '23514';
  END IF;
  UPDATE public.partnership_cleanup_jobs SET status = 'processing', attempts = attempts + 1,
    locked_at = now(), lock_token = gen_random_uuid()
    WHERE id = p_job_id RETURNING * INTO v_job;
  RETURN to_jsonb(v_job);
END;
$$;

DROP FUNCTION IF EXISTS public.get_partnership_cleanup_manifest(UUID);
DROP FUNCTION IF EXISTS public.get_partnership_cleanup_manifest(UUID, BOOLEAN);
CREATE OR REPLACE FUNCTION public.get_partnership_cleanup_manifest(
  p_job_id UUID, p_existing_only BOOLEAN DEFAULT false, p_lock_token UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_job public.partnership_cleanup_jobs%ROWTYPE;
  v_prefix TEXT;
  v_objects JSONB;
BEGIN
  IF NOT (coalesce(public.is_admin(), false) OR coalesce(auth.role(), '') = 'service_role') THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_job FROM public.partnership_cleanup_jobs WHERE id = p_job_id;
  IF NOT FOUND THEN RETURN '[]'::jsonb; END IF;
  IF v_job.status <> 'processing' OR v_job.lock_token IS DISTINCT FROM p_lock_token THEN
    RAISE EXCEPTION 'Media cleanup ownership changed' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (SELECT 1 FROM public.partnership_pages WHERE id = v_job.page_id) THEN
    RAISE EXCEPTION 'Cannot clean media for an existing page' USING ERRCODE = '23514';
  END IF;
  v_prefix := 'partnerships/' || v_job.page_id::text || '/';
  -- Re-read current metadata on every attempt, including uploads that finished
  -- after the original deletion transaction assembled its manifest.
  WITH candidates AS (
    SELECT o.bucket_id AS bucket, o.name AS path FROM storage.objects o
      WHERE o.bucket_id IN ('news-images', 'partnership-audio')
        AND left(o.name, length(v_prefix)) = v_prefix
    UNION
    SELECT item->>'bucket', item->>'path' FROM jsonb_array_elements(v_job.objects) item
      WHERE NOT p_existing_only AND item->>'bucket' IN ('news-images', 'partnership-audio')
        AND left(item->>'path', length(v_prefix)) = v_prefix
  )
  SELECT coalesce(jsonb_agg(jsonb_build_object('bucket', bucket, 'path', path)), '[]'::jsonb)
    INTO v_objects FROM candidates
    WHERE NOT public.partnership_storage_object_referenced(path, v_job.page_id);
  RETURN v_objects;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_partnership_draft(UUID, TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_partnership_draft(UUID, TIMESTAMPTZ) TO authenticated;
REVOKE ALL ON FUNCTION public.partnership_storage_object_referenced(TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.claim_partnership_cleanup_job(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_partnership_cleanup_manifest(UUID, BOOLEAN, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.partnership_storage_object_referenced(TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.claim_partnership_cleanup_job(UUID, BOOLEAN) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_partnership_cleanup_manifest(UUID, BOOLEAN, UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS partnership_images_admin_delete ON storage.objects;
CREATE POLICY partnership_images_admin_delete ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'news-images' AND (storage.foldername(name))[1] = 'partnerships'
    AND public.is_admin()
  );

-- A permissive news policy must not allow a late partnership upload to create
-- a new object after its parent page was deleted.
DROP POLICY IF EXISTS partnership_upload_parent_exists ON storage.objects;
CREATE POLICY partnership_upload_parent_exists ON storage.objects AS RESTRICTIVE
  FOR INSERT TO anon, authenticated WITH CHECK (
    NOT (bucket_id IN ('news-images', 'partnership-audio') AND coalesce((storage.foldername(name))[1], '') = 'partnerships')
    OR (public.is_admin() AND EXISTS (SELECT 1 FROM public.partnership_pages p WHERE p.id::text = (storage.foldername(name))[2]))
  );

DROP POLICY IF EXISTS partnership_delete_admin_only ON storage.objects;
CREATE POLICY partnership_delete_admin_only ON storage.objects AS RESTRICTIVE
  FOR DELETE TO anon, authenticated USING (
    NOT (bucket_id IN ('news-images', 'partnership-audio') AND coalesce((storage.foldername(name))[1], '') = 'partnerships')
    OR public.is_admin()
  );

COMMIT;
