# next — Design System

Status: v5, updated 2026-10-24 after the UI/UX revamp and the map-style search cards (D1, D3, D4, D5 decided). This file is the source of truth for UI work.
Scope: the web app. The cross-platform library (shared tokens in `design/tokens.json`, the iOS and Android rules, mobile navigation and screens) lives in `design/` and is shown live at `/design`. Shared color values must match `design/tokens.json`; `npm run design:tokens` checks them.
If code and this file disagree, either fix the code or change this file in the same change. Do not add a one-off style that this file does not describe.

## 1. Principles

1. **Map first.** The live city map stays dominant. Panels are compact and sit beside or above it.
2. **One visual language.** One token set, one icon font, one radius scale, one motion curve. Reuse before inventing.
3. **Accessible by default.** WCAG 2.2 AA contrast, keyboard operation, visible focus, reduced motion respected.
4. **Honest data.** Estimates are labeled as such. Production shows no demo content: sample listings, demo service flows and the scraper are behind build-time flags in `src/lib/features.ts` (§13). A rating is shown only when a source exists. Never present a sample rating, review, price, or live status as real.

## 2. Color tokens

All tokens live in one `:root` block in `src/index.css`, plus the dark value blocks in §2b. Do not add other `:root` blocks or redefine a token elsewhere.

| Role | Token | Value | Notes |
|---|---|---|---|
| Page background | `--background` | `#f8faf9` | |
| Main text | `--foreground` | `#18251f` | |
| Card / popover | `--card` | `#ffffff` | |
| Muted surface | `--surface-muted` | `#f1f4f2` | Surface only. Never use `--muted` for text. |
| Secondary text | `--muted-foreground` | `#5f6e66` | Text only. 5.1:1 on `--background`, 4.9:1 on `--surface-muted`. |
| Border / input | `--border` | `#dce5df` | |
| Primary action | `--primary` | `#087a50` | White text is 5.4:1 (D1, decided). |
| Primary hover | `--primary-hover` | `#066a45` | Hover/pressed fill for primary buttons. |
| Primary border | `--primary-border` | `#a9d3bf` | Hover border on chips and selected outlines. |
| On primary | `--primary-foreground` | `#ffffff` | |
| Primary tint | `--accent` | `#e5f2eb` | Selected chip and tinted icon backgrounds. |
| Text on tint | `--accent-foreground` | `#075c3d` | |
| Focus ring | `--ring` | `#11835b` | Always visible on keyboard focus. |
| Destructive | `--destructive` | `#b42318` | |
| Scrim | `--scrim` | `rgba(13, 24, 19, 0.48)` | Behind modals and around the tour spotlight. |
| Tram (route) | `--fleet-tram` | `#f97316` | Route color only. Matches the vehicle color in code. |
| Trolleybus (route) | `--fleet-trolleybus` | `#3b82f6` | Route color only. Matches the vehicle color in code. |
| Bus (route) | `--fleet-bus` | `#22c55e` | Route color only. |
| Taxi (route) | `--fleet-taxi` | `#eab308` | Route color only. |

Rules:
- Use token names in CSS and Tailwind (`bg-primary`, `text-muted-foreground`). Raw hex is allowed only inside this table and in §2a.
- Legacy aliases (`--ink`, `--paper`, `--line`, `--green`, `--brand-primary*`) point at these tokens. Do not use them in new code.
- Element defaults (`button`, `:focus-visible`) live in `@layer base` so Tailwind utilities on primitives can override them. Component CSS stays unlayered.
- Never communicate state by color alone. Pair color with an icon, label, or `aria-pressed`/`aria-selected`.
- Dark theme (D4, decided): see §2b. Light, dark, or follow the system. Add no ad-hoc dark styles: change the dark values in the dark blocks of `src/index.css` (and keep §2b in sync).

### 2a. Accent and map tokens

Defined in the same `:root` block in `src/index.css` (the "Accents" section). Use `var(--token)` in DOM styles. Canvas, MapLibre paint, and 3D code call `resolveColor("var(--token)")` from `src/lib/design-colors.ts`, because those APIs cannot read CSS variables. Category accents are per place type; the place type maps to its token in `src/lib/city-places.ts`.

**Map**

| Token | Value |
|---|---|
| `--map-background` | `#f6f7f6` |
| `--map-landuse` | `#f4f5f4` |
| `--map-wood` | `#dcebd8` |
| `--map-grass` | `#edf2ec` |
| `--map-water` | `#e8eff0` |
| `--map-casing` | `#d5d9d7` |
| `--map-surface` | `#fbfcfb` |
| `--map-outline` | `#e3e6e4` |
| `--map-hillshade-shadow` | `#52634e` |
| `--map-hillshade-highlight` | `#fffdf2` |
| `--map-hillshade-accent` | `#82907a` |
| `--map-route` | `#1688ef` |
| `--map-label` | `#334155` |
| `--map-label-strong` | `#20362a` |
| `--map-marker-alert` | `#dc2626` |
| `--map-marker-teal` | `#0f766e` |
| `--map-marker-muted` | `#94a3b8` |
| `--map-label-alert` | `#991b1b` |

**Brand**

| Token | Value |
|---|---|
| `--brand-blue` | `#0874df` |

**Route and transport**

| Token | Value |
|---|---|
| `--fleet-bus` | `#22c55e` |
| `--fleet-tram` | `#f97316` |
| `--fleet-trolleybus` | `#3b82f6` |
| `--fleet-taxi` | `#eab308` |

**Transport**

| Token | Value |
|---|---|
| `--transport-nearby` | `#1caa63` |
| `--transport-bus` | `#d89418` |
| `--transport-tram` | `#247bad` |
| `--transport-trolleybus` | `#0284c7` |
| `--transport-taxi` | `#bd5681` |

