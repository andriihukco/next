-- Admin «Парсинг» (parse jobs): an admin queues a scrape of Google Maps categories around a
-- location. A worker (server/parse-worker.mjs, service role) runs the jobs in the background
-- and writes the results as drafts. Nothing reaches the public `places` table until an admin
-- approves a result. Photo URLs stay external: we do not copy scraped photos into storage.
-- Rollback: supabase/rollbacks/20261103000000_parse_jobs.down.sql

-- ─── Jobs ──────────────────────────────────────────────────────────────────────

create table public.parse_jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 120),
  categories text[] not null check (cardinality(categories) between 1 and 20),
  center_lat double precision not null check (center_lat between -90 and 90),
  center_lng double precision not null check (center_lng between -180 and 180),
  radius_m integer not null check (radius_m between 200 and 30000),
  include_photos boolean not null default true,
  status text not null default 'queued' check (status in ('queued', 'running', 'done', 'failed', 'cancelled')),
  cancel_requested boolean not null default false,
  progress_done integer not null default 0 check (progress_done >= 0),
  progress_total integer not null default 0 check (progress_total >= 0),
  found_count integer not null default 0 check (found_count >= 0),
  error text check (length(error) <= 500),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index parse_jobs_status_idx on public.parse_jobs (status, created_at);

-- ─── Results ───────────────────────────────────────────────────────────────────
-- One row per listing. The source id dedupes listings across jobs and tiles.

create table public.parse_results (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references public.parse_jobs (id) on delete cascade,
  source text not null default 'google_maps' check (source in ('google_maps')),
  external_id text not null check (length(external_id) between 1 and 200),
  category text not null check (category ~ '^[a-z][a-z-]{1,40}$'),
  name text not null check (length(trim(name)) between 1 and 200),
  address text check (length(address) <= 300),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  phone text check (length(phone) <= 40),
  website text check (length(website) <= 500),
  rating numeric check (rating between 0 and 5),
  review_count integer check (review_count >= 0),
  photo_urls text[] not null default '{}',
  details jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  place_id uuid references public.places (id) on delete set null,
  reviewed_by uuid references auth.users (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (source, external_id)
);

create index parse_results_job_idx on public.parse_results (job_id, status);
create index parse_results_status_idx on public.parse_results (status, created_at desc);

-- ─── Triggers ──────────────────────────────────────────────────────────────────

create trigger parse_jobs_updated_at before update on public.parse_jobs
  for each row execute function public.set_updated_at();

create trigger parse_jobs_audit after insert or update or delete on public.parse_jobs
  for each row execute function public.write_audit_log('id');

-- ─── Row level security ────────────────────────────────────────────────────────
-- Admins only (AAL2, as in public.is_admin()). The worker and the API use the service role,
-- which bypasses RLS; anon and editors get nothing.

alter table public.parse_jobs enable row level security;
alter table public.parse_results enable row level security;

create policy "Admins read parse jobs"
  on public.parse_jobs for select to authenticated
  using ((select public.is_admin()));

create policy "Admins create parse jobs"
  on public.parse_jobs for insert to authenticated
  with check ((select public.is_admin()));

create policy "Admins update parse jobs"
  on public.parse_jobs for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins read parse results"
  on public.parse_results for select to authenticated
  using ((select public.is_admin()));

create policy "Admins review parse results"
  on public.parse_results for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
