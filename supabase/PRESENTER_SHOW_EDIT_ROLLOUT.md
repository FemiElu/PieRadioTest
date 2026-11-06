# Presenter show editing

The admin Presenters modal edits the existing `presenter_shows` row. Saving changes only title, description, schedule and artwork URL; its ID, presenter and display order remain unchanged.

Preview verification found that `avatars` and its show-artwork upload policy were missing. Apply only `20261106120000_ensure_presenter_show_artwork_storage.sql` to an environment lacking that setup. It preserves existing bucket settings and grants authenticated admins INSERT only under `show-covers/<existing-presenter-id>/`. It does not grant object update/delete permissions or alter profile-avatar policies.

The existing admin presenter-list query also requires `profiles.presenter_alias`. Older Preview schemas can restore this nullable text field with `20261106121000_ensure_presenter_alias.sql`. This does not change show records.

The targeted Preview migrations are applied independently of the older migration history. Reconcile that history before any general `supabase db push`.

Use matching Preview Supabase public URL, anon key and server role key when deploying another branch. Existing branch-specific settings are not automatically inherited by a new branch.

Replacing or cancelling artwork never removes previous storage files. Abandoned-upload cleanup retains the existing Add Show lifecycle and is outside this change.