**Events**

| Token | Value |
|---|---|
| `--event-all` | `#176443` |
| `--event-family` | `#d89418` |
| `--event-kids` | `#d76543` |
| `--event-meeting` | `#9257a5` |

**Jobs**

| Token | Value |
|---|---|
| `--job-technology` | `#247bad` |
| `--job-hospitality` | `#d76543` |
| `--job-retail` | `#d89418` |

**Category accents (place types)**

| Token | Value |
|---|---|
| `--category-groceries` | `#d89418` |
| `--category-food` | `#16804f` |
| `--category-health` | `#c64757` |
| `--category-pets` | `#a855f7` |
| `--category-education` | `#6473bf` |
| `--category-parks` | `#208756` |
| `--category-sports` | `#2563eb` |
| `--category-culture` | `#9257a5` |
| `--category-tourism` | `#0891b2` |
| `--category-transport` | `#247bad` |
| `--category-finance` | `#15803d` |
| `--category-public` | `#475569` |
| `--category-religion` | `#7c3aed` |
| `--category-shopping` | `#db2777` |
| `--category-nightlife` | `#be185d` |
| `--category-services` | `#60776b` |
| `--category-jobs` | `#176f68` |
| `--category-beauty` | `#bd5681` |
| `--category-real-estate` | `#7257a5` |
| `--category-stay` | `#5476a5` |
| `--category-buildings` | `#675984` |
| `--category-other` | `#64746b` |
| `--category-market` | `#e8794c` |
| `--category-parking` | `#6b7280` |
| `--category-fuel` | `#dc2626` |
| `--category-charging-station` | `#059669` |
| `--category-recycling` | `#16a34a` |
| `--category-pharmacy` | `#0891b2` |
| `--category-atm` | `#7c3aed` |
| `--category-post-office` | `#c2410c` |
| `--category-library` | `#4f46e5` |
| `--category-car-wash` | `#0891b2` |
| `--category-car-repair` | `#ea580c` |
| `--category-tire-service` | `#ca8a04` |
| `--category-construction` | `#78716c` |
| `--category-hardware` | `#b45309` |
| `--category-flowers` | `#ec4899` |
| `--category-veterinary` | `#059669` |
| `--category-pet-shop` | `#7c3aed` |
| `--category-laundry` | `#0ea5e9` |
| `--category-dry-cleaning` | `#6366f1` |
| `--category-optician` | `#64748b` |
| `--category-dentist` | `#0891b2` |
| `--category-fitness` | `#7c3aed` |
| `--category-yoga` | `#d946ef` |
| `--category-dance` | `#f43f5e` |
| `--category-music-school` | `#a855f7` |
| `--category-art-studio` | `#ec4899` |
| `--category-playground` | `#16a34a` |
| `--category-bicycle-rental` | `#0891b2` |
| `--category-scooter-rental` | `#6366f1` |
| `--category-car-rental` | `#dc2626` |
| `--category-internet-cafe` | `#4f46e5` |
| `--category-copy-center` | `#6b7280` |
| `--category-print-shop` | `#78716c` |
| `--category-photo-studio` | `#0891b2` |
| `--category-shoe-repair` | `#b45309` |
| `--category-key-cutting` | `#78716c` |
| `--category-locksmith` | `#ca8a04` |
| `--category-waste-disposal` | `#6b7280` |
| `--category-water-fountain` | `#0ea5e9` |
| `--category-public-toilet` | `#6b7280` |
| `--category-bicycle-parking` | `#16a34a` |
| `--category-motorcycle-parking` | `#ca8a04` |
| `--category-bus-stop` | `#247bad` |
| `--category-tram-stop` | `#7c3aed` |
| `--category-taxi-stand` | `#fbbf24` |
| `--category-car-sharing` | `#6366f1` |
| `--category-popular` | `#ee8a3f` |
| `--category-nearby` | `#16804f` |

**Other**

| Token | Value |
|---|---|
| `--building-default` | `#d6d2c8` |

**Illustration (vehicle artwork and LED sign)**

Vehicle artwork uses these through CSS classes in `transit-vehicle-artwork.css`. The LED sign uses `resolveColor()`. The route color is set inline on the vehicle body.

| Token | Value |
|---|---|
| `--art-white` | `#ffffff` |
| `--art-shadow` | `#17271f` |
| `--art-pole` | `#2b343a` |
| `--art-pole-wire` | `#8a97a0` |
| `--art-glass` | `#18394a` |
| `--art-trim` | `#26323a` |
| `--art-door` | `#cfe6ee` |
| `--art-door-seam` | `#8fb3c0` |
| `--art-joint` | `#1f2a32` |
| `--art-joint-seam` | `#3a4852` |
| `--art-sign-text` | `#203247` |
| `--art-headlight` | `#fff4ae` |
| `--art-tail` | `#d64b43` |
| `--art-wheel` | `#273039` |
| `--art-hub` | `#cad1d3` |
| `--led-off` | `#07070a` |
| `--led-on` | `#ff9d1c` |
| `--led-dim` | `#1b1109` |

### 2b. Dark theme (D4)

