# Navigation

## Mobile: tabs and pages

```
Root stack
├── (tabs)                     system tab bar
│   ├── Мапа          /         full-screen map, floating controls
│   ├── Транспорт     /transport  large-title page
│   ├── Місця         /places     large-title page, header search
│   ├── Освіта        /education  large-title page
│   └── Послуги       /services   large-title page
├── route/[key]      Маршрут          pushed page
├── vehicle/[id]     Транспорт         pushed page
├── stop/[id]        Зупинка           pushed page
├── shelter/[id]     Укриття           pushed page
├── place            Місце             pushed page
├── service/[id]     service flow      pushed page, the flow has its own steps
├── profile          Профіль           pushed from the avatar
├── profile-edit     Мій профіль       pushed page
├── account          Обліковий запис   pushed page
├── directions       Маршрут пішки     full screen
└── design           Дизайн-система    pushed page
```

Code: `mobile/src/app/`, routes in `mobile/src/lib/navigation.ts`.

## Rules

1. **A detail is a page.** Tapping a vehicle, stop, place, shelter or service pushes its page with a back button. Nothing slides up over the map or over another page to show details.
2. **Five tabs, no more.** That is the HIG limit and matches the web sections. Профіль is the avatar at the top right of every tab root, not a tab.
3. **Tab roots have a large title** (iOS) or an app bar title (Android), and nothing else in the header except the avatar.
4. **The map stays a map.** Its controls float in the corners: map type, my location, compass, camera, layers. They open short panels (map type, camera, layers), which are allowed because they act on the map you are looking at.
5. **«Показати на мапі» goes back to the Мапа tab**, centered on the item, with the item highlighted.
6. **Sheets only for short choices**: a confirm alert, a share sheet, the map-control panels. Never for content you read.
7. **Tapping the active tab returns to its root** (system behavior).
8. **Onboarding** shows once, on the map tab, as a welcome card and a short spotlight tour.

## Web

The desktop layout stays: rail on the left, map in the middle, one inspector on the right (DESIGN.md §5). It moves to these rules in the second pass of the rebuild.
