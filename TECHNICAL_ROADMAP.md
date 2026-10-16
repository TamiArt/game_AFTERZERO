# AFTERZERO — Technical Roadmap

## Цель
Поддерживаемая Telegram Mini App с игровым миром, серверным состоянием и возможностью локального/demo-запуска без платных сервисов.

## Текущее состояние
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand.
- Backend: NestJS, Prisma, PostgreSQL; Telegram initData validation and JWT session.
- Gameplay API: resources, building, daily rewards, quests, collection, pet progression.
- Official Telegram Web Apps SDK is loaded by the page; the hook initializes the Mini App, viewport and theme.
- Frontend accounts for Telegram safe-area insets and stable viewport height.
- When the API is configured, the game is gated until Telegram authentication and the initial server snapshot succeed; no silent fallback to demo state.
- JWT sessions are renewed while the Mini App is visible, before the 15-minute access token expires; the original Telegram initData is still limited by server freshness validation.
- Setup instructions for HTTPS frontend/API, environment variables, database migrations and BotFather are in `docs/TELEGRAM_MINI_APP_SETUP.md`.
- Frontend supports demo mode when `VITE_API_URL` is not configured.
- Existing unit tests cover authentication validation and gameplay/progression rules.
- Figma Make-specific Vite configuration and `.figma` tooling have been removed from the working branch.
- CI verifies frozen-lockfile installation, frontend/API builds, and unit tests.
- Idempotent game actions reject request IDs reused for a different action type; regression tests were added.
- Collection exploration now debits energy with a conditional database update (`energy >= 10`) so concurrent requests cannot overspend based only on a stale snapshot.
- API environment validation now rejects malformed web origins, non-HTTPS production origins, and non-PostgreSQL database URLs; focused validation tests cover these cases.
- Production readiness, database migrations and real deployment still require validation in the hosting environment.

## Правила разработки
- Never commit directly to `main`; work only on a dedicated feature/fix branch.
- Do not create a pull request unless the user explicitly asks.
- Keep modules focused and reuse shared components/rules instead of duplicating logic.
- Keep every source file below 1500 lines; split earlier when readability or responsibility warrants it.
- Resolve file conflicts in favor of the newer intended version; do not keep duplicate legacy copies.
- Preserve current gameplay and demo fallback unless a behavior change is explicitly planned.
- Do not introduce paid services, mandatory paid APIs, secrets, or guessed user/game data.
- Remove Figma Make scaffolding only after replacing any runtime/build behavior it provides.
- Update this roadmap when work status or priorities change.

## Completed baseline cleanup
1. [x] Create isolated branch `chore/afterzero-audit-roadmap`.
2. [x] Add this roadmap based on repository inspection.
3. [x] Replace Figma-specific Vite plugins with standard Vite configuration.
4. [x] Remove obsolete Figma Make references from HTML, package metadata, and developer instructions.
5. [x] Remove obsolete `.figma` support files after confirming no runtime imports remain.
6. [x] Add CI for frozen-lockfile installation, frontend/API builds, and tests.
7. [x] Verify CI completed successfully for the baseline cleanup.

## Current iteration: correctness and Telegram launch
1. [x] Reject reuse of an idempotency key for a different game action.
2. [x] Add regression tests for same-action replay and cross-action key reuse.
3. [x] Verify CI passes with the regression tests.
4. [x] Make building resource debits conditional and atomic; reject the transaction if the current balance is insufficient.
5. [x] Add a regression test for a failed atomic balance guard.
6. [ ] Review remaining transaction boundaries and concurrent resource/cooldown updates.
7. [x] Remove duplicate wood-collection quest progress update in the world screen.
8. [x] Add store tests for one-time collect quest increments in local/demo mode.
9. [x] Apply the cross-action idempotency-key guard to progression actions, including unique-key race recovery.
10. [x] Add progression idempotency regression tests.
11. [x] Load the official Telegram Web Apps SDK before the React app.
12. [x] Initialize the Telegram Mini App viewport, theme and vertical-swipe behavior where supported.
13. [x] Add safe-area and stable-viewport styling for mobile clients.
14. [x] Gate gameplay when the backend is configured but Telegram authentication or initial server synchronization has not succeeded.
15. [x] Renew short-lived JWT sessions while the Mini App is visible.
16. [x] Document deployment configuration and BotFather connection steps.
17. [x] Verify CI for the Telegram integration changes; the branch build and tests passed on the current integration commit.
18. [ ] Deploy the frontend and API with real HTTPS origins and PostgreSQL; verify Telegram login end-to-end.
19. [ ] Verify long-running session behavior when Telegram initData approaches its 24-hour freshness limit.
20. [ ] Review remaining frontend/server synchronization behavior.
21. [x] Make collection energy debit atomic and add a regression test for a failed balance guard.
22. [x] Validate the web app origin and PostgreSQL connection URL at startup; require HTTPS for production origins and cover validation with tests.

## Next priorities
- Continue reviewing server authorization, input validation, idempotency and transaction behavior; collection energy and production URL configuration now have explicit guards.\n- Audit timer-driven actions and reward paths for duplicate execution; building completion now has client-side in-flight deduplication and a demo-store idempotency guard.
- Check Prisma schema/migrations and readiness behavior against a real PostgreSQL instance.
- Complete an end-to-end Telegram launch after the owner configures hosting secrets and bot URL.
- Split oversized UI/gameplay modules where it improves maintainability; do not perform blind mechanical refactors.
- Add targeted regression tests before changing gameplay rules.
- Consider social graph and WebSocket synchronization only after core stability and deployment checks.

