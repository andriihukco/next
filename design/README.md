# next design library

One design system for the web app and the iOS and Android app. Tokens live in one file, each platform has one component set, and every element is shown live at `/design`.

## What is where

| Need | Go to |
|---|---|
| Colors, type, spacing, radius | [foundations.md](foundations.md), values in [tokens.json](tokens.json) |
| How web, iOS and Android differ | [platforms.md](platforms.md) |
| Tabs, pages, sheets, back | [navigation.md](navigation.md) |
| Each component and when to use it | [components.md](components.md) |
| Each screen and flow, top to bottom | [screens.md](screens.md) |
| Web-only rules (landing, desktop layout) | [../DESIGN.md](../DESIGN.md) |

## The live library

- `/design` is a documentation site. The sidebar opens each page of these docs at full width, with an "On this page" list. Links between the docs open the page in the site.
- Live library (`?page=live`): open it to see each element. The switch shows **Web**, **iOS** or **Android**.
- Web tab: the web components (`src/components/ui`), from `src/design-system/`.
- iOS and Android tabs: the real mobile components (`mobile/src/ui`), rendered by the Expo app's `/design` screen in a device frame.
- In the app: Профіль → Дизайн-система opens the same screen on the phone.

### Run it locally

```bash
npm run dev            # web app, /design
npm run design:mobile  # Expo web on port 8094, feeds the iOS and Android tabs
```

In production the iOS and Android tabs need a hosted Expo web export, set with `VITE_DESIGN_MOBILE_URL`. Until that exists they show how to run it locally.

## Keeping it in sync with code

1. Change a value in `design/tokens.json`.
2. Run `npm run design:tokens`. It writes `mobile/src/lib/tokens.generated.ts` and fails if `src/index.css` has a different value for a shared color.
3. Update the web value in `src/index.css` if the check fails, then run it again.
4. A new component goes into `mobile/src/ui` (mobile) or `src/components/ui` (web), into `components.md`, and onto both `/design` screens in the same change.

## Rules that never bend

- Map first, honest data, one visual language (DESIGN.md §1).
- One primary action per screen. Everything else is secondary, tonal or plain.
- A detail is a page, not a card over another page (navigation.md).
- Every touch target is at least 44 pt on iOS and 48 dp on Android.
- Demo, estimates and unconnected features are labeled: «Демо», «Оцінка», «Незабаром».
