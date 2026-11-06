BEGIN;

-- The existing presenter admin list/form already reads and writes this field.
-- Restore it in older preview schemas so the editor can load its presenter.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS presenter_alias TEXT;

COMMIT;
