# Platform plan: real data, admin, 3D buildings, delivery process

Status: proposal, 2026-11-01. Owner decisions are in Part A §5. Part B is a self-contained brief for the implementing agent (Opus).

Verified facts come from the repo at commit `54dffc3`. Anything marked **unverified** needs a check in the Supabase, Vercel or GitHub dashboards, which this review could not access.

---

## Part A. Plan

### A1. Current state (verified)

| Area | What exists | Gap |
|---|---|---|
| Places | Derived live from OpenFreeMap OSM vector tiles at z14 (`mobile/src/lib/places-api.ts`, `src/lib/city-places.ts`). No database table. | Cannot be edited. No admin data. |
| Place photos and ratings | Local Google Maps scraper in Docker (`server/place-images.mjs`, `SCRAPER_BASE_URL` optional). Ratings in UI come from `demoRatingFor()` (`src/lib/demo-rating.ts`). | Scraper is not production-reachable. Scraping Google content likely breaks Google's terms. Ratings are fake. |
| Events, jobs, real estate | Static arrays in `src/lib/city-fixtures.ts`, used by production code. | Dummy content in production. |
| Services (shop, table, cinema, appointment, taxi, membership) | Demo catalogs, duplicated in `src/features/super-app/demo-data.ts` and `mobile/src/lib/demo-*.ts`. | No provider connected. Shown as flows. |
| Transit | Live feed through `server/transit-api.mjs`. Simulated fixtures in `src/lib/dev-fixtures.ts`, gated by dev tools. | Need to confirm the simulation cannot reach production bundles. |
| Buildings (OSM) | `/api/buildings` loads footprints (`server/transit-api.mjs:765`). | Good. No 3D models attached. |
| 3D building models | `BuildingModelEditor` stores OBJ/FBX in the browser's IndexedDB (`src/lib/building-model-store.ts`). Per browser, not shared. | Not on the server. Not visible to users. |
| Admin | `AdminPanel` edits JSON datasets. Gated by `developmentToolsAvailable`. Password checked by a Vite dev middleware (`vite.config.ts:12`, `ADMIN_PASSWORD`). | Dev only. Not a real admin. No roles. |
| Supabase | Auth (email, Google, Telegram), push subscriptions, air-alert state. Two migrations in `supabase/migrations/`. | No `config.toml`, no CLI link, no places/content tables, no roles, no storage buckets. |
| Vercel | `vercel.json` (Vite, functions, security headers, rewrites). `api/[...path].js` runs the same handler as `server/transit-api.mjs`. | Function body limit is 4.5 MB, so uploads must bypass it. |
| CI | `.github/workflows/ci.yml`: `tsc`, lint, fixture test, build on push to `main` and on PRs. | Mobile has no CI. Branch protection **unverified**. |
| Release notes | None. Recent commits are the only history. | Need a user-facing «Що нового» page. |
| Legal | None in the repo: no terms, privacy policy, contacts, cookie or data-source pages. | Required before public launch and before App Store submission. |
| Mobile | Expo app, WebView map (`city-map.tsx`). Native map spike in progress (`mobile/src/components/map/native-city-map.tsx`). | Needs dev build before testing. |

### A2. Target architecture

```
Browser (web) / Expo app (mobile)
   │ public reads: published places, buildings, releases
   ▼
Vercel (Vite SPA + /api functions)            Supabase
   /api/*  (public, cached)  ───────────────▶  Postgres + RLS  (source of truth)
   /api/admin/* (role check)  ──service role──▶  Storage: building-models, place-photos
   /admin  (lazy chunk, admin role only)      ◀── Auth (email, Google, Telegram)
   /updates (public release notes)
GitHub: PR → CI → Vercel preview URL → approve → squash-merge → Vercel production
        merge event → GitHub Action → POST /api/admin/releases → releases table
```