- The user chooses **Системна**, **Світла**, or **Темна** in Налаштування → Вигляд. The choice is stored on the device as `eway-theme`.
- `index.html` applies a saved light or dark choice before first paint. Without a choice, the system preference applies.
- The choice sets `data-theme` on `<html>`. `:root[data-theme="dark"]` holds the dark values. `@media (prefers-color-scheme: dark)` with `:root:not([data-theme="light"])` covers "follow the system".
- The dark values are in `src/index.css`, after the `:root` block. They're generated from one list, so both rules always match.
- Dark tokens: the surface and text colors from §2, the map palette (`--map-*`, `--brand-blue`, `--card`), and shadows. Accent colors (categories, fleet, transport, events, jobs) and illustration colors keep their values.
- Contrast, checked in dark: `--foreground` on `--background` 15.5:1; `--primary-foreground` on `--primary` 7.4:1; `--muted-foreground` on `--background` 8.2:1 and on `--surface-muted` 6.7:1; `--destructive` text on `--background` 6.6:1.
- The map follows the theme. `src/lib/map-theme.ts` swaps each palette color on the existing layers when the theme changes. Category pins keep their colors.
- Limit: map icons drawn at load (the category pin images) keep their load-time colors until reload. Their accents don't change between themes, so this doesn't show.

### 2c. Component tones (generated)

- `src/index.css` had 508 distinct literal colors in component rules. Each one is now `var(--tone-<hex>)`. The light value is the original color. The dark value is generated: lightness inverted, hue kept, saturation reduced to 85%, lightness held between 7% and 95%. The definitions sit in the `:root` block and in both dark blocks.
- Status: about 300 tones are still in use, and unused tones are removed. See §2d for roles.
- These tones are a stopgap. The target is a few named semantic tokens (text, surface, border, accent, state) shared by the components. Replace tones with semantic tokens when a component is touched.
- Do not add new literal colors to component rules. Add a token in §2 or §2a, or reuse a semantic one.

### 2d. Semantic roles

Use these instead of a component tone. A role maps a color to its meaning. Light and dark values are in `src/index.css`.

| Role | Light | Dark |
|---|---|---|
| `--text-strong` | `#20362a` | `#e6efe9` |
| `--text-default` | `#52645a` | `#b8c8bf` |
| `--text-muted` | `#68766d` | `#9fb3a7` |
| `--text-accent` | `#176544` | `#7fd9ae` |
| `--text-on-accent` | `#ffffff` | `#04150d` |
| `--text-danger` | `#8f241d` | `#fca5a5` |
| `--surface-subtle` | `#f7faf7` | `#1d2a24` |
| `--surface-accent` | `#eff7f2` | `#1e3a2e` |
| `--surface-info` | `#e8f3ff` | `#1e2d3d` |
| `--surface-danger` | `#fbeeec` | `#3a1f1c` |
| `--border-info` | `#b9d8f7` | `#27405c` |
| `--border-danger` | `#e8c1b9` | `#4a2a25` |
| `--text-info` | `#26698c` | `#8cc8e8` |
| `--text-success` | `#087a43` | `#5fd39a` |
| `--text-warning` | `#855807` | `#f0c060` |
| `--surface-success` | `#e8f8ef` | `#173a28` |
| `--surface-warning` | `#fff4d9` | `#3a2f14` |
| `--border-success` | `#d4e2d8` | `#2c4a3a` |
| `--border-warning` | `#ead9b3` | `#5a4a22` |

- A tone becomes a role only when the shift is ΔE 4 or less, which a person can't see. Larger shifts keep the tone until a role fits.
- The remaining tones are listed by usage in §2c. Add a role for a color family before adding a tone.

### 2e. Liquid glass (proposed 2026-11-01)

- Glass is for chrome that floats over content: the top bar, the tab bar, map markers and map controls, and a sheet's header. It is not for reading surfaces. Lists, forms and long text sit on opaque `--card` or `--background`.
- Tokens: `--glass-fill` (72% of the surface color), `--glass-stroke` (the edge highlight), `--glass-shadow` (raised shadow with an inner top highlight), `--glass-blur` (blur and saturation). Dark values are in both dark blocks.
- Web: `src/components/ui/glass.tsx` (`Glass`, `variant="regular" | "clear" | "tinted"`). It uses `backdrop-filter` only inside `@supports`. Without support, or with `prefers-reduced-transparency`, the fill is opaque.
- Mobile iOS 26+: `GlassView` from `expo-glass-effect` (`mobile/src/ui/glass.tsx`). Older iOS and Android get the opaque fallback. Android has no liquid glass, so it always uses the fallback.
- Never stack glass on glass. A glass control on a glass bar sits on an opaque or tinted element instead.
- Text on glass needs 4.5:1 against the fill. Check it over the lightest and darkest map tile that can sit behind the element.
- Motion: glass press and selection use the §8 curve. Reduced motion removes the transition, not the color change.

### 2f. Settings icon tiles (proposed 2026-11-01)

- Each settings row icon sits on a 28px square on web (36px on mobile until the Expo app follows) with a top-to-bottom gradient (the top color, then a slightly darker one of the same hue). The glyph is `--tile-glyph` (white).
- The color is chosen by a stable hash of the row's key (`src/lib/icon-tiles.ts`, `mobile/src/lib/icon-tiles.ts`), so each row has its own color and the list does not change between renders. Only the nine tile colors below are used. Do not use the brand green for every row.
- Web: `ListRow tile="…"` in `src/components/ui/detail-layout.tsx`. Mobile: `ListRow` and `SwitchRow` with `iconTile`, drawn with `expo-linear-gradient`. Both use the same values from `design/tokens.json` (`iconTiles`), checked by `npm run design:tokens`.
- Tiles keep their colors in dark mode (accent rule, §2b). The white glyph has at least 3:1 contrast on each tile.

