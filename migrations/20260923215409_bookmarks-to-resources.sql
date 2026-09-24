DROP TABLE IF EXISTS public.resources;

ALTER TABLE public.bookmarks RENAME TO resources;

ALTER TABLE public.resources RENAME CONSTRAINT bookmarks_pkey TO resources_pkey;
ALTER TABLE public.resources RENAME CONSTRAINT bookmarks_user_id_fkey TO resources_user_id_fkey;
ALTER TABLE public.resources RENAME CONSTRAINT bookmarks_title_check TO resources_title_check;
ALTER TABLE public.resources RENAME CONSTRAINT bookmarks_url_check TO resources_url_check;
ALTER TABLE public.resources RENAME CONSTRAINT bookmarks_category_check TO resources_category_check;
ALTER TABLE public.resources RENAME CONSTRAINT bookmarks_description_check TO resources_description_check;

ALTER INDEX public.bookmarks_user_created_idx RENAME TO resources_user_created_idx;

ALTER TRIGGER bookmarks_updated_at ON public.resources RENAME TO resources_updated_at;
ALTER TRIGGER bookmarks_prevent_user_change ON public.resources RENAME TO resources_prevent_user_change;

ALTER POLICY bookmarks_select_own ON public.resources RENAME TO resources_select_own;
ALTER POLICY bookmarks_insert_own ON public.resources RENAME TO resources_insert_own;
ALTER POLICY bookmarks_update_own ON public.resources RENAME TO resources_update_own;
ALTER POLICY bookmarks_delete_own ON public.resources RENAME TO resources_delete_own;
