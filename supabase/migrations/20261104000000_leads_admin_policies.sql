-- Completes 20261102000000_landing_leads.sql. Production already had the leads table and its
-- insert policy from an earlier, hand-applied version, so the admin read and delete policies
-- were never created. They need public.is_admin() from 20261101000000_platform_schema.sql.
-- Rollback: drop the two policies below.

drop policy if exists "Admins read sign-ups" on public.leads;
drop policy if exists "Admins remove sign-ups" on public.leads;

create policy "Admins read sign-ups"
  on public.leads for select to authenticated
  using ((select public.is_admin()));

create policy "Admins remove sign-ups"
  on public.leads for delete to authenticated
  using ((select public.is_admin()));
