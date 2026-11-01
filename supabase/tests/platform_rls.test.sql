-- RLS tests for 20261101000000_platform_schema.sql, as anon, user, editor and admin.
-- Runs in one transaction and rolls back, so it is safe on staging:
--   psql "$STAGING_DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/platform_rls.test.sql
-- Locally against a throwaway cluster: supabase/tests/run-local.sh
-- Every check raises an exception on failure; the script ends with «platform RLS: all checks passed».

begin;

-- Test users. The signup trigger gives each a 'user' profile.
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'),
  ('00000000-0000-0000-0000-0000000000e1'),
  ('00000000-0000-0000-0000-0000000000b1');
update public.profiles set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000e1';

insert into public.places (id, name_uk, category, lat, lng, status, photo_path) values
  ('10000000-0000-0000-0000-000000000001', 'Опублікована', 'food', 49.84, 24.03, 'published', 'p/published.webp'),
  ('10000000-0000-0000-0000-000000000002', 'Чернетка', 'food', 49.84, 24.03, 'draft', 'p/draft.webp');
insert into public.releases (pr_number, category, title_uk) values
  (1, 'new', 'Нова функція'),
  (2, 'internal', 'Внутрішня зміна');
insert into storage.objects (bucket_id, name) values
  ('place-photos', 'p/published.webp'),
  ('place-photos', 'p/draft.webp');

-- Acts as one caller for the next statements: role plus JWT claims, like PostgREST does.
create function pg_temp.act_as(who text) returns void language plpgsql as $$
begin
  if who = 'anon' then
    perform set_config('role', 'anon', true);
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    return;
  end if;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object(
    'sub', case who
      when 'admin' then '00000000-0000-0000-0000-0000000000a1'
      when 'admin-aal1' then '00000000-0000-0000-0000-0000000000a1'
      when 'editor' then '00000000-0000-0000-0000-0000000000e1'
      else '00000000-0000-0000-0000-0000000000b1' end,
    'role', 'authenticated',
    'aal', case when who = 'admin' then 'aal2' else 'aal1' end
  )::text, true);
end;
$$;

grant execute on function pg_temp.act_as(text) to anon, authenticated;

-- ── anon ──
select pg_temp.act_as('anon');
do $$ begin
  assert (select count(*) from public.places) = 1, 'anon sees only the published place';
  assert (select count(*) from public.releases) = 1, 'anon does not see internal release notes';
  assert (select count(*) from public.profiles) = 0, 'anon reads no profiles';
  assert (select count(*) from public.audit_log) = 0, 'anon reads no audit log';
  assert (select count(*) from storage.objects) = 1, 'anon reads only the published photo';
  begin
    insert into public.places (name_uk, category, lat, lng) values ('X', 'food', 49.8, 24.0);
    raise exception 'anon inserted a place';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ── user ──
reset role;
select pg_temp.act_as('user');
do $$ begin
  assert (select count(*) from public.places) = 1, 'a user sees only the published place';
  assert (select count(*) from public.profiles) = 1, 'a user reads only their own profile';
  update public.profiles set role = 'admin' where id = auth.uid();
  assert (select role from public.profiles where id = auth.uid()) = 'user', 'a user cannot raise their own role';
  update public.places set name_uk = 'Зламано' where status = 'published';
  begin
    insert into public.place_overrides (osm_ref, hidden) values ('node/1', true);
    raise exception 'a user wrote a place override';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id, name) values ('place-photos', 'p/user.webp');
    raise exception 'a user uploaded a file';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
do $$ begin
  assert (select name_uk from public.places where status = 'published') = 'Опублікована',
    'a user update changed no place';
end $$;

-- ── editor ──
select pg_temp.act_as('editor');
do $$ begin
  assert (select count(*) from public.places) = 2, 'an editor sees drafts';
  insert into public.places (name_uk, category, lat, lng) values ('Нове місце', 'food', 49.81, 24.01);
  assert (select created_by from public.places where name_uk = 'Нове місце') = auth.uid(),
    'created_by is the editor';
  insert into public.place_overrides (osm_ref, lat, lng) values ('node/42', 49.83, 24.02);
  update public.places set status = 'published' where id = '10000000-0000-0000-0000-000000000002';
  delete from public.places where id = '10000000-0000-0000-0000-000000000001';
  assert (select count(*) from public.places where id = '10000000-0000-0000-0000-000000000001') = 1,
    'an editor cannot delete places';
  assert (select count(*) from public.releases) = 1, 'an editor does not see internal release notes';
  assert (select count(*) from public.audit_log) = 0, 'an editor cannot read the audit log';
  update public.profiles set role = 'admin' where id = auth.uid();
  assert (select public.user_role()) = 'editor', 'an editor cannot raise their own role';
  begin
    insert into public.building_models (osm_building_ref, storage_path, bytes, triangles)
    values ('way/7', 'm/too-big.glb', 6 * 1024 * 1024, 1000);
    raise exception 'a model over the 5 MB budget was accepted';
  exception when check_violation then null;
  end;
  insert into storage.objects (bucket_id, name) values ('place-photos', 'p/editor.webp');
end $$;

-- ── admin without a second factor ──
reset role;
select pg_temp.act_as('admin-aal1');
do $$ begin
  assert not public.is_admin(), 'an admin session at AAL1 has no admin rights';
  assert (select count(*) from public.audit_log) = 0, 'an AAL1 admin cannot read the audit log';
end $$;

-- ── admin (AAL2) ──
reset role;
select pg_temp.act_as('admin');
do $$ begin
  assert public.is_admin(), 'an AAL2 admin is admin';
  assert (select count(*) from public.profiles) = 3, 'an admin reads every profile';
  assert (select count(*) from public.releases) = 2, 'an admin sees internal release notes';
  update public.profiles set role = 'editor' where id = '00000000-0000-0000-0000-0000000000b1';
  assert (select role from public.profiles where id = '00000000-0000-0000-0000-0000000000b1') = 'editor',
    'an admin changes roles';
  delete from public.places where id = '10000000-0000-0000-0000-000000000001';
  assert (select count(*) from public.places where id = '10000000-0000-0000-0000-000000000001') = 0,
    'an admin deletes places';
  assert (select count(*) from public.audit_log where entity = 'places' and action = 'DELETE') = 1,
    'the delete is in the audit log';
  assert (select actor from public.audit_log where entity = 'place_overrides' limit 1)
    = '00000000-0000-0000-0000-0000000000e1', 'the audit log records the editor as actor';
end $$;

reset role;
do $$ begin raise notice 'platform RLS: all checks passed'; end $$;

rollback;
