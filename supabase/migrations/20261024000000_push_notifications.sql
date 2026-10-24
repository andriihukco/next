-- Web Push subscriptions, one row per browser. Users manage only their own rows;
-- the server reads all rows with the service role key to deliver notifications.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%'),
  p256dh text not null,
  auth text not null,
  topics text[] not null default array['air-alert'],
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);
create index push_subscriptions_topics_idx on public.push_subscriptions using gin (topics);

alter table public.push_subscriptions enable row level security;

create policy "Users read their own push subscriptions"
  on public.push_subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add their own push subscriptions"
  on public.push_subscriptions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users update their own push subscriptions"
  on public.push_subscriptions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users remove their own push subscriptions"
  on public.push_subscriptions for delete to authenticated
  using ((select auth.uid()) = user_id);

-- Last air alert status the server notified about. Server-only: RLS with no policies.
create table public.air_alert_state (
  id smallint primary key check (id = 1),
  status text not null check (status in ('unknown', 'active', 'clear')),
  updated_at timestamptz not null default now()
);

alter table public.air_alert_state enable row level security;

insert into public.air_alert_state (id, status) values (1, 'unknown');
