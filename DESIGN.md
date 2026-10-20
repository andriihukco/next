# next — Design System

Status: v2, rewritten after the 2026-10-21 app audit. This file is the source of truth for UI work.
If code and this file disagree, either fix the code or change this file in the same change. Do not add a one-off style that this file does not describe.

## 1. Principles

1. **Map first.** The live city map stays dominant. Panels are compact and sit beside or above it.
2. **One visual language.** One token set, one icon font, one radius scale, one motion curve. Reuse before inventing.
3. **Accessible by default.** WCAG 2.2 AA contrast, keyboard operation, visible focus, reduced motion respected.
4. **Honest data.** Estimates and demo content are labeled as such. Never invent ratings, reviews, prices, or live status.

## 2. Color tokens

All tokens live in one `:root` block in `src/index.css`. Do not add a second `:root` block or redefine a token elsewhere.

| Role | Token | Value | Notes |
|---|---|---|---|
| Page background | `--background` | `#f8faf9` | |
| Main text | `--foreground` | `#18251f` | |
| Card / popover | `--card` | `#ffffff` | |
| Muted surface | `--surface-muted` | `#f1f4f2` | Surface only. Never use `--muted` for text. |
| Secondary text | `--muted-foreground` | `#68776f` | Text only. Meets AA on `--background`. |
| Border / input | `--border` | `#dce5df` | |
| Primary action | `--primary` | `#087a50` | White text is 5.4:1. See open decision D1. |
| On primary | `--primary-foreground` | `#ffffff` | |
| Primary tint | `--accent` | `#e5f2eb` | Selected chip and tinted icon backgrounds. |
| Text on tint | `--accent-foreground` | `#075c3d` | |
| Focus ring | `--ring` | `#11835b` | Always visible on keyboard focus. |
| Destructive | `--destructive` | `#b42318` | |
| Tram (route) | — | `#ea580c` | Route color only. |
| Trolleybus (route) | — | `#0284c7` | Route color only. |

Rules:
- Use token names in CSS and Tailwind (`bg-primary`, `text-muted-foreground`). Raw hex is allowed only inside this table.
- Never communicate state by color alone. Pair color with an icon, label, or `aria-pressed`/`aria-selected`.
- No dark mode yet. Do not add `prefers-color-scheme` rules piecemeal; add dark tokens as one block when the decision is made.

## 3. Typography

- UI font: **Manrope** (500, 600, 700, 800). Fallback: Arial, sans-serif.
- Monospace: **JetBrains Mono** for route numbers, vehicle plates, and coordinates only.
- Scale (px / line-height):

| Step | Size | Use |
|---|---|---|
| Caption | 12 / 1.4 | Eyebrows, progress labels, attribution |
| Small | 14 / 1.4 | Chips, metadata, secondary rows |
| Body | 15 / 1.55 | Paragraphs, descriptions |
| Title | 17 / 1.3 | Card and row titles |
| Inspector | 22 / 1.2 | Inspector and sheet headings |
| Display | 28 / 1.15 | Onboarding and empty-state headings only |

- Headings: letter-spacing `-0.02em` to `-0.04em` at 22px and up. Body text uses default tracking.
- Do not add a new font size outside this scale.

## 4. Spacing, radius, elevation

- Spacing: 4px grid. Use 4, 8, 12, 16, 24, 32. No odd values such as 5, 7, 11, 15.
- Radius (three values only):
  - `6px` small controls (icon buttons inside a panel)
  - `8px` surfaces: cards, panels, inspectors, modals
  - `999px` chips, pills, toggles
- Bottom sheets (mobile) round only their top corners, at 8px.
- Shadows: two tokens only: `--shadow-raised` for floating map controls and `--shadow-overlay` for modals, inspectors, and sheets.
- Stable control sizes: 36px minimum for controls, 44px minimum touch target on mobile.

## 5. Layout

- **Desktop:** planning rail on the left, map overlays next to the rail, one contextual inspector on the right.
- **Mobile (≤ 768px):** rail and inspector become bottom sheets. Map controls and alerts stay above the sheet with safe-area spacing.
- Test every UI change at **375px wide** with no horizontal page scroll, and at 1440px.
- On short screens, compress the planner before hiding route results.