| Tile | Top | Bottom |
|---|---|---|
| blue | `#2563eb` | `#1e40af` |
| orange | `#ea580c` | `#9a3412` |
| violet | `#7c3aed` | `#5b21b6` |
| pink | `#db2777` | `#9d174d` |
| teal | `#0d9488` | `#115e59` |
| amber | `#d97706` | `#92400e` |
| rose | `#e11d48` | `#9f1239` |
| indigo | `#4f46e5` | `#3730a3` |
| green | `#16a34a` | `#166534` |

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

- Tokens: `--type-caption`, `--type-small`, `--type-body`, `--type-title`, `--type-inspector`, `--type-display`, and `--type-hero` (`clamp(2.5rem, 7vw, 3.5rem)`, landing page headlines only: the hero and the closing action; proposed 2026-10-24, the one size above Display). Tailwind `text-xs/sm/base/lg/2xl/3xl` map to the same steps.
- Exception: text inputs use `--type-input` (16px) so iOS Safari does not zoom on focus.

- Headings: letter-spacing `-0.02em` to `-0.04em` at 22px and up. Body text uses default tracking.
- Do not add a new font size outside this scale.
- **Appearance presets (Вигляд, Settings → Вигляд; `src/lib/appearance.ts`, `src/lib/appearance.css`).** Text size S / M / L overrides the scale's values, with the same steps: caption 11/12/13, small 13/14/15, body 14/15/16, title 16/17/18, inspector 20/22/24, display 26/28/30. Input stays 16px. UI font is one of five Cyrillic sans-serif faces: Manrope (default), Inter, Golos Text, Onest, PT Sans. Serif faces are not offered. The choice sets `--font-sans`.

## 4. Spacing, radius, elevation

- Spacing: 4px grid. Use 4, 8, 12, 16, 24, 32. No odd values such as 5, 7, 11, 15.
- Radius (three values only, D3 decided):
  - `--radius-sm` 6px: small controls (icon buttons inside a panel)
  - `--radius-md` 8px: surfaces: cards, panels, inspectors, modals
  - `--radius-pill` 999px: chips, pills, toggles
  - Landing page only (proposed 2026-10-24, `src/landing/landing.css`): `--landing-radius` 24px for large containers (cards, stage, closing block) and `--landing-radius-inner` 16px for tiles inside them. These are scoped to `.landing` and do not apply to the app.
  - Map artwork (vehicle sprites, pins, markers) keeps its own shapes and is exempt. So does the device frame on `/design` (2026-11-01), which is an illustration of a phone.
  - The mobile app uses platform radii from `design/tokens.json` (iOS control 10, card 14, sheet 20; Android control 20, card 12, sheet 28), documented in `design/foundations.md` (proposed 2026-11-01).
- Bottom sheets (mobile) round only their top corners, at 8px.
- Shadows: two tokens only: `--shadow-raised` for floating map controls and tooltips, `--shadow-overlay` for modals, inspectors, and sheets.
- Stable control sizes: 36px minimum for controls, 44px minimum touch target on mobile.
- Density (Вигляд): Компактна or Просторна. Compact sets row padding to 4px and section padding to 10px; comfortable keeps 8px and 16px (`--density-row`, `--density-section`).

## 5. Layout

- **Routes:** `/` is the landing page (`src/landing/`): a sticky nav, a hero with the primary action «Відкрити мапу», three feature blocks with their data limits and a closing action. Every action links to `/app`. `/app` (and `/dev`, which keeps the developer tools) renders the app. `/design` is the design library (web, iOS and Android; `/design-system` is an alias). `index.html` and `manifest.webmanifest` (`start_url`) point at `/app` for installed use.
- **Desktop:** planning rail on the left, map overlays next to the rail, one contextual inspector on the right.
- **Mobile (≤ 800px):** the rail is a draggable bottom sheet with three detents: peek (100px: the handle and the tab row only, so the sheet minimises to the tab bar), half (55% of the viewport), full. Drag the handle, tap it, or use Enter / Arrow Up / Arrow Down. The open inspector uses the full-height card. The expanded (full) detent covers the whole screen, so no map shows behind the sheet. The header pills stay visible above it, and the sheet's top content starts 64px below the safe area. Map controls dock top-right below the safe area, so no sheet detent covers them; alerts stay above the sheet with safe-area spacing.
- **Rail header:** one row: wordmark, city picker (with «Beta»), spacer, profile. There is no search and no services hub.
- **Mobile header pills (≤ 800px):** the same wordmark, city picker, and profile float over the map as pills (`.brand-header-floating`), 12px below the safe area. Only the pills take taps, so map drags pass through the gaps. The map control column docks below them. The bottom sheet holds only the section tabs and content.
- Test every UI change at **375px wide** with no horizontal page scroll, and at 1440px.
- On short screens, compress the planner before hiding route results.

## 6. Icons

- One icon family: **Material Symbols Rounded**, rendered only through `MaterialIcon` (`src/components/ui/material-icon.tsx`).
- Default is filled off, weight 400. Use filled (`FILL 1`) only for the selected/active state of a single icon. Exception: the icon on a settings tile (§2f) is always filled, because the tile is the active surface.
- Category orb icons (`CategoryTiles`) use weight 300, filled or not. The font loads the 200–700 range for this.
- `MaterialIcon` takes `filled` for the active state. Icons inside a control with `aria-pressed`, `aria-selected`, or `aria-current="page"` fill automatically. Only the Rounded font is loaded.
- Map pins (category places) draw the outlined glyph. The selected pin draws the filled glyph from a pinned FILL 1 copy of the font (`src/lib/material-symbols-filled.ts`, canvas cannot set the FILL axis). Pins have no light halo behind the glyph.
- Do not add a second icon library. If a needed glyph is missing, add a semantic wrapper in `material-icon.tsx`.
- Icon-only actions require an accessible name (`aria-label`) and a tooltip.

