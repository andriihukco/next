-- Platform schema (docs/platform-plan.md §A3, slice S1): roles, our own places,
-- edits to OSM places, 3D building models, release notes, and an audit log.
-- Roles live in the database and are enforced by RLS; no role logic lives only in the UI.
-- Rollback: supabase/rollbacks/20261101000000_platform_schema.down.sql

-- ─── Roles ─────────────────────────────────────────────────────────────────────

create type public.app_role as enum ('user', 'editor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Role of the signed-in user. Security definer so policies can read profiles without
-- recursing into the profiles policies. Anonymous callers get 'user'.
create function public.user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.role from public.profiles p where p.id = auth.uid()),
    'user'::public.app_role
  );
$$;

create function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.user_role() in ('editor'::public.app_role, 'admin'::public.app_role);
$$;

-- Admin rights need a second factor (decision D-C): the session must be at AAL2.
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.user_role() = 'admin'::public.app_role
    and coalesce(auth.jwt() ->> 'aal', 'aal1') = 'aal2';
$$;

-- Every new auth user gets a profile with the 'user' role.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Shared triggers ───────────────────────────────────────────────────────────

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  action text not null check (action in ('INSERT', 'UPDATE', 'DELETE')),
  entity text not null,
  entity_id text,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_entity_idx on public.audit_log (entity, entity_id, created_at desc);

-- Writes one audit row per change. The first trigger argument names the key column.
create function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_before jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  row_after jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
begin
  insert into public.audit_log (actor, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(row_after, row_before) ->> tg_argv[0],
    row_before,
    row_after
  );
  return coalesce(new, old);
end;
$$;

-- ─── Places we add ─────────────────────────────────────────────────────────────

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name_uk text not null check (length(trim(name_uk)) between 1 and 200),
  category text not null check (category ~ '^[a-z][a-z-]{1,40}$'),
  address text check (length(address) <= 300),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  hours text check (length(hours) <= 300),
  phone text check (length(phone) <= 40),
  website text check (website ~ '^https://' and length(website) <= 500),
  photo_path text check (length(photo_path) <= 300),
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index places_status_category_idx on public.places (status, category);
create index places_lat_lng_idx on public.places (lat, lng);

-- ─── Edits to OSM places ───────────────────────────────────────────────────────
-- Keyed by the OSM reference (for example "node/123"). OSM stays the base map; these
-- rows only change or hide a place, which limits ODbL share-alike exposure (D-A).

create table public.place_overrides (
  osm_ref text primary key check (osm_ref ~ '^(node|way|relation)/[0-9]+$'),
  name_uk text check (length(trim(name_uk)) between 1 and 200),
  category text check (category ~ '^[a-z][a-z-]{1,40}$'),
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  hours text check (length(hours) <= 300),
  phone text check (length(phone) <= 40),
  website text check (website ~ '^https://' and length(website) <= 500),
  hidden boolean not null default false,
  updated_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_at timestamptz not null default now(),
  -- A moved place needs both coordinates.
  check ((lat is null) = (lng is null))
);

-- ─── 3D building models ────────────────────────────────────────────────────────
-- Limits are the hard budgets in platform-plan §B4.

