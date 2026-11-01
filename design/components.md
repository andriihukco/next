# Components

Mobile: `mobile/src/ui` (import from `../ui`). Web: `src/components/ui` (DESIGN.md §7). Every component below is on `/design` in both platform variants.

## Text

**Txt** `variant` (type role), `tone` (default, muted, primary, accent, danger, onPrimary), `weight`.
Use roles, never raw font sizes.

## Layout

**Page.** A scrolling page under a native header. It keeps the screen margin and the gap between sections, collapses the iOS large title, and keeps clear of the tab bar.

**Section.** An optional title, an optional action on the right, the content, and an optional footer. With `grouped`, the rows sit on one card surface, as an inset grouped list.
- Title on iOS: headline. On Android: subhead in primary.
- Use the footer for the data source or a one-line explanation, not a separate paragraph.

**Surface.** A card. With `onPress` it is a button: dims on iOS, ripples on Android. `padded` adds 16 and a 12 gap.

**Row, Divider.** A horizontal row with a gap, and a hairline.

## Actions

**Button** `variant`: filled, tonal, outline, plain, danger. `size`: md, lg. `stretch`, `icon`, `disabled`.
- One filled button per screen: the action the page is for.
- Secondary actions are tonal. Use outline when a tonal button would be too strong next to the primary.
- Plain buttons are for text actions like «Забули пароль?». Danger is for «Видалити».

**IconButton.** Round, always labeled for screen readers.

**AvatarButton.** The profile entry at the top right of tab roots.

## Lists

**ListRow.** Leading icon, title, subtitle, value, trailing control, `onPress`.
- iOS: tinted icon tile, chevron when it navigates, inset separator. Android: plain icon, no chevron, 56 tall.
- `value` is for a short fact on the right (distance, status). Longer text goes in the subtitle.
- `destructive` makes the title red. Pass `last` on the final row so no separator follows it.

**SwitchRow.** A ListRow with the system switch. Disabled until the feature works (show a footer that says why).

## Choice

**Chip.** A filter. Capsule on iOS, a filter chip with a check on Android. Put several in a horizontal scroll.

**Segmented.** Two to four exclusive views of the same content (Список or Сітка; Вхід or Реєстрація; theme).

## Status and identity

**Badge** `tone`: neutral, accent, live, warning. Short labels only: «Демо», «Оцінка», «Незабаром», «Наживо · GPS», «Beta».

**RouteBadge.** A route number on its fleet color. `lg` on detail page headers.

**IconOrb.** A round colored icon for categories and services.

**EmptyState.** An icon, one title, one sentence on why it is empty, and the next step if there is one. Never an empty white area.

## Feature components

| Component | Where | Notes |
|---|---|---|
| CategoryTiles | Місця, Освіта | Colored orbs with labels, horizontal scroll (DESIGN.md §7) |
| PlaceGridCard | Місця grid | Color block and name |
| PlaceExtras | Place page | Photos, rating and reviews when a source exists |
| MapControls | Map tab | Map type, my location, compass, camera, layers |
| Onboarding | Map tab | Welcome card and spotlight tour |
| Service flows | service/[id] | Demo flows with steps, «Демо» everywhere |
