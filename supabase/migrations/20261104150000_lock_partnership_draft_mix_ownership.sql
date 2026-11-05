BEGIN;

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

  -- Freeze linked mix ownership before checking it. Concurrent episode edits
  -- must finish before validation, or wait until this deletion commits.
  PERFORM e.id FROM public.episodes e WHERE e.partnership_page_id = p_id FOR UPDATE;

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

COMMIT;
