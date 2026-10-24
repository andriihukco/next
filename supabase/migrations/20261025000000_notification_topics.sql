-- Notification topics a device can pick in Profile → Сповіщення:
--   air-alert  the Lviv region alert starts
--   all-clear  the alert ends
--   threats    the alerts.in.ua report lists a new Lviv threat (drones, guided bombs)
alter table public.push_subscriptions
  alter column topics set default array['air-alert', 'all-clear'];

update public.push_subscriptions
  set topics = array_append(topics, 'all-clear')
  where not ('all-clear' = any (topics));

alter table public.push_subscriptions
  add constraint push_subscriptions_topics_known
  check (topics <@ array['air-alert', 'all-clear', 'threats']);

-- Threats already notified about. Null until the first dispatch records the current report.
alter table public.air_alert_state
  add column threat_keys text[];