## 6. Icons

- One icon family: **Material Symbols Rounded**, rendered only through `MaterialIcon` (`src/components/ui/material-icon.tsx`).
- Default is filled off, weight 400. Use filled (`FILL 1`) only for the selected/active state of a single icon.
- `MaterialIcon` `outlined` variant is not used. Remove it when touched.
- Do not add a second icon library. If a needed glyph is missing, add a semantic wrapper in `material-icon.tsx`.
- Icon-only actions require an accessible name (`aria-label`) and a tooltip.

## 7. Components

- Build controls from `src/components/ui/` primitives: `Button`, `Badge`, `Card`, `Input`, `Select`, `Slider`, `Switch`, `ToggleGroup`, `Tooltip`, `FilterBar`.
- Do not add raw `<button>` controls with bespoke classes when a primitive fits. Existing raw buttons are migration debt (see the audit backlog).
- **Chips** (filter/category pills such as Transport, Places, Events) are one primitive, `Chip`. Required states: default, hover, pressed/selected, focus-visible, disabled. Selection uses `aria-pressed` or `role="tab"` with `aria-selected`, never color alone.
- Section navigation: the horizontally scrollable section rail stays visible while switching content. Only an opened item detail uses a back-only header, with a breadcrumb back to its list.
- Map actions (zoom, location, orientation, 2D/3D toggle) use `Button` with `variant="ghost"` and the `map-control` class. They stay individually labeled and are not grouped in a bulky arrow-pad container.
- Vehicle and stop details open in the contextual inspector. Route selection highlights its GTFS geometry.
- Named buildings and places open dismissible detail inspectors. Show only attributes present in the source data.

## 8. Motion

- One easing curve: `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease-out) for enter and move. Use `ease-in` only for exit.
- Durations: **120ms** press and hover, **200ms** state changes (selection, progress), **320ms** panels and sheets entering or leaving. Maps move as long as the data needs, but never longer than 600ms for a fly-to.
- Animate `transform` and `opacity` only. Do not animate layout properties (`width`, `top`, `left`) for enter effects.
- Every animation has a `prefers-reduced-motion: reduce` fallback that removes movement but keeps the final state visible.
- Animation is decoration, not information. Remove it if it delays a read or a tap.

## 9. Copy (Ukrainian UI)

- Use the formal "ви" form consistently, with a capital letter only at the start of a sentence or a proper name.
- Sentence case for headings and buttons. No all-caps taglines.
- One brand name, spelled one way (see open decision D2).
- Button labels are verbs or short actions: «Почати тур», «Пропустити», «Назад».
- Demo data, estimates, and unconnected features are labeled where they appear, for example «Демо», «Оцінка», «Незабаром».

## 10. Onboarding (current spec)

- Three phases: welcome (centered dialog), optional profile questions, spotlight tour (5 steps, anchored to live UI via `data-tour` attributes).
- Every tour step's `data-tour` target must exist in the rendered UI. A missing target silently drops the spotlight. Check this when changing either side.
- The profile step is optional. Skipping never blocks the app.
- Location and notification permissions are requested only after the user asks for them. Do not imply notification delivery until the data source is connected.
- Replay is available from the `/dev` tools.
- Pending redesign: see open decision D5 and the onboarding questions in the audit summary.

## 11. Accessibility and motion checklist

Run this before merging any UI change:

- [ ] Text contrast is at least 4.5:1 (3:1 for large text and icons). Check white text on `--primary`.
- [ ] Every interactive element is reachable with Tab and shows a visible focus ring.
- [ ] Icon-only controls have `aria-label` and a tooltip.
- [ ] Selected/expanded states are exposed with `aria-pressed`, `aria-selected`, or `aria-expanded`.
- [ ] Status and errors are text, not color only; live status uses `role="status"`.
- [ ] Images have `alt`; decorative images use `alt=""` or `aria-hidden`.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] Layout checked at 375px and 1440px, no horizontal scroll.

## 12. Engineering conventions

- TypeScript strict. Do not add `any`; use `unknown` and narrow.
- One CSS definition per concern. Before adding a rule, search `src/index.css` for the selector. Do not add a second block for an existing component.
- Prefer component-scoped class names prefixed with the component name (`city-`, `onboarding-`, `transport-`).
- `!important` is not allowed except in the reduced-motion block.
- Before you finish a change, run `npx tsc --noEmit` and `npm run test:fixtures`.
- Development tools and fixtures live behind `/dev` and must not leak into production behavior.

## 13. Data notes

- Arrival minutes are proximity estimates from live vehicle positions, not scheduled predictions.
- Route shapes and stops come from GTFS. Place coverage depends on named OpenStreetMap features in visible tiles.
- Education listings and map POIs may have incomplete names or details. Do not invent ratings or reviews.
- Services, jobs, real estate, events, neighborhood posts, air-quality values, and weather are demo data and must be labeled as examples until a verified source is connected.
- Passenger counts and daily charts are labeled estimates. The live GPS feed has no passenger sensors.
- Vehicle inspectors show a generic illustrated model. The live feed does not identify manufacturer or model.

## 14. Open decisions

These need an owner's answer. Until then, follow the value in the middle column.

| ID | Question | Current state | Proposed |
|---|---|---|---|
| D1 | Primary color | Code uses `#32CD32` (lime) as `--primary`. It gives 2.1:1 with white text and fails AA. The earlier doc said `#087a50`. | `#087a50` (AA) |
| D2 | Brand name | UI title and onboarding say «next». Storage keys say `un-`, one key says `eway-`. `package.json` says `eway-lviv-pro`. Docs were corrupted to «nextcom». | Pick one, then rename keys in one migration |
| D3 | Radius | 8px rule vs 22px onboarding card, 24px sheets, and about 20 distinct radii in CSS. | Enforce the 6 / 8 / 999 scale |
| D4 | Dark mode | Not implemented. | Defer until after the token cleanup |
| D5 | Onboarding welcome/feature chips | Plain `<span>` chips with a visual arrow icon. Not interactive, not animated. | Confirm the redesign brief |