## Acceptance criteria
- No runtime/build dependency on Figma Make or `.figma` paths.
- Frontend and API builds pass; tests pass or any environment-dependent blockers are documented.
- Existing demo mode and current gameplay flows remain intact.
- Telegram Web Apps SDK is loaded and backend-enabled sessions cannot silently fall back to local game state.
- Real Mini App login, database persistence and BotFather launch are verified on deployed HTTPS environments before release readiness is claimed.
- No source file exceeds 1500 lines.
- Changes are committed only to the dedicated working branch; do not create a PR unless requested.

## Code hygiene and product work plan (2026-10-16)

### Phase 1 — Safe inventory and baseline
- [ ] Capture current branch/commit and successful CI state before each cleanup batch.
- [ ] Generate a complete file inventory and source line-count report; flag files approaching the preferred 300–500 line range and the hard 1500-line ceiling.
- [ ] Add repeatable checks for unused exports/imports and dependency usage; classify each finding as safe removal, needs runtime verification, or keep.
- [ ] Establish baseline frontend bundle size and test/build output so optimizations can be compared rather than guessed.

### Phase 2 — Remove residual Figma Make artifacts
- [x] Remove Figma-specific Vite configuration and `.figma` tooling from the working branch.
- [x] Remove Figma Make references from package metadata and developer instructions.
- [ ] Audit `src/imports/` and any generated/pasted files; distinguish source-of-truth game specifications from accidental import artifacts before moving or deleting anything.
- [ ] Search for remaining Figma-related assets, scripts, lockfile-only packages, comments and generated wrappers; remove only when no active reference remains.
- [ ] Confirm no runtime/build imports point at Figma tooling and CI remains green.

### Phase 3 — Duplicate and dead-code audit
- [ ] Trace shared gameplay rules between `src/store/gameStore.ts`, `src/hooks/useAuthoritativeGame.ts`, API clients and server services; keep one authoritative implementation for each rule.
- [ ] Check repeated resource, quest, cooldown and reward updates for double-application and inconsistent demo/server behavior.
- [ ] Audit all declared dependencies against actual imports/scripts; remove only packages proven unused, then regenerate and validate `pnpm-lock.yaml`.
- [ ] Audit unused components, hooks, types, styles, assets, exports and stale feature flags.
- [ ] Review React effects with suppressed dependency checks and recurring timers for stale closures, unnecessary polling and duplicate requests.
- [ ] Extract reusable UI only where it reduces real duplication; avoid creating abstractions for one-off markup.

### Phase 4 — Maintainability and runtime performance
- [ ] Review `src/components/WorldScreen.tsx` (currently about 36 KB) as the first UI decomposition candidate; separate view sections and presentation data without changing gameplay rules.
- [ ] Review `src/store/gameStore.ts` (currently about 18.5 KB) for domain boundaries and duplicated state transitions.
- [ ] Review CSS for duplicated selectors/tokens and dead rules; preserve visual behavior while consolidating.
- [ ] Verify lazy-loaded screens, production bundle composition, unnecessary renders and polling frequency using measurable evidence.
- [ ] Keep modules focused, prefer 300–500 lines where practical, and never exceed 1500 lines.

### Phase 5 — Reliability and launch readiness
- [ ] Audit every server mutation for atomic resource/cooldown/reward handling and consistent idempotency.
- [ ] Verify authorization and DTO validation for every gameplay endpoint.
- [ ] Verify Prisma migrations and health/readiness checks against PostgreSQL.
- [ ] Add or improve tests for server/client synchronization, duplicate requests, session expiry, and demo mode.
- [ ] Perform end-to-end Telegram login and persistence validation after hosting/BotFather configuration is available.

### Phase 6 — Reference-led UI improvements
- [ ] Inspect the exact Pinterest pin visually before translating it into design changes; do not infer its appearance from unrelated search results.
- [ ] Map each reference pattern to a specific AFTERZERO screen and describe the intended change before implementation.
- [ ] Prioritize mobile hierarchy, readable resource/status indicators, touch targets, navigation clarity and consistent reusable surfaces.
- [ ] Preserve the current dark navy/teal visual identity unless the reference clearly justifies a deliberate change.
- [ ] Validate mobile viewport, safe areas, reduced motion, contrast and loading/error states after UI changes.

### First-pass observations (not yet removal decisions)
- Root `package.json` currently contains no obvious Figma-named dependency, and the current `vite.config.ts` uses standard React/Vite/Tailwind plugins. Figma cleanup therefore needs to focus on indirect/generated artifacts and actual import reachability, not blindly uninstalling packages.
- `src/imports/` contains a very small `image.png` plus three Markdown files (`afterzero-spec.md`, `afterzero-tech-spec.md`, `game-design-doc.md`). These files need reference tracing and ownership classification; the specifications may be valuable source material and must not be deleted just because of their location.
- `src/components/WorldScreen.tsx` is about 36 KB and `src/store/gameStore.ts` about 18.5 KB. These are audit/refactoring candidates, not proof of dead code.
- `src/App.tsx` contains a returning-player toast effect whose dependency list is intentionally suppressed; review the closure and timing behavior before altering it.
- The current branch CI run `38897470596` for commit `89147b111eb931ac9c2d67707850a8465ef697d4` passed. This confirms build/test checks only, not production or Telegram end-to-end readiness.
