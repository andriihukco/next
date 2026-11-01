# Platforms

Same screens and flows everywhere. The surface follows each platform, so the app feels native on each one. The mobile kit picks the variant from the device (`useUiPlatform`), and `/design` can force either one (`PlatformOverride`).

| Element | Web | iOS (Apple HIG) | Android (Material 3) |
|---|---|---|---|
| Navigation | Left rail, map, right inspector | System tab bar, SF Symbols, liquid glass on iOS 26 | Navigation bar, Material Symbols, active indicator |
| Page title | Heading in the panel | Large title that collapses on scroll | Top app bar title |
| Back | Breadcrumb or back button | Chevron with the previous title, edge swipe | Arrow in the app bar, system back |
| Primary button | Filled, radius 8, press scale | Filled rounded rectangle, light haptic | Filled pill, ripple |
| Secondary button | Outline | Tonal (tinted) | Tonal |
| List | Cards and rows | Inset grouped list, tinted icon tiles, chevrons, inset separators | Full rows, plain icons, no chevrons, no separators |
| Filter | Toggle pill | Capsule that fills | Filter chip with a check |
| Two to four options | ToggleGroup | Segmented control with a raised thumb | Segmented buttons with a check |
| Switch | shadcn Switch | System UISwitch | Material switch |
| Search | Field in the panel | Search field in the navigation bar | Search in the app bar |
| Confirm a destructive action | Dialog | Action alert with a red button | Material dialog |
| Feedback on tap | Hover and press states | Dim, haptic on the primary action | Ripple |

## When the platforms disagree

- Follow the platform for **controls and navigation** (how things look and move).
- Follow the product for **content and order** (what is on the screen, and in which order). A stop page has the same sections on iOS and Android.
- Copy is the same on all platforms (DESIGN.md §9).