Principles:
1. **OSM stays the base map.** Our places are overrides and additions keyed by OSM id, not a copy of OSM. This limits ODbL exposure (see A6).
2. **Roles in the database, enforced by RLS.** No role logic lives only in the UI.
3. **Uploads go straight to Storage** through signed upload URLs. Functions never receive the file.
4. **Admin code is a separate lazy chunk.** Public visitors never download it.
5. **Every visible number or label is sourced or hidden.** No «Демо» data stays in production.

### A3. Data model (proposed)

| Table | Purpose | Key columns | Who writes |
|---|---|---|---|
| `profiles` | Role per user | `id` (→ auth.users), `role` in (`user`,`editor`,`admin`) | Admin only, via SQL or admin UI |
| `places` | Places added by us | `id`, `name_uk`, `category`, `address`, `lat`, `lng`, `hours`, `phone`, `website`, `photo_path`, `status` (`draft`,`published`,`hidden`), `created_by`, `updated_at` | editor, admin |
| `place_overrides` | Edits to OSM places | `osm_ref` (PK), `name_uk`, `category`, `hours`, `phone`, `website`, `hidden`, `updated_by`, `updated_at` | editor, admin |
| `building_models` | 3D model per OSM building | `id`, `osm_building_ref`, `storage_path`, `format` (`glb`), `bytes`, `triangles`, `texture_max_px`, `offset_lng`, `offset_lat`, `rotation_deg`, `scale`, `status`, `created_by` | editor, admin |
| `releases` | «Що нового» entries | `id`, `pr_number`, `category` (`new`,`improved`,`fixed`,`internal`), `title_uk`, `body_uk`, `commit_sha`, `published_at`, `preview_url` | CI (service role), admin |
| `audit_log` | Who changed what | `actor`, `action`, `entity`, `entity_id`, `before`, `after`, `created_at` | triggers only |

Storage buckets: `building-models` (private; public read through a signed URL or a public path only when `status = 'published'`), `place-photos` (same rule).

### A4. Delivery process (the loop you asked for)

1. **Intake.** You describe a task. Claude classifies it as feature, fix, chore, content or infra. It splits anything above about 400 changed lines into slices, each deployable alone. Splitting is shown to you before building.
2. **Branch and PR.** One branch per slice (`feat/…`, `fix/…`). The PR template asks for: summary, **release note in Ukrainian (one sentence)**, category, screenshots, risks, and checks run.
3. **Checks.** CI runs `tsc`, lint, fixture test, build. The migration check runs on the staging Supabase project.
4. **Preview.** Vercel builds a preview URL per PR. It is posted on the PR. Preview uses the **staging** Supabase project, never production.
5. **Your approval.** You review the preview and say «approve». Claude then squash-merges. Nothing merges without that word.
6. **Production.** Merge to `main` triggers the Vercel production deploy and the production migration (staging first, then production).
7. **Release note.** A GitHub Action reads the PR's release-note line and posts it to `releases`. It shows on `/updates` with its category. `internal` entries stay off the public page.
8. **Rollback.** Vercel instant rollback for code. Every migration has a paired down script.

Concrete rules: no direct pushes to `main`. Branch protection requires CI to pass (**unverified**: confirm in GitHub settings).

### A5. Decisions you need to make

| # | Question | My default | Why it matters |
|---|---|---|---|
| D-A | Places source: overrides on OSM, or import all OSM places into a table? | Overrides + our own additions (A2 principle 1) | Import makes us the owner of OSM data (ODbL share-alike). Overrides keep the base in OSM. |
| D-B | Google scraper photos and ratings: keep, replace, or drop? | Drop from production. Admin uploads photos. Ratings hidden until a source exists. | Scraping Google content likely violates its terms. Paid Places API is the legal option. |
| D-C | Who is admin? | You are the only `admin`. Editors are invited by you. MFA required for admin. | Defines RLS and the invite flow. |
| D-D | Operator details for terms, privacy and contacts (legal name, registration, address, support email, country) | I will not invent them. Placeholders until you send them. | Required for legal pages. A lawyer should review before launch. |
| D-E | Services flows (shop, table, cinema, appointment, taxi, membership): hide until a provider is connected, or keep as «Незабаром»? | Hide from the production build. Keep code behind a flag. | Demo flows in production are misleading. |
| D-F | Release notes: generated from PR text, or written by hand on `/updates`? | Generated from the PR line, edited in admin if needed | Keeps the process to one field per PR. |

