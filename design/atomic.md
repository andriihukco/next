# Atomic design

Every screen is built from the same four levels, on both the web and the mobile apps. A block is one component at one level. A screen is a template with blocks placed inside it. The **Builder** on this site composes blocks this way.

## The levels

| Level | What it is | Web | Mobile |
|---|---|---|---|
| Atoms | One element, no state of its own | `Icon`, `Badge`, `Txt`, `IconOrb` | `mobile/src/ui/atoms` |
| Molecules | A few atoms that do one job together | `Glass control`, `Route marker`, `Glass surface`, `Button` with an icon | `mobile/src/ui/molecules` |
| Organisms | A whole part of a screen | `Top bar`, `Tab bar`, `Place card` | `mobile/src/ui/organisms` (`GlassBar`, `Section`, `EmptyState`) |
| Templates | The frame a screen is placed in | `Map screen`, `List screen` | `mobile/src/ui/templates` (`Page`) |

## Rules

1. **Build up, not down.** A new element starts as an atom. It becomes a molecule when it is used with another atom to do one job. It is an organism when it is a whole part of a screen.
2. **Blocks take their look from tokens only.** No raw colors, radii or font sizes. Liquid glass comes from `--glass-*` (web) and `Glass` (mobile), see DESIGN.md §2e.
3. **Templates own the layout, blocks own the content.** A block never sets its own page margins or position in the screen.
4. **One element per platform, same name.** `GlassBar` on mobile and `Top bar` on the web are the same organism. Each one has a row in the component pages with its platform switch.
5. **Glass is chrome.** The top bar, tab bar, map markers and map controls can be glass. Cards for reading stay opaque on the list template. On the map template, a place card may be glass only when it floats over the map.

## Liquid glass by level

| Level | Glass | Notes |
|---|---|---|
| Atom | No | Glass on a single icon reads as a button; use a control molecule. |
| Molecule | Yes: controls, markers, floating labels | Tint only the selected state. |
| Organism | Yes: top bar, tab bar, floating card | Never glass on glass: a glass control inside a glass bar sits on an opaque tile. |
| Template | The map template is the only one with a map behind the glass | The list template uses opaque surfaces only. |

## Where the code lives

- Web blocks: `src/design-system/atomic.tsx`. The builder: `src/design-system/design-builder.tsx`.
- Web glass: `src/components/ui/glass.tsx` and `glass.css`.
- Mobile glass: `mobile/src/ui/glass.tsx`. The organism is `mobile/src/ui/organisms/glass-bar.tsx`.
- To add a block, add it to `BLOCKS` in `atomic.tsx` with its props and JSX, then add a row to the mobile demos if it has a mobile element.
