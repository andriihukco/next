# Project instructions

## UI work

- Read `DESIGN.md` before changing any UI, styling, copy, or motion.
- Use the tokens, type scale, spacing, radius, and motion values defined there. Do not add raw hex colors, new radii, or new font sizes.
- Build controls from `src/components/ui/` primitives. Use `Chip` for filter pills once it exists.
- Run the checklist in `DESIGN.md` section 11 before reporting a UI change as done.
- If a change needs a value `DESIGN.md` does not cover, propose the value and update `DESIGN.md` in the same change.

## Checks

- `npx tsc --noEmit`
- `npm run test:fixtures`

## Open questions

Open decisions D1–D5 in `DESIGN.md` section 14 are unresolved. Ask before acting on them.
