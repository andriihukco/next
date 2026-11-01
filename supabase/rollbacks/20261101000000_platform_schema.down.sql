-- Rolls back 20261101000000_platform_schema.sql. Run by hand with psql, never by the CLI.
-- Storage buckets are kept when they still hold files; empty them first to remove them.

drop policy if exists "Anyone reads published building model files" on storage.objects;
drop policy if exists "Anyone reads published place photos" on storage.objects;
drop policy if exists "Editors upload content files" on storage.objects;
drop policy if exists "Editors replace content files" on storage.objects;
drop policy if exists "Editors remove content files" on storage.objects;

delete from storage.buckets b
where b.id in ('building-models', 'place-photos')
  and not exists (select 1 from storage.objects o where o.bucket_id = b.id);

drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.releases;
drop table if exists public.building_models;
drop table if exists public.place_overrides;
drop table if exists public.places;
drop table if exists public.audit_log;
drop table if exists public.profiles;

drop function if exists public.write_audit_log();
drop function if exists public.set_updated_at();
drop function if exists public.handle_new_user();
drop function if exists public.is_admin();
drop function if exists public.is_editor();
drop function if exists public.user_role();

drop type if exists public.app_role;
