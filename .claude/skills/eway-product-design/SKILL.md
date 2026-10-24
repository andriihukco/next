---
name: eway-product-design
description: Use when designing, auditing, or changing any UI in the eway (next) city app: screens, cards, search results, detail pages, map panels, design-system components, tokens, or copy. Encodes the product philosophy (map first, honest data, one visual language), the map-app reference patterns (Apple Maps and Google Maps context cards), and the audit procedure against DESIGN.md.
---

# eway product design

This skill is the working method for UI in this repo. `DESIGN.md` is the source of truth for values. This file says how to decide, what to copy from reference apps, and how to audit.

## 1. Product philosophy

eway is a city companion for Lviv: transport, places, events, services. It is a map first.

1. **Map first.** The live city map stays dominant. Panels are compact and sit beside or above it. A panel never hides the map for longer than a task needs.
2. **One visual language.** One token set, one icon family (Material Symbols Rounded via `MaterialIcon`), one radius scale (6 / 8 / 999), one motion curve. Reuse a primitive before writing a new one.
3. **Honest data.** Real data is labeled as real. Samples are labeled «Демо», estimates «Оцінка», unconnected features «Незабаром». Never show a rating, review, price, or live status that is not from a source. Scraper data is named «Дані з Google Maps».
4. **Accessible by default.** WCAG 2.2 AA. Keyboard reachable, visible focus, `aria-pressed` / `aria-selected` / `aria-expanded` for state, reduced motion respected.
5. **Ukrainian copy, formal «ви».** Sentence case. Verb labels on buttons.

## 2. Reference patterns (Apple Maps and Google Maps)

Use these when a list, search result, or place card is being designed.

**Search results as context cards** (Google Maps search list, Apple Maps search):
- A row card: thumbnail on the right or left (photo when it exists, neutral tile while loading, icon tile or empty `image` tile when none), category eyebrow, title, one subtitle line (distance · address), then the rating line only when a real rating exists.
- The whole card opens its detail through the title button (stretched over the card). Never nest buttons.
- Keep one primary action per card at most, visible only when the card is selected or expanded.

**Selected place card** (Apple Maps place card, Google Maps place panel):
- Photo hero on top (16:9 at `radius-md`), then title, category · distance, rating.
- Action bar of pills: the primary action is filled (`Маршрут`), secondary actions are outline (`Дзвінок`, `Зберегти`, `Поділитися`). At most four actions. Follow `DESIGN.md` §7 for the kind-specific flows.
- Quick facts as label–value rows (hours, distance, accepts, phone). Show only facts present in the source.
- Sections follow the content: «Опис», «Інформація», «Відгуки». Each section that is empty is omitted.

**Map overlays:** controls dock to the corners. A card that covers the map on mobile lowers to the half detent (`DESIGN.md` §5), never hides the map controls.

## 3. Components

- Build from `src/components/ui/` (shadcn primitives). Composites: `UnifiedCard`, `ContextCard` (search and place results), `detail-layout`, `CategoryTiles`, `EntityDetail`.
- New composite? Add it to `/design-system` (`src/design-system/design-system-page.tsx`) in every state, in both themes, before it ships.
- Tokens only: no raw hex, no new radii, no font sizes outside `--type-*`. Category colors come from `CITY_PLACE_CATEGORY_COLORS` (`src/lib/city-places.ts`).
- Class names are prefixed by the component (`context-card__`, `city-`). One CSS definition per concern.

## 4. Audit procedure

Run this when asked for an audit, or before a large UI change.

1. **Tokens.** `grep -c` raw hex in `src/index.css` and `*.tsx`. Every literal that equals a token uses the token. Count remaining one-off tints (DESIGN.md §15 item 6).
2. **Type scale.** Search `font-size` and `text-[` values. Only `--type-*` steps are allowed.
3. **Radius.** Only `--radius-sm`, `--radius-md`, `--radius-pill`. Search `border-radius` values.
4. **Controls.** Count raw `<button` in `src/**/*.tsx`. Each one needs a reason to stay raw (DESIGN.md §7).
5. **`!important`.** Only in the reduced-motion block.
6. **Accessibility.** Icon-only controls have `aria-label` and a tooltip. Selection uses `aria-*` state. Check `:hover` rules are wrapped in `(hover: hover) and (pointer: fine)` for new code.
7. **Honest data.** Every rating, price, status, and review is either sourced or labeled. Grep for `demoRatingFor`, «Демо», «Оцінка», «Незабаром».
8. **Layout.** Check 375px and 1440px for horizontal scroll.
9. **Both themes.** Check `:root[data-theme="dark"]` values exist for every new token.
10. **Checks.** `npx tsc --noEmit` and `npm run test:fixtures`.

Write findings into `docs/` as a dated audit file, with counts before and after, and tick items in DESIGN.md §15.

## 5. Change rules

- If a value is missing from `DESIGN.md`, propose it and update `DESIGN.md` in the same change.
- Do not add a one-off style. Change the token or the primitive.
- Do not invent ratings, reviews, hours, or prices.
- Open decisions D1–D5 in `DESIGN.md` §14 need the owner. Ask before acting on them.

## Related

- `DESIGN.md`: tokens, type, spacing, motion, components, checklist (§11).
- `CLAUDE.md`: project rules and check commands.
- `docs/super-app-ia.md`: information architecture.
