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
- Continue reviewing server authorization, input validation, idempotency and transaction behavior; collection energy and production URL configuration now have explicit guards.
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
