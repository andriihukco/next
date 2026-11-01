# Refactor plan: code quality, performance, scale

Status: in progress, 2026-11-01. Branches are stacked: r1 → r2 → s6 → r6 → r5 → r3 (merge in that order). Companion to [platform-plan.md](platform-plan.md) (product, data, admin, delivery). This file covers code structure only. Local development first: nothing here deploys to production.

## 1. Rules

| Rule | Limit | Why |
|---|---|---|
| File length | 400 lines max for `.ts`, `.tsx`, `.mjs` (generated files excluded) | One reason to change per file |
| Component size | One component per file, under 200 lines of JSX | Testable, reviewable |
| Component state | Max 8 `useState` per component. Group related state into a hook or reducer | Fewer re-renders, clearer logic |
| Pure logic | Lives in `src/lib/`, has no React imports, is covered by a test in `scripts/` | Easy to test, easy to reuse on mobile |
| Imports | Named imports only. No barrel re-export of large modules | Tree shaking, faster builds |
| Lazy loading | Admin, settings, onboarding, landing, services, dev tools are lazy chunks | Smaller first load |
| Styles | One CSS file per feature, imported by the component. Tokens only (DESIGN.md) | Dead CSS is visible, no global collisions |
| Naming | `kebab-case` files, `PascalCase` components, `use-*.ts` hooks | Matches existing code |
| Comments | Explain why, not what. File header only where the file is not obvious | Matches `domain.ts` style |

## 2. Audit (2026-11-01, before refactor)

Files over 400 lines:

| File | Lines | Plan |
|---|---|---|
| `src/App.tsx` | 4,132 (now 3,642) | Slices R1 (done: helpers extracted), R2 (component split) |
| `src/components/city-guide.tsx` | 1,498 | Slice R3 |
| `src/lib/city-places.ts` | 878 | Slice R5 (data split: categories, icons, parsing) |
| `server/transit-api.mjs` | 801 | Slice R6 (routes, feeds, shapes, push) |
| `src/lib/vehicle-3d-layer.ts` | 696 | Slice R7 (3D) |
| `src/features/settings/settings-dialog.tsx` | 530 | Slice R4 (tabs as components) |
| `src/components/entity-detail.tsx` | 507 | Slice R4 |
| `src/lib/building-3d-layer.ts` | 497 | Slice R7 |
| `src/landing/landing-page.tsx` | 492 | Slice R4 (landing sections) |
| `src/design-system/design-system-page.tsx` | 426 | Slice R4 (dev page, lazy) |
| `src/features/onboarding/onboarding-dialog.tsx` | 402 | Slice R4 |
| `src/index.css` | 10,948 lines | Slice R8: split per feature, remove duplicate rules |

Other findings:
- `App.tsx` has about 58 `useState` and 30 `useEffect` in one component. Map, sheet, admin, dev tools, and onboarding state move into hooks.
- `index.css` has 6 `:root` blocks and about 840 one-off colors (DESIGN.md §15 items 1, 3, 6).
- `mobile/` has no file over 400 lines. Mobile slices run after the web slices.

## 3. Slices

| Slice | Scope | Status |
|---|---|---|
| **R1** Extract pure helpers from `App.tsx` | Types, validators, admin overrides, constants, map pins, formatters, GeoJSON builders | Done locally (branch `refactor/r1-app-helpers`). `tsc`, lint (0 errors), fixtures, build, and a browser smoke test on `/` and `/app` pass. |
| **R2** Split the `App()` component | Hooks: `useMapLayers`, `useTransitFeed`, `useCityPlaces`, `useSheetState`, `useAdminOverrides`, `useOnboardingGate`. Views: city, map, admin. Target: `App.tsx` under 400 lines | Done locally 2026-11-01 (`refactor/r2-app-split`): 3,196 → 390 lines, hooks in `src/hooks/`, views in `src/features/transport`, `src/features/places`. Also fixed: route reload on every poll, unresolved route color. |
| **R3** `city-guide.tsx` | Split by section (transport, places, events, jobs, real estate) | Done locally (`refactor/r3-city-guide`, `refactor/r3b-city-guide-sections`): 1,498 → 317 lines; constants, helpers and one component per section in `src/components/city-guide/`. Market, parking, fuel and charging share `SimplePlaceSection`. |
| **R4** Feature components over 400 lines | Settings, entity detail, landing, design system, onboarding. Each lazy-loaded where it is not on the first screen | Done locally (`refactor/r4-large-components`): settings 530 → 284, landing 491 → 385, design system 426 → 393, onboarding 402 → 297; entity detail went to 320 in S6. Lazy loading of settings and onboarding moves to R9. |
| **R5** `city-places.ts` | Categories and colors, icons, OSM feature parsing, formatting | Done locally (`refactor/r5-city-places`): 878 → 311 lines plus `city-place-categories.ts` and `city-place-classify.ts`. |
| **R6** `server/transit-api.mjs` | Routes per file: vehicles, stops, shelters, alerts, push, buildings, routes. One entry for the Vercel function | Done locally (`refactor/r6-server-split`): 801 → 203 lines, feeds in `server/feeds`, pure helpers in `server/lib`, `npm run test:server` (17 checks) in CI. Output matched the old server. |
| **R7** 3D layers | Shared loader and material setup. Vehicle and building layers become thin | Pairs with platform-plan S5 |
| **R8** `index.css` | Split per feature, remove the 1,122 overridden declarations already listed in DESIGN.md §15, merge the 6 `:root` blocks | Independent, large diff, do last |
| **R9** Performance | Virtualize long lists (places, transit routes), memoize map sources, cap re-renders on the 2.5 s vehicle poll | After R2 |

## 4. Design practices applied

- Tokens first: no raw hex, radius, or font size outside `DESIGN.md`.
- Primitives first: build from `src/components/ui/`.
- Honest data: no demo or fixture values reach production paths (see platform-plan §B2 S6).
- Accessibility: keyboard reachable, visible focus, `aria-*` state, reduced motion respected (WCAG 2.2 AA).
- Performance budget: first load JS under 300 KB gzipped for the city screen (measure in `npm run build` output, not assumed). Vehicle poll does not re-render the whole screen.

## 5. Verification for every slice

1. `npx tsc --noEmit`
2. `npm run lint` (0 errors; existing warnings do not grow)
3. `npm run test:fixtures`
4. `npm run build`
5. Browser smoke test on `/` and `/app` with the `web` dev server. No console errors. Map renders.
6. For UI slices: the verification checklist in DESIGN.md §11 at 375px and 1440px.
7. Commit on a branch per slice. Open a PR only when the user asks.

## 6. Relation to other plans

- Product, data, admin, 3D and delivery process: [platform-plan.md](platform-plan.md).
- Mobile native map: spike on branch `feat/native-map-spike` (not merged).
- Open decisions in DESIGN.md §14 (D2 brand name) stay open.
