# nextcom

## Environments

Vite modes are configured separately:

| Environment | Local command | Build |
| --- | --- | --- |
| Development | `npm run dev` | `npm run build` |
| Staging | `npm run dev:staging` | `npm run build:staging` |
| Production | — | `npm run build:production` |

Start the transit API in another terminal with `npm run server`. Development
and staging Vite servers proxy `/api` to `http://localhost:3001`. Each mode has
an environment file (`.env.development`, `.env.staging`, `.env.production`)
with `VITE_API_BASE_URL`. Leave it empty for same-origin API requests; set it
to the API origin for a separately hosted stage or production service using
`.env.staging.local` or `.env.production.local`. These local override files
are git-ignored. Vite client variables are public—do not put secrets in them.

Production runs on Vercel, see [Deploy](#deploy).

The city picker can link to an HTTPS `t.me` channel using
`VITE_TELEGRAM_CHANNEL_URL`. To collect launch notifications, configure
`VITE_CITY_UPDATES_ENDPOINT` with an endpoint that accepts a JSON `POST` body
containing `{ "email": "...", "city": "..." }` and returns a successful HTTP
status when the address is recorded. Without these settings, the city-launch
dialog clearly indicates that Telegram and email signup are not connected; it
does not store or send entered email addresses.

## Shelter data

The API serves the 4,796 entries in [`data/shelters.json`](./data/shelters.json), normalized from the supplied Lviv municipal shelter list. During an active Lviv-region air alert, the app uses device geolocation to show the three closest locations marked ready or recommended with 24/7 access. The map can display the shelter locations; distances are straight-line estimates and walking directions open in Google Maps. The source list may be out of date, and its access information does not guarantee a shelter is currently open—follow official instructions and verify conditions on site.

## Development test data

Open **`/dev`** (for example `http://localhost:5173/dev`) to unlock the
developer tools: a floating **DEV** button appears in the corner of the app and
opens the panel. The tools exist in every build - the route itself is the gate -
and `Ctrl`/`Cmd` + `Shift` + `D` toggles the panel. The button can be dragged
anywhere and remembers its position between sessions.

The panel is split into four tabs:

- **Data** - switch from live data to the local test fixture database
  (deterministic vehicles, stops, places, route traces, and alert states, so it
  works without the live transit API), pick a scenario, adjust fleet size and
  speed, set or randomize a seed, run the fixture smoke test, and copy a replay
  link.
- **Runtime** - live counters for the map, places, stops, shelters, transit
  status, network state, and a frame-rate meter, plus stress-test presets that
  spawn up to 300 vehicles at once.
- **Diagnostics** - copy a diagnostics report, export the current state as a
  JSON file, reset the scenario settings, or wipe every developer-owned
  local-storage key.
- **Admin** - dataset overview and a shortcut to the admin page.

Available scenarios: **Regular day**, **Peak hour**, **Late evening**,
**Air raid alert**, **No service**, **Network loss** (the API stops answering)
and **Slow API** (responses are delayed by 6 seconds). Settings are saved in
browser local storage. **Copy replay** creates a `/dev` URL that opens the same
scenario with test mode enabled.

Test data is applied **only while the app sits on `/dev`** - leaving the route
restores the live server data, so fixtures can never reach real users. The
simulator is read-only and does not write to the live API. Test vehicles are
placed along bundled Lviv GTFS route geometry; selecting one shows its real
route shape instead of a synthetic straight line. The map renders buses, trams,
and trolleybuses as separate 3D models. Vehicle positions and speeds are
simulated, not live GPS readings.

The admin page is protected by a password checked by the Vite server. Set
`ADMIN_PASSWORD` in the git-ignored `.env.development.local` file before opening
the admin page. It can inspect and edit the current in-memory vehicles, stops,
shelters, places, events, air-alert status, and fixture settings.
Validated overrides are stored in this browser's local storage; they do not
write to the transit API or a shared database.

## City guide demo

The city guide separates transport, map places, education, services, jobs,
real estate, and events into distinct sections. Places and education
establishments come from visible OpenStreetMap points of interest. The
education section includes mapped schools, kindergartens, universities,
specialized schools, and libraries; its coverage and details depend on
OpenStreetMap contributions and may be incomplete or out of date. It does not
invent ratings or reviews. Local service and job examples, property listings,
and events remain demonstration data—not verified providers, vacancies, or
offers—and are not connected to a publishing service. Services can be filtered
by beauty, dry cleaning, plumbing, repairs, and cleaning; jobs and real estate
have their own category filters. These listings can open their example map
locations. Transport has its own section and opens the transit map separately
from place discovery. Nearby sorting is available only after location
permission is granted; otherwise the popular category is selected.
Place categories include dedicated filters for pets, sports, tourism, finance,
public services, religion, shopping, and nightlife. Nested place, school, and
event details stay in the left rail and provide a breadcrumb back to their list.

## Deploy

The site is a static Vite build plus one Vercel function, `api/[...path].js`,
which runs the same handler as `npm run server` (`server/transit-api.mjs`).
Without a background loop, each feed (vehicles 2.5 s, air alert 30 s, GTFS
shapes 6 h) refreshes when a request finds its copy stale. A cold start loads
the GTFS archive first, which takes about 6 seconds.

### 1. Supabase

1. Create a project. In **SQL Editor**, run
   [`supabase/migrations/20261024000000_push_notifications.sql`](./supabase/migrations/20261024000000_push_notifications.sql)
   (or `supabase db push` with the CLI).
2. **Authentication → URL Configuration**: set **Site URL** to the production
   origin and add `https://<your-domain>/app` and `http://localhost:5173/app`
   to **Redirect URLs**. Sign-in is a passwordless email link.
3. Optional Google sign-in: enable the Google provider in **Authentication →
   Providers**, then set `VITE_AUTH_GOOGLE=true`.
4. For real users, set up custom SMTP (**Authentication → Emails**). The
   built-in mailer sends only a few emails per hour.

### 2. Web Push keys

```bash
npx web-push generate-vapid-keys
```

The public key goes in `VITE_VAPID_PUBLIC_KEY`, the private key in
`VAPID_PRIVATE_KEY`. Generate them once: new keys invalidate every existing
subscription.

### 3. Vercel

Import `andriihukco/next` in Vercel (framework preset Vite; `vercel.json` sets
the build). Add these environment variables for Production (and Preview):

| Variable | Where it is used | Value |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser + server | Project URL |
| `VITE_SUPABASE_ANON_KEY` | browser | `anon` / publishable key |
| `VITE_VAPID_PUBLIC_KEY` | browser + server | VAPID public key |
| `VITE_AUTH_GOOGLE` | browser | `true` to show Google sign-in |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | `service_role` key. Never prefix it with `VITE_`. |
| `VAPID_PRIVATE_KEY` | server only | VAPID private key |
| `VAPID_SUBJECT` | server only | `mailto:you@example.com` or the site URL |
| `CRON_SECRET` | server only | A long random string |

Every push to `main` deploys to production, and other branches get preview URLs.

### 4. Air alert notifications

`GET /api/cron/air-alert` with `Authorization: Bearer $CRON_SECRET` checks the
Lviv region status and notifies subscribers when it changes (alert and all-clear).
It must run every minute. Vercel Cron runs once a minute only on the Pro plan.
On Hobby, schedule it from Supabase instead. Enable the `pg_cron` and `pg_net`
extensions, then run:

```sql
select cron.schedule('air-alert-push', '* * * * *', $$
  select net.http_get(
    url := 'https://<your-domain>/api/cron/air-alert',
    headers := jsonb_build_object('Authorization', 'Bearer <CRON_SECRET>')
  );
$$);
```

Users turn on notifications in **Профіль → Дозволи → Повітряна тривога**. This
requires sign-in. On iPhone it works only after **Share → Add to Home Screen**
(iOS 16.4+). **Тестове сповіщення** sends a test notification to that
account's devices.

Locally, put the server variables in `.env.local`, which `npm run server` reads.
Set `PUSH_DISPATCH_IN_PROCESS=true` to dispatch from the 30-second poll instead
of the cron endpoint.

### Not available on Vercel

Place photos (`/api/place-images`) need the local Google Maps scraper
(`SCRAPER_BASE_URL`). Without it, cards show their empty photo state.

