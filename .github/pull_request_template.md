## Summary

<!-- What changes and why, 2 to 4 lines. -->

## Release note

<!-- Read by the release-notes job after merge. Keep each line to one sentence. -->
Release note (uk): 
Category: new | improved | fixed | internal

<!-- internal = no entry on /updates. -->

## Preview

<!-- Vercel preview URL. Uses the staging backend only. -->

## Screens

<!-- Desktop 1440px and mobile 375px, light and dark. Remove if there is no UI change. -->

## Risks and rollback

<!-- What could break, and how to revert (Vercel instant rollback, or a down migration). -->

## Checks

- [ ] `npx tsc --noEmit`
- [ ] `npm run test:fixtures`
- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Migrations dry-run passes on staging (if `supabase/` changed)
- [ ] Checked at 375px and 1440px, both themes, no horizontal scroll, keyboard path works
- [ ] No mock, demo or fixture data in production paths