### A6. Gaps this plan fills

These were missing from the product. Each item is in the backlog (Part B, S8 or S9).

- **Legal pages:** Terms of use, Privacy policy, Contacts, Cookie notice (only essential cookies and localStorage: auth session, push subscription, theme). Data-subject rights, retention periods and the processor list (Supabase, Vercel, Telegram, Google, OpenFreeMap).
- **Data-source attribution:** OpenStreetMap (ODbL: attribution plus share-alike for derived databases), Lviv open data (shelters, transit), OpenFreeMap, MapLibre (BSD). A visible «Джерела даних» page and the in-map attribution.
- **Safety disclaimers:** air-alert info is not the official warning system. Doctor and health flows say «не медична порада» (when they return).
- **Account deletion:** required by Apple's App Store rules for apps that create accounts. Build it for web and mobile together.
- **Accessibility statement:** WCAG 2.2 AA target, contact for accessibility issues.
- **Observability:** Vercel Analytics and Speed Insights (privacy-friendly, no cookies), error reporting for client and API, uptime check on `/api/vehicles`.
- **Backups:** Supabase point-in-time recovery (paid plan, **unverified** which plan is in use). A monthly export of the content tables to a private bucket.
- **Moderation and abuse:** rate limits on admin and upload endpoints, file-type and size checks, audit log, a «report a problem» link on places.
- **Cost guardrails:** Storage and egress budget per month, alert at 80%. Model size caps (B4).

---

## Part B. Brief for the implementing agent (Opus)

You are implementing this platform in the repo at `/Users/andriihuk/Desktop/CURRENT/next`. Read this part and `DESIGN.md` before writing any code. Follow `CLAUDE.md` and `.claude/skills/eway-product-design/SKILL.md`.

### B0. Rules

- Work in slices. One slice = one branch = one PR. Do not start a slice before its dependencies merge.
- Never push to `main`. Open a PR, post the Vercel preview URL, and stop. Merge only after the user says «approve».
- No mock data, no fixtures and no «Демо» content in production code paths. Dev-only fixtures stay behind `import.meta.env.DEV` and are excluded from production builds (verify by grepping `dist/` after `npm run build`).
- Every new UI value comes from `DESIGN.md` tokens. No raw hex, no new radii, no new font sizes.
- Secrets: never print, log or commit keys. `VITE_*` is public. `SUPABASE_SERVICE_ROLE_KEY` is server only.
- Ukrainian copy, formal «ви», sentence case.
- Use `npx expo install` for mobile packages; mobile needs `--legacy-peer-deps` until the peer conflict is fixed (see Known issues).

### B1. Known issues to handle first

1. `npm install` in `mobile/` fails with an ERESOLVE peer conflict on the untouched project. Fix it in S0 (pin `react-dom` or use an override), then remove `--legacy-peer-deps`.
2. `vite.config.ts` contains a dev-only admin password check. Remove it in S2.
3. `src/lib/city-fixtures.ts` (events, jobs, real estate) is imported by production code. Remove in S6.
4. `src/lib/demo-rating.ts` produces fake ratings. Remove in S6.
5. `mobile/src/components/transport/city-header.tsx` is unused. Remove in the header slice.
6. The mobile native map spike (`mobile/src/components/map/native-city-map.tsx`) is not yet built on a device. Keep it working behind `EXPO_PUBLIC_NATIVE_MAP=1`.

### B2. Slices