## 7. Components

- Build controls from `src/components/ui/` primitives, which are shadcn components: `Button`, `Badge`, `Card`, `Dialog`, `Sheet`, `Tabs`, `Input`, `Label`, `Select`, `Slider`, `Switch`, `Toggle` (variant `pill` for filter pills), `ToggleGroup`, `Tooltip`, `Separator`, `Skeleton`. Composites built on them: `IconButton`, `UnifiedCard`, `ContextCard` (`src/components/ui/context-card.tsx`), `detail-layout` (including `QuickFacts`), and `CategoryTiles` (`src/components/category-tiles.tsx`). Every primitive and composite is shown in its states at /design (`src/design-system/`), Web tab. Check it before adding a control. Do not add a custom primitive that shadcn already provides.
- **Sign-in** (Профіль → Обліковий запис, `src/features/settings/account-view.tsx`): provider buttons first, as full-width outline `Button`s labelled «Продовжити з Telegram» / «Продовжити з Google» with an 18px provider logo in `currentColor` (no brand hex). A divider «або поштою», then `Tabs` «Вхід» / «Реєстрація», then the email form. «Забули пароль?» and «Увійти без пароля» are `link` buttons under the form. Errors sit under the fields with `role="alert"`. Confirmation screens («Перевірте пошту») reuse the account message layout.
- **Notification topics** (Профіль → Сповіщення): one `Switch` per topic in a `ListRow`, shown only after the device switch is on. Offer only topics the server really sends.
- `Button` gives press feedback on pointer-down (`scale 0.97`, 120ms); reduced motion keeps only the color change.
- `IconButton` requires `label`, which becomes `aria-label` and the tooltip. On touch screens its hit area grows to 44px without changing the 36px visual size.
- Do not add raw `<button>` controls with bespoke classes when a primitive fits. Existing raw buttons are migration debt (see the audit backlog).
- **Chips** (filter pills) are shadcn `Toggle` with `variant="pill"`. `Chip` was removed on 2026-10-24. Required states: default, hover, pressed/selected, focus-visible, disabled. Selection uses `aria-pressed` or `role="tab"` with `aria-selected`, never color alone.
- **Category filters** in every section use `CategoryTiles` (`src/components/category-tiles.tsx`, built on shadcn `ToggleGroup`): one horizontally scrolling row of 56px colored orbs, each with a label below. The category color fills the orb; the icon is white and filled when selected. The selected orb has a `--primary-border` ring and a 1.04 scale, and its label uses `--accent-foreground`. Orbs and labels are `<button aria-pressed>`. The selected orb scrolls into view. Filters that are not category rows (for example a single toggle) use `Toggle` with `variant="pill"`. No «Усі категорії» toggle.
- **Category palette:** orb fills come from `CITY_PLACE_CATEGORY_COLORS` (`src/lib/city-places.ts`) and the filter lists in `city-guide.tsx`. Those hex values are the only permitted category colors. Do not pick a new one inline.
- **List items** use `UnifiedCard` (built on shadcn `Card`): header (icon or date badge, sentence-case category, title, one-line subtitle), optional meta rows, then one row of pill actions. A card that opens a detail does it through its title button, which stretches over the card, so it works with the keyboard and never nests buttons.
- **Selected place (detail page)** for every entity (place, school, service, job, home, event) uses `EntityDetail` (`src/components/entity-detail.tsx`). Order, top to bottom: the photo hero, title and category with distance, rating line, action bar, inline flow, then «Інформація» as quick facts, then «Опис», then scraped details. The hero is 16:9 at `radius-md`, capped at 240px tall. «Інформація» is `QuickFacts` (`src/components/ui/detail-layout.tsx`): label and value rows, each row at least 44px, the label in `muted-foreground`, the value on the right. A row is a link only when it has a real target (phone, site, email). «Інформація» has no source links. The hero shows the place photo (`imageUrl` from OSM `image` or `wikimedia_commons`, or the scraper lookup) or a tinted panel with the category icon. Share and save are icon buttons on the hero. Events keep their date badge and have no hero. Shown in /design with a QuickFacts specimen.
- **Search results** (place list in the city guide, list layout) use `ContextCard`, the map-app style card (Apple Maps and Google Maps references). A row: a 72px thumbnail (photo, neutral tile while the lookup is pending, or an empty `image` tile), the category, the title button (stretched over the row), one subtitle line, and the scraper rating only when one exists. Below the row, at most two pill actions: «Маршрут» (filled) and «На мапі» (outline). The action row sits outside the stretch. The grid layout keeps `UnifiedCard` with its 4:3 photo. Shown in every state at /design.
- **Landing CTAs** (`src/landing/landing.css`, `.landing-btn`): pill buttons with a 4px solid bottom edge in `--primary-hover`, which pressed-in on pointer down. This replaces the default shadow on the landing page only. The app keeps the shadow buttons.
- **Cards** use `UnifiedCard`: a 72px photo thumbnail when `imageUrl` exists (otherwise the icon tile), the category, the title, the subtitle, and a rating line only when a sourced rating exists. Place cards pass `place` to the header: the photo is looked up once the card nears the viewport (OSM photo first, then the scraper lookup). While that is pending the thumbnail is a neutral `surface-muted` tile with no icon. When no photo exists it stays as an empty tile with an `image` icon in `muted-foreground`, the same as a list card without a photo on Google Maps. Only places, schools, and services show ratings. Jobs, homes, and events do not.
- **Ratings:** the rating line is `Star` + value + count (`formatRating` in `src/lib/rating.ts`). It shows only for a place with a sourced rating; otherwise there is no line. No sample ratings exist. The action bar holds at most four actions: the kind's flows (`flowsForKind`), «Маршрут», then «Дзвінок» or «На мапі». The first flow is the filled primary; with no flow, «Маршрут» is primary.

  | Kind | Flows (primary first) |
  |---|---|
  | food | Замовити (menu and cart), Столик |
  | groceries, flowers, pharmacy | Замовити |
  | stay | Номер |
  | health, beauty, veterinary, car services, services | Записатися |
  | culture, tourism, sports, event | Квитки |
  | job | Відгукнутися |
  | home | Перегляд |
  | library, education | Каталог |

  No flow is connected to a provider yet. Flows exist only when `SERVICES_ENABLED` is on (development, or `VITE_FEATURE_SERVICES=1`); they load as a lazy chunk (`entity-flows.tsx`), so production builds do not ship them. Each flow carries a «Демо» chip, and its confirmation says nothing was sent.
