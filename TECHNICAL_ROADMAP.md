# AFTERZERO — Technical Roadmap

## Цель
Поддерживаемая Telegram Mini App с игровым миром, серверным состоянием и возможностью локального/demo-запуска без платных сервисов.

## Текущее состояние
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand.
- Backend: NestJS, Prisma, PostgreSQL; Telegram initData validation and JWT session.
- Gameplay API: resources, building, daily rewards, quests, collection, pet progression.
- Frontend supports demo mode when `VITE_API_URL` is not configured.
- Existing unit tests cover authentication validation and gameplay/progression rules.
- Figma Make-specific config and tooling are still present in the baseline; cleanup is in progress.
- Production readiness, full test suite, database migrations and deployment configuration must be verified in CI/environment before claiming release readiness.

## Правила разработки
- Never commit directly to `main`; work on a dedicated feature/fix branch and use a PR.
- Keep modules focused and reuse shared components/rules instead of duplicating logic.
- Keep every source file below 1500 lines; split earlier when readability or responsibility warrants it.
- Resolve file conflicts in favor of the newer intended version; do not keep duplicate legacy copies.
- Preserve current gameplay and demo fallback unless a behavior change is explicitly planned.
- Do not introduce paid services, mandatory paid APIs, secrets, or guessed user/game data.
- Remove Figma Make scaffolding only after replacing any runtime/build behavior it provides.
- Update this roadmap when work status or priorities change.

## Current iteration: remove platform scaffolding safely
1. [x] Create isolated branch `chore/afterzero-audit-roadmap`.
2. [x] Add this roadmap based on repository inspection.
3. [ ] Replace Figma-specific Vite plugins with standard Vite configuration.
4. [ ] Remove Figma Make references from HTML, package metadata, and developer instructions.
5. [ ] Remove obsolete `.figma` support files after confirming no runtime imports remain.
6. [ ] Verify frontend build, API TypeScript build, and unit tests in a Node/pnpm environment.
7. [ ] Review large components and extract focused modules in separate, behavior-preserving changes.

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
- Changes are committed only to this branch and reviewed through a pull request.