create table public.building_models (
  id uuid primary key default gen_random_uuid(),
  osm_building_ref text not null check (osm_building_ref ~ '^(way|relation)/[0-9]+$'),
  storage_path text not null unique check (storage_path ~ '^[a-z0-9/_-]+\.glb$'),
  format text not null default 'glb' check (format = 'glb'),
  bytes integer not null check (bytes > 0 and bytes <= 5 * 1024 * 1024),
  triangles integer not null check (triangles > 0 and triangles <= 50000),
  texture_max_px integer not null default 0 check (texture_max_px between 0 and 2048),
  offset_lng double precision not null default 0,
  offset_lat double precision not null default 0,
  rotation_deg double precision not null default 0 check (rotation_deg >= 0 and rotation_deg < 360),
  scale double precision not null default 1 check (scale > 0 and scale <= 10),
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index building_models_building_idx on public.building_models (osm_building_ref);
-- At most one published model per building.
create unique index building_models_one_published_idx
  on public.building_models (osm_building_ref) where status = 'published';

-- ─── Release notes («Що нового») ───────────────────────────────────────────────
-- Written by CI with the service role (bypasses RLS) or by an admin.

create table public.releases (
  id uuid primary key default gen_random_uuid(),
  pr_number integer unique check (pr_number > 0),
  category text not null check (category in ('new', 'improved', 'fixed', 'internal')),
  title_uk text not null check (length(trim(title_uk)) between 1 and 200),
  body_uk text check (length(body_uk) <= 4000),
  commit_sha text check (commit_sha ~ '^[0-9a-f]{7,40}$'),
  preview_url text check (preview_url ~ '^https://'),
  published_at timestamptz not null default now()
);

create index releases_published_idx on public.releases (published_at desc);

-- ─── Triggers ──────────────────────────────────────────────────────────────────

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger places_updated_at before update on public.places
  for each row execute function public.set_updated_at();
create trigger place_overrides_updated_at before update on public.place_overrides
  for each row execute function public.set_updated_at();
create trigger building_models_updated_at before update on public.building_models
  for each row execute function public.set_updated_at();

create trigger profiles_audit after insert or update or delete on public.profiles
  for each row execute function public.write_audit_log('id');
create trigger places_audit after insert or update or delete on public.places
  for each row execute function public.write_audit_log('id');
create trigger place_overrides_audit after insert or update or delete on public.place_overrides
  for each row execute function public.write_audit_log('osm_ref');
create trigger building_models_audit after insert or update or delete on public.building_models
  for each row execute function public.write_audit_log('id');
create trigger releases_audit after insert or update or delete on public.releases
  for each row execute function public.write_audit_log('id');

-- ─── Row level security ────────────────────────────────────────────────────────
-- Public reads see published rows only. Editors manage content; admins (AAL2) manage
-- roles, delete content, and read the audit log.

alter table public.profiles enable row level security;
alter table public.audit_log enable row level security;
alter table public.places enable row level security;
alter table public.place_overrides enable row level security;
alter table public.building_models enable row level security;
alter table public.releases enable row level security;

create policy "Users read their own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or (select public.is_admin()));

-- Only admins change roles. Users have no update policy, so they cannot raise their own role.
create policy "Admins change roles"
  on public.profiles for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins read the audit log"
  on public.audit_log for select to authenticated
  using ((select public.is_admin()));

create policy "Anyone reads published places"
  on public.places for select to anon, authenticated
  using (status = 'published' or (select public.is_editor()));

create policy "Editors add places"
  on public.places for insert to authenticated
  with check ((select public.is_editor()));

create policy "Editors edit places"
  on public.places for update to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

create policy "Admins delete places"
  on public.places for delete to authenticated
  using ((select public.is_admin()));

-- Overrides are public: clients need `hidden` and the moved coordinates to apply them.
create policy "Anyone reads place overrides"
  on public.place_overrides for select to anon, authenticated
  using (true);

create policy "Editors add place overrides"
  on public.place_overrides for insert to authenticated
  with check ((select public.is_editor()));

create policy "Editors edit place overrides"
  on public.place_overrides for update to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

create policy "Editors remove place overrides"
  on public.place_overrides for delete to authenticated
  using ((select public.is_editor()));

create policy "Anyone reads published building models"
  on public.building_models for select to anon, authenticated
  using (status = 'published' or (select public.is_editor()));

create policy "Editors add building models"
  on public.building_models for insert to authenticated
  with check ((select public.is_editor()));

create policy "Editors edit building models"
  on public.building_models for update to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

create policy "Admins delete building models"
  on public.building_models for delete to authenticated
  using ((select public.is_admin()));

create policy "Anyone reads public release notes"
  on public.releases for select to anon, authenticated
  using (category <> 'internal' or (select public.is_admin()));

create policy "Admins write release notes"
  on public.releases for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ─── Storage ───────────────────────────────────────────────────────────────────
-- Both buckets are private. A file is readable by everyone only while a published row
-- points at it; editors upload through signed URLs, so functions never receive the file.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('building-models', 'building-models', false, 5242880, array['model/gltf-binary']),
  ('place-photos', 'place-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Anyone reads published building model files"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'building-models'
    and (
      (select public.is_editor())
      or exists (
        select 1 from public.building_models m
        where m.storage_path = storage.objects.name and m.status = 'published'
      )
    )
  );

create policy "Anyone reads published place photos"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'place-photos'
    and (
      (select public.is_editor())
      or exists (
        select 1 from public.places p
        where p.photo_path = storage.objects.name and p.status = 'published'
      )
    )
  );

create policy "Editors upload content files"
  on storage.objects for insert to authenticated
  with check (bucket_id in ('building-models', 'place-photos') and (select public.is_editor()));

create policy "Editors replace content files"
  on storage.objects for update to authenticated
  using (bucket_id in ('building-models', 'place-photos') and (select public.is_editor()))
  with check (bucket_id in ('building-models', 'place-photos') and (select public.is_editor()));

create policy "Editors remove content files"
  on storage.objects for delete to authenticated
  using (bucket_id in ('building-models', 'place-photos') and (select public.is_editor()));