- **Order page** («Замовити» on food and groceries): a full-screen page (`src/components/order-page.tsx`, `order-page.css`) that covers the rail and the map at z-index 1100, above the brand rail (z-index 1000). Header: back icon button labeled «Назад», the place name, the title «Замовлення», and a «Демо» chip. Sections in order: «Страви» (steppers, each with an `aria-label`), «Отримання» (delivery or pickup, with address and entrance when delivering), «Контакти» (name, phone, and a «Передзвонити для підтвердження» switch), «Коментар», and «Оплата» (cash, card online, card to the courier). Errors are text in `role="alert"`, shown after submit. The footer shows the count and total, and the submit button is disabled while the cart is empty. Nothing is sent: the confirmation says so.
- **Reviews** (`place-details-section.tsx`): each review is a card with an initial avatar (`aria-hidden`), author, time, a star rating, and text. Text longer than 180 characters is cut with a «Читати повністю» button that sets `aria-expanded`. Reviews come from the scraper listing and are shown without a source label. Reviews come only from a verified listing; none are invented.
- «Маршрут» pins the destination, fills the map planner's last point, and lowers the mobile sheet to half.
- Saved items are kept on the device (`src/lib/use-saved-items.ts`).
- **Profile and settings** (`src/features/settings/`): profile card, account (sign-in labeled «Незабаром»), city, permissions with live status, replay onboarding, and clearing device data with a confirmation. Desktop side panel; full-height sheet on mobile. The profile (name, role, home, work) is stored on the device only.
- **City tabs (`src/components/city-guide.tsx`, `CITY_TABS`).** Four fixed tabs, the same on web and mobile (design/navigation.md): Транспорт, Місця, Послуги, Більше. Each tab is a `button` with an icon and label; the active tab has `aria-current="page"`. The tab row is one grid (`repeat(4, minmax(0, 1fr))`) and never scrolls. Favourites, hiding and reordering are removed.
- **Більше (`src/components/city-guide/more-list.tsx`).** One list of the city sections without a tab, in this order: Освіта, Афіша, Робота, Нерухомість, Ринок, Парковка, АЗС, Електрозарядка. A row opens its section; a «Більше» back link above the section returns to the list. Tapping the Більше tab shows the list.
- **Section tabs, active item**: the active tab gets the `--accent` tint and an inset `--primary` underline, so the selected tab is clear without relying on the green text alone.
- **Places tabs** (`src/components/city-guide/places-section.css`): one row of tabs above the places. «Поруч» (only with a location), «Мої місця», «Популярне» | «Категорії» | a settings icon («Налаштування категорій»). The active tab is filled with `--primary` and white text (`aria-pressed`). «Категорії» shows every category at once in a full-width grid under its group heading; a tap opens that category's list with a back button. The settings dialog turns categories on or off for that grid (`eway-category-prefs`). «Мої місця» holds saved places, lists the user makes (`eway-my-places`), and private marks. Public marks and shared lists are not built yet: they need the server and admin review.
- **Places view switch** (`src/components/city-view-switch.css`, `docs/super-app-ia.md` §3): a two-segment control above the places list: «Список» and «Сітка» (shadcn `ToggleGroup`, full width, pill track). The selected segment is filled with `--primary` and white text, so it reads as the active tab. Unselected segments are muted. The list has no section title above it: the selected category already names it, and only the «Знайдено» count stays. There is no map segment; the map is the sheet's peek and the map itself. Grid cards flow in `minmax(160px, 1fr)` columns with a 4:3 photo on top. The list or grid choice is stored on the device as `eway-places-layout`.
- Map actions use `Button` with `variant="ghost"` and the `map-control` class, each individually labeled. The column docks bottom-right on desktop and top-right on mobile. Buttons are 36px on desktop and 40px on mobile. Top to bottom (Apple Maps order):
  - **Map type** (`map-style-btn`, icon of the current type): opens a popover with three tiles, «Стандартна», «Гібридна», «Супутник». The selected tile has the primary border and `aria-pressed`. The imagery tiles show a real imagery preview of the city center, one Esri tile. Hybrid is imagery with roads and labels. Satellite is imagery only. Imagery is a raster layer under the base map (`src/lib/map-style-mode.ts`), and the app layers stay on top. Imagery is Esri World Imagery and its attribution shows on the map.
  - **My location** (`map-locate-btn`, icon `my_location`). Same group as map type.
  - **Compass** (`map-compass`): a round control outside the groups, like Apple Maps. A red north needle turns with the map bearing. Click resets the bearing to north. It is always visible.
  - **Camera** (`map-camera-btn`, icon `360`, Material Symbols Rounded): opens a panel. The header has a «3D» switch (`map-camera-3d`), which turns 3D on or off. Below it is the orbit pad (`map-camera-pad`): each arrow has a visible label beside it. Up «Нахил до горизонту» and down «Вид зверху» tilt the view by 10°. Left «Повернути ліворуч» and right «Повернути праворуч» turn it by 15°. The center dot is a drag handle: horizontal drag turns, vertical drag tilts. The panel closes on an outside click or Escape. It is available on all sizes. On mobile, opening it drops the rail sheet to peek, because the sheet would otherwise cover the panel.
  - **Zoom**: plus and minus icons. Desktop only. Mobile hides the zoom pair because pinch covers it.
  - **Layers** (`map-settings-btn`): «Що показувати». A left sidebar on desktop and a bottom sheet on mobile (`src/components/map-panel.tsx`, `map-layers-panel.tsx`). Transport switches first (vehicles, stops), then one row per place group. The group switch shows or hides all its categories; the chevron opens the categories for one-by-one pills. «Показати все» and «Сховати все» act on every category. Everything is shown by default. Stored on the device (`src/lib/map-layers.ts`). The map clusters each group separately, so one bubble never mixes groups; cluster bubbles take their group's first category color. Shelters stay under the air-alert rule, not the switches.
  - **Mobile popovers** (map type, camera) open as the same bottom sheet on screens up to 800px. Tooltips are native titles and do not open on touch.
  - Tooltips name the action in full. Shift+arrows rotate and tilt through the MapLibre keyboard handler.
