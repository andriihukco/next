# Foundations

All values come from [tokens.json](tokens.json). The web keeps its CSS variables in `src/index.css`, and `npm run design:tokens` checks that they match.

## Color

Core roles are shared by web and mobile, in light and dark.

| Role | Light | Dark | Use |
|---|---|---|---|
| background | `#f8faf9` | `#0f1714` | Page behind everything |
| card | `#ffffff` | `#17221d` | Grouped lists, cards, sheets |
| surface-muted | `#f1f4f2` | `#1d2a24` | Segmented track, pressed rows, neutral tiles |
| border | `#dce5df` | `#2c3d35` | Separators, outlines |
| foreground | `#18251f` | `#e6efe9` | Main text |
| muted-foreground | `#5f6e66` | `#9fb3a7` | Secondary text, captions, footers |
| primary | `#087a50` | `#34b87e` | The one filled action, selected tab, links |
| primary-foreground | `#ffffff` | `#04150d` | Text and icons on primary |
| accent | `#e5f2eb` | `#1e3a2e` | Tonal buttons, selected chips |
| accent-foreground | `#075c3d` | `#bfead3` | Text on accent |
| destructive | `#b42318` | `#f87171` | Delete and danger text |

Accent colors for categories, fleets and transport keep one value in both themes (DESIGN.md §2a). Route numbers always sit on their fleet color with white text.

Never show state with color alone. Pair it with a check, a label or an accessibility state.

## Type

Semantic roles, so a screen says *what* the text is, and the platform decides the size. Font: Manrope.

| Role | iOS (HIG) | Android (M3) | Use |
|---|---|---|---|
| largeTitle | 34 / 41 extrabold | 28 / 36 bold | Page title on a tab root, place name |
| title | 22 / 28 bold | 22 / 28 bold | Entity title on a detail page |
| headline | 17 / 22 semibold | 16 / 24 semibold | Section titles (iOS), emphasized rows |
| body | 17 / 22 | 16 / 24 | Row titles, paragraphs |
| callout | 16 / 21 | 15 / 22 | Buttons, secondary paragraphs |
| subhead | 15 / 20 | 14 / 20 | Row subtitles, chips, section titles (Android) |
| footnote | 13 / 18 | 12 / 16 | Section footers, data sources |
| caption | 12 / 16 | 11 / 16 semibold | Badges, labels under tiles |

The web keeps its own scale (DESIGN.md §3) because desktop reading distance differs.

## Space

A 4-point grid: `xs 4`, `sm 8`, `md 12`, `lg 16`, `xl 24`, `xxl 32`, `xxxl 40`.

| Layout | Value |
|---|---|
| Screen margin (left and right) | 16 |
| Gap between sections | 24 |
| Gap inside a section | 8 to 12 |
| Card padding | 16 |
| Row height | 44 iOS, 56 Android (two lines: taller) |
| Touch target | 44 pt iOS, 48 dp Android |

Hierarchy comes from space first, then weight, then size, then color. A page reads as: title, one line of context, the primary action, then sections.

## Radius

| Platform | Control | Card / grouped list | Sheet | Pill |
|---|---|---|---|---|
| Web | 6 | 8 | 8 (top) | 999 |
| iOS | 10 | 14 | 20 | 999 |
| Android | 20 (buttons are full pills) | 12 | 28 | 999 |

Map artwork and the device frame on `/design` are illustrations and keep their own shapes.

## Elevation

Mobile uses almost none. Grouped surfaces sit on the background with no shadow. Floating map controls get a soft shadow (`shadow` role), and so does the selected segment on iOS. The web keeps `--shadow-raised` and `--shadow-overlay`.
