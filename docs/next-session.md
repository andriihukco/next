# Next session: handoff

Written 2026-11-01 at the end of the redesign session. Read this first, then `docs/refactor-plan.md` and `docs/platform-plan.md` for slice status.

## Where things stand

- Branch stack (verified 2026-11-01 with `git merge-base`): two chains off S0. `feat/s0-process-infra` → `feat/s1-schema-rls` is one. `feat/s0-process-infra` → `refactor/r1-app-helpers` → `refactor/r2-app-split` → `feat/s6-remove-dummy-data` → `refactor/r6-server-split` → `refactor/r5-city-places` → `refactor/r3-city-guide` → `refactor/r3b-city-guide-sections` → `refactor/r4-large-components` → `perf/r9-first-load` → `feat/s8-legal-trust` → `feat/s7-release-notes` → `feat/s2-admin-shell` → `refactor/r7-3d-layers` → `fix/review-issues` is the other. The tip does not contain S1, but S2's `server/admin-auth.mjs` reads `public.profiles`, which only S1 creates. So S1 must merge before S2. `git merge-tree` shows S1 merges cleanly into the tip.
- All 16 are pushed to origin. Vercel previews are green for each. The top one is `https://next-git-fix-review-issues-drewhook.vercel.app`. Previews sit behind Vercel SSO.
- PR #1 (`feat/s0-process-infra` → `main`) is open. Its checks pass: CI `check`, Vercel. No other PRs. Nothing is merged.
- Checks at the tip of `fix/review-issues`: `tsc` ok, lint 0 errors / 0 warnings, fixtures 13/13, server tests 24/24, production build ok.
- Local stop/start: API on 3011, Vite on 5173 (`VITE_API_BASE_URL=http://localhost:3011`). Port 3001 belongs to an unrelated gulp process, so don't touch it. The proxy can be moved with `DEV_API_PROXY`.

## Done in the last session

- S0, S1, S2, S6, S7, S8: schema and RLS, admin shell, dummy-data removal, release notes, legal and account deletion.
- R1–R7 and R9: App, city guide, city places, server and 3D layers were split. First load of `/app` is about 537 KB gzipped, down from about 774 KB.
- Review fixes: «Послуги» card layout (`flex-direction: row` on `.unified-card`), FAQ copy, dev-only «· демо» labels, two lint warnings, configurable dev proxy.

## Blocked: needs a person

| Item | What is needed | Owner |
| --- | --- | --- |
| S3–S5 admin places, model upload, 3D from the API | A staging Supabase project; apply S1 migrations there; run `supabase/tests/run-local.sh` against it | Owner (S0 dashboards) |
| Legal pages | Operator details. Six `[потрібно: …]` markers in `src/legal/` | D-D |
| Brand rename | Decision | D2 |
| Super-app phase 2 | Waits until service flows come back | D-E |
| Account deletion, admin TOTP | Real test admin and a non-production Supabase project. Never run destructive calls against the live project in `.env.local` | Owner |

## Blocked: needs visual baselines first

- **R8 / S9:** split `src/index.css` (10,906 lines) and do the token cleanup. Take before/after screenshots of every screen first (desktop and mobile, light and dark). Without them this is too risky to do in one pass.

## Not started

- **Mobile:** `mobile/src/lib/demo-{shop,care,format,taxi,booking}.ts` are still there. Six service flows in `mobile/src/components/services/` use them. S10 is untouched and depends on S3 and S5 (`docs/platform-plan.md`), so it is blocked too. Any mobile work needs the Expo QR (see global CLAUDE.md section 8).

## Open questions to check before starting

1. Answered: `.github/workflows/ci.yml` runs on `push` to `main` and on `pull_request` only. Branch pushes get no CI until a PR is open. PR #1 got a green `check`.
2. Should the 16 PRs be opened as a chain (each based on the previous branch), or should they be squashed into one PR against `main`?

## Prompt for the next session

> Read `docs/next-session.md`. Confirm the branch stack and the Vercel previews still match it (`gh api`). Then do the first item that is not blocked. Ask the user before opening PRs, merging, or touching the live Supabase. Use the checks in CLAUDE.md. Report what was verified and what was not.
