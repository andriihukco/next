# Navigation

## Mobile: map, sheet and tab bar

The live map is behind every page. It is not a tab. Pages slide up in one bottom sheet over the map, and the tab bar stays at the bottom.

```
App shell (mobile/src/app/(sheet)/_layout.tsx)
├── CityBackdrop         live map, full screen, city pill, map controls   (behind everything)
├── Sheet                one bottom sheet, snaps: minimised · half · full
│   └── pages (native stack, one back stack per shell)
│       ├── /transport       Транспорт      tab root, large title
│       ├── /places          Місця          tab root, header search
│       ├── /services        Послуги        tab root
│       ├── /more            Більше         tab root: list of city sections
│       │   └── /more/[id]   Освіта, Афіша, Робота, Нерухомість, Ринок, Парковка, АЗС, Електрозарядка
│       ├── /vehicle/[id]    Транспорт      pushed page
│       ├── /stop/[id]       Зупинка        pushed page
│       ├── /shelter/[id]    Укриття        pushed page
│       ├── /place           Місце          pushed page
│       ├── /service/[id]    service flow   pushed page, the flow has its own steps
│       ├── /route/[key]     Маршрут        pushed page
│       ├── /profile         Профіль        pushed from the avatar
│       ├── /profile-edit    Мій профіль    pushed page
│       └── /account         Обліковий запис pushed page
└── TabBar               Транспорт · Місця · Послуги · Більше (always visible)

Full screen, above the shell: /directions (Маршрут пішки), /design (Дизайн-система), /welcome, /walk.
```

Code: `mobile/src/app/`, the shell in `mobile/src/components/sheet/`, the map in `mobile/src/components/map/city-backdrop.tsx`, tabs in `mobile/src/lib/section-tabs.ts`, sheet state in `mobile/src/lib/sheet-store.ts`, routes in `mobile/src/lib/navigation.ts`.

## Sheet

| Snap | Height | What shows |
|---|---|---|
| `minimised` | 0 | Only the tab bar. The map is whole. |
| `half` | 46% of the screen | Default. The map stays most of the screen. |
| `full` | 92% of the screen | The page fills the sheet. The city pill stays under it. |

- Drag the grabber or the tab bar up or down. The sheet settles on the nearest snap, with a small fling.
- Pushing a page while the sheet is minimised opens it to `half`.
- «Показати на мапі» and the map «Мапа» return (`goToMap`) minimise the sheet, so the item is in view.
- The sheet is one native stack. Back pops inside the sheet; the map and the tab bar stay put.

## Rules

1. **Every page is in the sheet.** Tabs, details and sections all open in the one sheet over the map. Full-screen exceptions are `directions`, `design`, `welcome` and `walk`.
2. **Four tabs, fixed order, no more.** Транспорт, Місця, Послуги, Більше. Education, Events and the other city sections are under «Більше», as on the web. The user cannot hide or reorder tabs; «Вкладки» is removed.
3. **Tab roots have a large title** (iOS) or an app bar title (Android), and nothing else in the header except the avatar.
4. **The map stays a map.** Its controls float in the top corners: map type, my location, compass, camera, layers. They open short panels, which act on the map you are looking at.
5. **Tapping the active tab returns to its root.** When the sheet is minimised, tapping the active tab opens it to `half`.
6. **Sheets only for pages and short choices.** Pages live in the sheet. Confirm alerts, share sheets and the map-control panels are separate, short sheets.
7. **Onboarding** shows once, over the map, as a welcome card and a short spotlight tour. «Показати знайомство ще раз» in Профіль reopens it.
8. **Empty sections are honest.** Афіша shows an empty state until its event source is connected on mobile. It never shows sample events.

## Platforms

The shell, sheet and tab bar are one React Native implementation for iOS and Android, so both platforms behave the same. The tab bar uses Material icons on both, not SF Symbols.

## Web

Same four tabs and the same «Більше» list as mobile, in `src/components/city-guide.tsx` (`CITY_TABS`, `MORE_SECTION_IDS`) and `src/components/city-guide/more-list.tsx`.

- **Desktop:** the rail is on the left, the map fills the rest, and the four tabs sit at the top of the rail. The rail shows one page at a time.
- **Phone (≤ 800px):** the rail is a bottom sheet over the full-screen map. The tab row is at the top of the sheet. The sheet's peek snap is the tab row alone, so it minimises to the tab bar, as on mobile. Its half and full snaps show the page.
- **Position:** on the web the tab row sits at the top of the sheet, and on mobile it sits at the bottom. The order, labels and behaviour match.

Tab rules are the same as mobile: tapping the active tab returns to its root; tapping «Більше» shows its list; «Показати на мапі» returns to the map.
