# next — UI/UX and Code Revamp Plan

Date: 2026-10-21 · Status: proposal, awaiting phase approval · Owner: TBD

Companion to [DESIGN.md](../DESIGN.md). Decisions D1–D5 in that file must be answered before Phases 2 and 4.

## 1. Why

The app works, but it was built quickly and has grown inconsistent:

| Area | Evidence (from the 2026-10-21 audit) | Impact |
|---|---|---|
| Styling | 6 `:root` blocks; `--muted` means two things; primary color changes value between blocks; 21 `!important`; ~1,900 CSS selectors in one 12.5k-line file | Hard to change anything safely; visual drift |
| Components | ~37 raw `<button>` controls bypass `ui/` primitives; no chip primitive | Inconsistent states, focus rings, sizes |
| Structure | `App.tsx` 4,408 lines; `city-guide.tsx` 2,051 lines | Slow reviews, risky edits |
| Accessibility | Primary `#32CD32` gives 2.1:1 with white text; one `<img>` without `alt`; icon-only controls depend on tooltips | Fails WCAG 2.2 AA |
| Flows | Onboarding step 2 targets a missing element; step 3 depends on a mounted section | Tour silently breaks |
| Brand | «next», `un-` and `eway-` storage keys, `eway-lviv-pro` package name | Confusing for users and maintainers |
| Quality gates | No lint, no formatter, no CI; one test file | Regressions are caught by hand |
| Server | Open CORS on GET, no rate limit, parsing and routing in one 616-line file | Fine for read-only data; harder to extend |

## 2. Principles

1. **Behavior first.** Every phase keeps the app working and is checked in the browser at 375px and 1440px.
2. **One source per concern.** One token block, one primitive per control, one hook per data source.
3. **Small, reviewable steps.** No phase changes more than one area of the app.
4. **Nothing invented.** Demo, estimate, and example data keep their labels.

## 3. Phases

### Phase 0 — Guardrails (1–2 days)
- Add ESLint (TypeScript + React hooks rules) and Prettier with the existing style.
- Add a CI workflow: `tsc --noEmit`, `npm run test:fixtures`, `npm run build`.
- Add `.gitignore` entries for `dist/`, `.DS_Store`, `.freebuff/`, `.debug-journal.md`.
- Decide what to do with `static.zip` (move out of the repo or ignore).
- Take screenshot baselines for the main flows at 375px and 1440px (map, transport list, vehicle selected, place detail, onboarding).

**Exit:** CI green on `main`; baselines saved.

### Phase 1 — Design tokens and CSS cleanup (3–5 days)
- Merge the six `:root` blocks into one `:root` in `src/index.css`. Keep the final computed values as the baseline.
- Split `index.css` into layers with `@layer tokens, base, components, utilities` and move each component's rules next to it.
- Remove duplicate selectors (`.transport-category`, `.city-section-nav`, `.onboarding-feature-list`, and others found in the audit).
- Remove `!important` outside the reduced-motion block.
- Replace repeated hex literals with tokens.

**Exit:** no duplicate `:root`; `!important` count is zero outside reduced motion; visual baselines match.

### Phase 2 — Primitives and controls (1 week) — needs D1, D3
- Create `Chip` (default, hover, pressed, focus-visible, disabled).
- Create `IconButton` with required `label` and a built-in tooltip.
- Migrate the raw buttons in `App.tsx` and `city-guide.tsx` to primitives, one area at a time.
- Create `Sheet` and `Inspector` containers so mobile bottom sheets and desktop inspectors share one component.
- Apply the radius scale from DESIGN.md (6 / 8 / 999).

**Exit:** no raw `<button>` for controls outside `ui/`; one inspector component.

### Phase 3 — Split the monoliths (1–2 weeks)
Refactor by behavior, not by file size:
- `hooks/useTransitData` — vehicles, stops, air alert, polling, admin overrides.
- `hooks/useOnboarding` — phase, step, persisted flags, spotlight rect.
- `hooks/useMapLayers` — 3D vehicles, buildings, GeoJSON sources.
- `features/transport/*`, `features/places/*`, `features/education/*`, `features/events/*`, `features/onboarding/*`.
- `App.tsx` becomes a composition shell under ~300 lines.
- Split `city-guide.tsx` the same way.

**Exit:** no file over ~600 lines in `src/`; behavior unchanged per baselines.

### Phase 4 — Flows and UX (1–2 weeks) — needs D5
- **Onboarding:** fix the missing `place-search` target; render tour steps only when their target exists; implement the agreed welcome redesign (pills, animation, logo title).
- **Transport:** one consistent path: list or map → select → inspector with route card. Deselect returns the full map.
- **Navigation:** every opened detail gets the same back behavior and breadcrumb.
- **States:** one pattern each for loading, empty, error, and offline. Errors say what to do next.
- **Labels:** every demo or estimate is labeled where it appears.
- **Map:** vehicle plates follow the compact/detail rule (route badge by default, details when zoomed in or selected).

**Exit:** each flow has a written step list and a baseline screenshot.

### Phase 5 — Accessibility pass (3–5 days)
- Contrast check for every text and control color; fix the primary color (D1).
- Keyboard walk-through of every flow; visible focus everywhere.
- Semantic labels for all icon-only controls; `alt` on all images.
- Reduced-motion check for all new animations.
- Screen-reader check of the onboarding dialog (focus trap, return focus on close).

**Exit:** no AA failures in the checklist from DESIGN.md section 11.

### Phase 6 — Brand, data keys, dev tools (2–3 days) — needs D2
- Pick one brand name; rename `un-` and `eway-` storage keys with a one-time migration that reads the old keys.
- Update `package.json` name, `index.html` title, README, and DESIGN.md.
- Keep `/dev` tools behind the route gate; confirm no fixture code path runs on live data.

**Exit:** one name everywhere; migration tested with existing localStorage.

### Phase 7 — Server hygiene (2–3 days)
- Split `server.js` into modules: GTFS loader, live vehicles, air alert, shelters, buildings, routes.
- Add request logging and a health endpoint.
- Restrict CORS to the known origins for any non-public endpoint; keep public GET endpoints as they are if that's the decision.
- Add a simple rate limit on expensive endpoints (`/api/buildings`).

**Exit:** server modules have tests for next-stop and map-matching logic.

## 4. Optional later

- Dark mode, as one token block (D4).
- Route drawn on the map for a selected vehicle (option 4 from the brainstorm).
- Real data sources to replace demo listings, once verified.

## 5. Open decisions

| ID | Question | Needed before |
|---|---|---|
| D1 | Primary color: `#087a50` or keep lime? | Phase 2 |
| D2 | Brand name | Phase 6 |
| D3 | Radius rule (8px max vs current 22px cards) | Phase 2 |
| D4 | Dark mode: now or later | Optional |
| D5 | Onboarding redesign brief (approved in part) | Phase 4 |

## 6. Recommendation

Start with **Phase 0 and Phase 1**. They are low risk, improve every later phase, and need no product decisions. Phase 2 waits on D1 and D3.