## 15. Audit backlog (2026-10-21)

Tracked gaps. Close each with a normal change and tick it here.

1. **Duplicate tokens.** `index.css` has 6 `:root` blocks. `--muted` means surface in one and text in another. `--primary` changes value between blocks. Merge into one block.
2. **Missing tour targets.** Onboarding step 2 targets `data-tour="place-search"`, which does not exist. Step 3 (`city-events`) only renders when the events section is mounted. Add the attributes or drop the steps.
3. **Duplicate CSS rules.** `.transport-category` is defined in at least three places, and `.onboarding-feature-list` and `.city-section-nav` are repeated. Keep the last intended one and delete the rest.
4. **Raw buttons.** About 37 raw `<button>` elements in `App.tsx` and `city-guide.tsx` bypass the primitives. Migrate when touched.
5. **Stray `!important`.** 21 uses in `index.css`. Remove outside the reduced-motion block.
6. **Hard-coded hex.** `#fff`, `#18251f`, and `#087a50` are repeated as literals. Replace with tokens.
7. **Monolith files.** `App.tsx` is 4,408 lines and `index.css` is 12,488 lines. Split by feature when touched, not in a bulk rewrite.
8. **No lint or format config and no CI.** Add ESLint and Prettier, and a workflow that runs `tsc`, the fixture test, and a build.
9. **Repo hygiene.** `.DS_Store`, `dist/`, `.freebuff/`, `.debug-journal.md`, and `static.zip` (3.7 MB) are untracked and not ignored. `coder.md` is empty. Add ignores and decide what to keep.
10. **Images without alt.** One `<img>` in `App.tsx` has no `alt`.
11. **API surface.** `server.js` sends `Access-Control-Allow-Origin: *` on GET endpoints and has no rate limiting. Acceptable for public read-only data. Revisit before any write endpoint exists.
12. **Admin auth is dev-only.** The admin password check runs in the Vite dev server only. Production has no admin login. Keep it that way unless a real auth design is approved.