| Slice | Goal | Depends on | Done when |
|---|---|---|---|
| **S0 Process and infra** | Staging and production Supabase projects; `supabase/config.toml`; `supabase link` for each; migration job in CI; PR template with the release-note field; branch protection on `main` (user action, document it); Vercel preview env uses staging keys; fix mobile peer conflict | none | A PR shows a preview URL on staging. A migration applies to staging from CI. |
| **S1 Schema and RLS** | Tables in A3, indexes, `updated_at` triggers, `audit_log` triggers, Storage buckets, RLS policies. Public read only for published rows. | S0 | SQL tests pass for anon, user, editor, admin (script in `supabase/tests/`). |
| **S2 Auth and admin shell** | Remove the Vite dev password. `/admin` as a lazy chunk. Role check on the server (`auth.getUser` with the user's JWT, then `profiles.role`). MFA required for admin (Supabase MFA). Responsive shell: desktop = list, map and inspector; mobile = list with a bottom sheet. | S1 | A user without the role gets 404. A non-admin API call returns 403. Status 2026-11-01: done on `feat/s2-admin-shell` (Vite password removed, `/admin` lazy, `GET /api/admin/me`, TOTP step). Not yet run with a real admin account: needs S1 applied and a role row. |
| **S3 Admin places** | List, search, filter by category and status. Map view: select a place, edit in an inspector form, drag a marker to move it (writes `lat`/`lng` to `place_overrides` or `places`), hide a place, add a place by clicking the map. Photo upload to `place-photos`. Every save writes `audit_log`. | S2 | An edit made in admin appears in the public API within one cache cycle and in the web and Expo apps. |
| **S4 Building models upload** | Accept `.glb` and `.gltf` (with textures). Accept `.obj` (+ `.mtl` and textures in one ZIP) and convert it in the browser (three.js `OBJLoader` and `GLTFExporter`). Optimize with `@gltf-transform` (meshopt, texture resize, dedupe, prune). Upload to Storage with a signed URL. Validate server-side: magic bytes `glTF`, size, triangles, texture size (B4). Preview on a map with a transform gizmo (position, rotation, scale). Publish to `building_models`. | S2 | Upload → preview → publish works. Over-budget files are rejected with the reason shown. |
| **S5 3D rendering** | Replace IndexedDB reads in `building-3d-layer.ts` with `/api/buildings/models?bounds=…` (published only). Load with `GLTFLoader` + `MeshoptDecoder`. Use `MeshStandardMaterial` (PBR) with baked AO and an environment from `RoomEnvironment` or a small HDR. No custom shader on mobile. Fall back to the extruded footprint when no model exists. Cache models in memory; cap concurrent loads. | S4 | Frame time stays above 45 fps on a mid-range phone with 30 visible models (measure with the existing FPS hook). |
| **S6 Remove dummy data** | Delete `city-fixtures.ts` usage: events and listings come from the DB (new tables) or are hidden with «Незабаром». Delete `demo-rating.ts`; ratings render only when a real source exists. Hide services flows behind a flag (D-E). Delete duplicated `demo-*.ts` in mobile after the flag. Decide on the scraper (D-B) and remove its UI paths. | none (can start early) | `grep -rn "Демо\|demoRating\|city-fixtures\|demo-data"` returns only the flag code. Status 2026-11-01: web done on `feat/s6-remove-dummy-data` (flags in `src/lib/features.ts`). Mobile `demo-*.ts` not done. |
| **S7 Release notes** | `releases` API (`POST /api/admin/releases` with a CI token, `GET /api/releases`). GitHub Action on merge to `main` that reads the PR release-note line. `/updates` page: category filter, newest first, Ukrainian copy, link to the preview of the PR. | S0, S1 | Merging a PR with a release note adds one entry on `/updates` within a few minutes. Status 2026-11-01: code done on `feat/s7-release-notes` (API, Action, `/updates`). Needs S1 applied and the `RELEASES_API_URL` and `RELEASES_CI_TOKEN` secrets. |
| **S8 Legal and trust** | `/terms`, `/privacy`, `/contacts`, `/sources` (data attribution), cookie notice (essential only), `/accessibility`. Text is a draft until counsel reviews it. Operator details from D-D; placeholders otherwise. Account deletion in web settings (and mobile profile later). Safety disclaimer for air alerts. | D-D | Pages exist, linked from the footer and from the sign-up flow. Account deletion removes the user's rows and the auth user. Status 2026-11-01: drafts and account deletion done on `feat/s8-legal-trust`; operator details are «[потрібно: …]» markers until D-D; counsel review and mobile pending. |
| **S9 Design tokens pass** | Remaining hex and radius literals (`DESIGN.md` §15 items 4 and 6). Mobile: move the 60 hex literals and 141 font-size literals to `theme.ts`. | none | Counts drop to zero for the audited files. |
| **S10 Mobile admin reuse** | Expo reads the same API. Mobile gets the same «Що нового» and legal pages. Native map phase 2 (see the mobile plan). | S3, S5 | Out of scope until web slices are approved. |

### B3. Process per slice (do this every time)

1. Create `feat/<slice>` from `main`.
2. Implement. Run `npx tsc --noEmit`, `npm run test:fixtures`, `npm run build`. Run `npm run lint` when the slice touches `src/`.
3. For migrations: apply to staging, run the SQL tests, then write the down script.
4. Open the PR with the template. Include the release-note line in Ukrainian.
5. Post the Vercel preview URL on the PR. Run the verification workflow from `CLAUDE.md` on the preview (desktop 1440px and mobile 375px, both themes, no horizontal scroll, keyboard path).
6. Stop and ask for approval with the preview link.
7. On «approve»: squash-merge. Confirm CI and the production deploy are green. Report the result.

### B4. Budgets (building models)

| Item | Limit | Reason |
|---|---|---|
| File size per model (`.glb`, after optimization) | 2 MB target, 5 MB hard limit | Mobile data and load time |
| Triangles per model | 20,000 target, 50,000 hard limit | Frame time with 30 models visible |
| Texture max side | 1024 px target, 2048 px hard limit | Memory |
| Textures per model | up to 4 (albedo, normal, metallic-roughness, occlusion) | Keeps PBR realistic with few samples |
| Models visible at once | 30 | Caps draw calls |
| Upload file size (raw) | 50 MB | Keeps conversion in the browser feasible |

Format choice: glTF 2.0 binary (`.glb`) with meshopt compression. OBJ is accepted for convenience only; it is converted in the browser and never served. Draco is an option if meshopt size is too large on test models. Realistic look comes from PBR materials, baked ambient occlusion and a neutral environment light. Use no custom shaders on mobile.

### B5. Acceptance checklist (whole project)

- [ ] Admin can create, edit, move, hide and add places; changes appear in web and mobile.
- [ ] Admin can upload a building model; a visitor sees it in 3D on the map.
- [ ] No user can read draft or hidden rows, or write rows they do not own (RLS tests).
- [ ] No «Демо» text or fixture data reachable in the production bundle.
- [ ] `/updates` lists every merged PR that has a release note.
- [ ] Terms, privacy, contacts, sources, accessibility and cookie pages are live; account deletion works.
- [ ] Branch protection, preview deployments and production deploy are confirmed in the dashboards (**unverified** today).

### B6. Out of scope for this brief

Payments and real service providers, mobile store submission, analytics beyond Vercel's built-in privacy-friendly metrics, multi-city support, and any change to the transit feed.

---

## Part C. Review notes

- The repo's `docs/ui-audit-2026-10-24.md` and `DESIGN.md` §15 already track the token and radius backlog. S9 consumes them, it does not duplicate them.
- `DESIGN.md` D2 (brand name) is still open. Do not change the wordmark until it is decided.
- Not checked in this review: Supabase project state and applied migrations, Vercel project settings and domains, GitHub branch protection, the content of `.env.staging`, cost of Storage and egress, and legal wording of any page. Each needs your check or counsel's.
