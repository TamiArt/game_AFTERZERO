# AFTERZERO — Technical Roadmap

## Цель
Поддерживаемая Telegram Mini App с игровым миром, серверным состоянием и возможностью локального/demo-запуска без платных сервисов.

## Текущее состояние
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand.
- Backend: NestJS, Prisma, PostgreSQL; Telegram initData validation and JWT session.
- Gameplay API: resources, building, daily rewards, quests, collection, pet progression.
- Frontend supports demo mode when `VITE_API_URL` is not configured.
- Existing unit tests cover authentication validation and gameplay/progression rules.
- Figma Make-specific Vite configuration and `.figma` tooling have been removed from the working branch.
- CI verifies frozen-lockfile installation, frontend/API builds, and unit tests.
- Idempotent game actions reject request IDs reused for a different action type; regression tests were added.
- Production readiness, full test suite, database migrations and deployment configuration must be verified in CI/environment before claiming release readiness.

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

## Current iteration: correctness and maintainability
1. [x] Reject reuse of an idempotency key for a different game action.
2. [x] Add regression tests for same-action replay and cross-action key reuse.
3. [x] Verify CI passes with the regression tests.
4. [x] Make building resource debits conditional and atomic; reject the transaction if the current balance is insufficient.
5. [x] Add a regression test for a failed atomic balance guard.
6. [ ] Review remaining transaction boundaries and concurrent resource/cooldown updates.
7. [x] Remove duplicate wood-collection quest progress update in the world screen; the store already owns this local-mode update and server mode syncs authoritative progress.
8. [x] Add store tests for one-time collect quest increments in local/demo mode.
9. [ ] Audit frontend state synchronization and split large screens only where safe.

## Next priorities
- Verify server authorization, input validation, idempotency and transaction behavior.
- Check Prisma schema/migrations and readiness behavior against a real PostgreSQL instance.
- Split oversized UI/gameplay modules where it improves maintainability; do not perform blind mechanical refactors.
- Add targeted regression tests before changing gameplay rules.
- Consider social graph and WebSocket synchronization only after core stability and deployment checks.

## Acceptance criteria
- No runtime/build dependency on Figma Make or `.figma` paths.
- Frontend and API builds pass; tests pass or any environment-dependent blockers are documented.
- Existing demo mode and current gameplay flows remain intact.
- No source file exceeds 1500 lines.
- Changes are committed only to the dedicated working branch; do not create a PR unless requested.
