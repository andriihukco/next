-- Sign-ups from the landing page: «Для себе» (waitlist) and «Для закладів» (business).
-- Anyone may add a row; nobody but an admin (AAL2) can read them. No updates or deletes
-- from the client: rows are removed by an admin or the service role only.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('waitlist', 'business')),
  email text not null check (length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  business_name text check (business_name is null or length(business_name) between 1 and 120),
  source text check (source is null or length(source) <= 60),
  created_at timestamptz not null default now()
);

-- One sign-up per address and kind. A repeat insert fails with 23505, which the page treats as done.
create unique index leads_kind_email_idx on public.leads (kind, lower(email));

alter table public.leads enable row level security;

create policy "Anyone can sign up"
  on public.leads for insert to anon, authenticated
  with check (kind = 'business' or business_name is null);

create policy "Admins read sign-ups"
  on public.leads for select to authenticated
  using ((select public.is_admin()));

create policy "Admins remove sign-ups"
  on public.leads for delete to authenticated
  using ((select public.is_admin()));