- Vehicle and stop details open in the contextual inspector. Route selection highlights its GTFS geometry.
- Named buildings and places open dismissible detail inspectors. Show only attributes present in the source data.

## 8. Motion

- Library: `motion` (Motion for React). Presets live in `src/lib/motion.ts`. The app root sets `<MotionConfig reducedMotion="user">`.
- Use springs for anything the user can touch or interrupt. They start from the on-screen value and keep velocity when re-targeted.
  - `spring.default`: `bounce 0`, `visualDuration 0.32`. Enter, move, panels.
  - `spring.state`: `bounce 0`, `visualDuration 0.2`. Selection, progress.
  - `spring.momentum`: `bounce 0.18`, `visualDuration 0.3`. Only after a drag or flick that carried momentum.
- Gestures: track 1:1 from the grab point, rubber-band past bounds (`rubberband()`), and choose the resting point from projected momentum (`projectMomentum()`, deceleration 0.998). Then settle with a spring that starts at the release velocity.
- Exits use ease-in (`exitTransition`, 200ms) and leave the way they came in.
- Modals (services hub, profile and settings) share one open motion: a scrim fade (`scrimMotion`) and a panel that slides in from the edge it is docked to, the right on desktop and the bottom on mobile (`panelMotion(mobile)`, `src/lib/motion.ts`). Do not write per-dialog motion props.
- CSS transitions remain fine for hover and color. Token values: `--ease`, `--ease-in`, `--duration-press`, `--duration-state`, `--duration-panel`.
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

- Code: `src/features/onboarding/` (dialogs, steps, storage keys, CSS).
- Three phases: welcome (centered dialog), optional profile questions, spotlight tour (4 steps, anchored to live UI via `data-tour` attributes).
- Welcome (D5, decided): the wordmark is the title, with «Місто ближче» below it. Three feature pill `Toggle`s (Транспорт, Місця, Події) each show a short, honest description. Events say they come later («Незабаром») until a source exists.
- The spotlight is a spring-driven SVG cutout that glides between targets. On screens ≤ 800px the tour card docks to the bottom.
- Dialogs trap focus, close on Escape, and return focus to the element that opened them (`src/lib/use-dialog-focus.ts`).
- Every tour step's `data-tour` target must exist in the rendered UI. A missing target silently drops the spotlight. Check this when changing either side.
- The profile step is optional. Skipping never blocks the app.
- Location and notification permissions are requested only after the user asks for them. Do not imply notification delivery until the data source is connected.
- The benefits dialog (after onboarding) lists each permission as a `Switch`, off by default. «Зберегти» appears only once a switch is on; it runs the browser prompts for the switched-on permissions and closes the dialog. «Не зараз» closes without asking.
- Replay is available from the `/dev` tools.
- If a step's target is missing at runtime, the card stays centered without a spotlight instead of breaking.

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
- **Vehicles on the map** (`src/lib/vehicle-3d-layer.ts`): one set of instanced meshes per vehicle type (body, trim, LED). Route numbers come from a shared LED atlas, so each route does not need its own model. Only vehicles in the padded viewport are packed into instances. Route labels are MapLibre layers (`wayme-vehicles-badge`, `wayme-vehicles-label`), not DOM. The only DOM vehicle element is the trip card of the selected vehicle. Do not add per-vehicle DOM back.

## 13. Data notes

- Arrival minutes are proximity estimates from live vehicle positions, not scheduled predictions.
- Route shapes and stops come from the transit feed. Place coverage depends on named map features in visible tiles.
- Education listings and map POIs may have incomplete names or details. Do not invent ratings or reviews.
- The Послуги section lists places from the city data in service categories (`SERVICE_CATEGORY_IDS` in `city-guide.tsx`); they are real places and carry no «Демо» label. Jobs, real estate and events have no source yet: development builds show labeled samples (`src/lib/dev-tools/sample-listings.ts`), production shows «Незабаром» in their place.
- The scraper lookup (`/api/place-images`: photo, rating, reviews) runs in development only (`PLACE_LOOKUP_ENABLED`, platform-plan D-B). Production shows OSM photos only and no ratings until a licensed source exists. The modelled ridership chart is development only too.
- Place photos come from OSM `image` or `wikimedia_commons` tags. When OSM has none, the place detail looks up a photo through `/api/place-images` and shows it in the shared `EntityDetail` hero. Missing or failing photos fall back to the category icon. Place detail pages do not name their data sources or link to them.
- Passenger counts and daily charts are labeled estimates. The live GPS feed has no passenger sensors.
- Vehicle inspectors show a generic illustrated model. The live feed does not identify manufacturer or model.

