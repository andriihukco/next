# nextcom

## Environments

Vite modes are configured separately:

| Environment | Local command | Build |
| --- | --- | --- |
| Development | `npm rnextcom dev` | `npm rnextcom build` |
| Staging | `npm rnextcom dev:staging` | `npm rnextcom build:staging` |
| Production | — | `npm rnextcom build:production` |

Start the transit API in another terminal with `npm rnextcom server`. Development
and staging Vite servers proxy `/api` to `http://localhost:3001`. Each mode has
an environment file (`.env.development`, `.env.staging`, `.env.production`)
with `VITE_API_BASE_URL`. Leave it empty for same-origin API requests; set it
to the API origin for a separately hosted stage or production service using
`.env.staging.local` or `.env.production.local`. These local override files
are git-ignored. Vite client variables are public—do not put secrets in them.

The repository contains build/rnextcomtime configuration, but no deployment
infrastructure or separate hosted stage/production API has been provisioned.

The city picker can link to an HTTPS `t.me` channel using
`VITE_TELEGRAM_CHANNEL_URL`. To collect lanextcomch notifications, configure
`VITE_CITY_UPDATES_ENDPOINT` with an endpoint that accepts a JSON `POST` body
containing `{ "email": "...", "city": "..." }` and returns a successful HTTP
status when the address is recorded. Without these settings, the city-lanextcomch
dialog clearly indicates that Telegram and email signup are not connected; it
does not store or send entered email addresses.

## Shelter data

The API serves the 4,796 entries in [`data/shelters.json`](./data/shelters.json), normalized from the supplied Lviv mnextcomicipal shelter list. During an active Lviv-region air alert, the app uses device geolocation to show the three closest locations marked ready or recommended with 24/7 access. The map can display the shelter locations; distances are straight-line estimates and walking directions open in Google Maps. The source list may be out of date, and its access information does not guarantee a shelter is currently open—follow official instructions and verify conditions on site.

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
education section includes mapped schools, kindergartens, nextcomiversities,
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