## 14. Open decisions

These need an owner's answer. Until then, follow the value in the middle column.

| ID | Question | Current state | Proposed |
|---|---|---|---|
| D1 | Primary color | **Decided 2026-10-21:** `#087a50`. | Done |
| D2 | Brand name | UI title and onboarding say «next». Storage keys say `un-`, one key says `eway-`. `package.json` says `eway-lviv-pro`. Docs were corrupted to «nextcom». | Pick one, then rename keys in one migration |
| D3 | Radius | **Decided 2026-10-21:** enforce 6 / 8 / 999. | Done |
| D4 | Dark mode | **Decided 2026-10-24:** Light, Dark, or System, default System. The map follows the theme. | Done (§2b) |
| D5 | Onboarding welcome/feature chips | **Decided 2026-10-21:** full redesign (logo title, interactive chips, spring motion). | Done |
| D10 | Category accents, route colors, and map paint are raw hex (about 160 values in `city-places.ts`, `App.tsx`, `city-guide.tsx`, `transit-vehicle-artwork.tsx`). | Done 2026-10-24: added as tokens (DESIGN.md §2a). Illustration colors: see D11. | Done |
| D11 | Illustration artwork keeps literal colors: transit vehicle SVG (`transit-vehicle-artwork.tsx`) and the LED pixel art (`vehicle-3d-layer.ts`). SVG attributes and canvas pixel art cannot read tokens. | Done: illustrations now use `--art-*` and `--led-*` tokens (§2a). | Done |

## 15. Audit backlog (2026-10-21)

Tracked gaps. Close each with a normal change and tick it here.

1. ✅ **Duplicate tokens.** Fixed: one `:root` block. `index.css` has 6 `:root` blocks. `--muted` means surface in one and text in another. `--primary` changes value between blocks. Merge into one block.
2. ✅ **Missing tour targets.** Fixed: `place-search` is on the header search, and missing targets fall back to a centered card. Onboarding step 2 targets `data-tour="place-search"`, which does not exist. Step 3 (`city-events`) only renders when the events section is mounted. Add the attributes or drop the steps.
3. ✅ **Duplicate CSS rules.** Fixed: 1,122 overridden declarations removed; reduced-motion rules merged into one block. `.transport-category` is defined in at least three places, and `.onboarding-feature-list` and `.city-section-nav` are repeated. Keep the last intended one and delete the rest.
4. ◐ **Raw buttons and shadcn migration (2026-10-24).** Chips became shadcn Toggle pills; CategoryChips became CategoryTiles on ToggleGroup; UnifiedCard and detail-layout are built on shadcn Card, Button, and Badge; FilterBar was removed as unused. Font sizes snapped to the §3 scale. Remaining: visual check in the browser, and the raw hex values in D10.
5. ✅ **Stray `!important`.** Fixed: only the reduced-motion block uses it. 21 uses in `index.css`. Remove outside the reduced-motion block.
6. ◐ **Hard-coded hex.** Literals equal to a token now use the token. About 840 one-off tints and grays remain in `index.css`; map each to a token when you touch its component.
7. **Monolith files.** `App.tsx` is 4,408 lines and `index.css` is 12,488 lines. Split by feature when touched, not in a bulk rewrite.
8. ✅ **No lint or format config and no CI.** Fixed: `eslint.config.js`, `.prettierrc.json`, `.github/workflows/ci.yml`. Add ESLint and Prettier, and a workflow that runs `tsc`, the fixture test, and a build.
9. ◐ **Repo hygiene.** Ignores added. `coder.md` and `static.zip` still need an owner's decision. `.DS_Store`, `dist/`, `.freebuff/`, `.debug-journal.md`, and `static.zip` (3.7 MB) are untracked and not ignored. `coder.md` is empty. Add ignores and decide what to keep.
10. ✅ **Images without alt.** Verified: every `<img>` has `alt`. One `<img>` in `App.tsx` has no `alt`.
11. **API surface.** `server.js` sends `Access-Control-Allow-Origin: *` on GET endpoints and has no rate limiting. Acceptable for public read-only data. Revisit before any write endpoint exists.
12. **Admin auth is dev-only.** The admin password check runs in the Vite dev server only. Production has no admin login. Keep it that way unless a real auth design is approved.
13. **Dead «Фільтри» button.** It had no handler in five category headers and was removed. Bring it back only together with a working filter panel.
14. **Map layer colors.** User location and route lines on the map use a blue (`#0874df`, `#1688ef`) set in `App.tsx`. That is outside the token system; decide whether map paint follows tokens.
15. **User accounts.** Sign-in and registration need an auth backend and a privacy policy. The UI shows «Незабаром» until both exist; do not add a sign-in form that cannot work.
16. ✅ **Debug files in `public/`.** Removed: `__analysis.png`, `__analysis2.png`, `transit-3d.html`. Unreachable `sponsored-billboard.*` and `live-map.css` were removed too.
17. **Sticky hover on touch.** New components wrap `:hover` in `(hover: hover) and (pointer: fine)`. Older rules in `index.css` do not; fix them when you touch them.
18. ◐ **Audit 2026-10-24.** Findings and backlog in `docs/ui-audit-2026-10-24.md`. Search cards done (`ContextCard`). Selected place (hero, quick facts, detail order) done. The other screens against the references remain.
