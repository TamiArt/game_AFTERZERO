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
- [x] Created follow-up branch `fix/server-state-concurrency` from the latest audited branch; `main` remains untouched.
1. [x] Reject reuse of an idempotency key for a different game action.
2. [x] Add regression tests for same-action replay and cross-action key reuse.
3. [x] Verify CI passes with the regression tests.
4. [x] Make building resource debits conditional and atomic; reject the transaction if the current balance is insufficient.
5. [x] Add a regression test for a failed atomic balance guard.
6. [x] Make world-state refresh serializable because it can complete buildings and award XP; retry PostgreSQL serialization conflicts up to three attempts, with a regression test.
7. [x] Enforce pet-care thresholds on the API as well as in the UI, preventing repeated feeding/resting at near-full stats from farming actions and quest progress; add regression tests.
8. [x] Add a regression test proving progression mutations retry after a PostgreSQL serializable transaction conflict and execute the action only once after the retry.
9. [x] Cover Telegram initData timestamp boundaries: malformed timestamps and timestamps more than 60 seconds in the future are rejected.
8. [x] Add a regression test for concurrent game-action requests racing on the unique idempotency key; verify the loser replays the winning response without rerunning the action.
9. [x] Verify a concurrent request cannot reuse the same idempotency key for a different action type.
8. [ ] Review remaining transaction boundaries and concurrent resource/cooldown updates.
- [x] Guard demo-mode building completion against duplicate rewards and quest progress.
- [x] Deduplicate in-flight server completion requests and release the guard after failure so retries remain possible.
- [x] Add regression tests for repeated, unknown and already-finished building completion.
- [x] Keep the building-completion watcher idle when there are no active construction timers; reuse one timestamp per polling tick.
8. [x] Remove duplicate wood-collection quest progress update in the world screen.
9. [x] Add store tests for one-time collect quest increments in local/demo mode.
10. [x] Apply the cross-action idempotency-key guard to progression actions, including unique-key race recovery.
11. [x] Add progression idempotency regression tests.
12. [x] Load the official Telegram Web Apps SDK before the React app.
13. [x] Initialize the Telegram Mini App viewport, theme and vertical-swipe behavior where supported.
14. [x] Add safe-area and stable-viewport styling for mobile clients.
15. [x] Gate gameplay when the backend is configured but Telegram authentication or initial server synchronization has not succeeded.
16. [x] Renew short-lived JWT sessions while the Mini App is visible.
17. [x] Document deployment configuration and BotFather connection steps.
18. [x] Verify CI for the Telegram integration changes; the branch build and tests passed on the current integration commit.
19. [ ] Deploy the frontend and API with real HTTPS origins and PostgreSQL; verify Telegram login end-to-end.
20. [ ] Verify long-running session behavior when Telegram initData approaches its 24-hour freshness limit.
21. [ ] Review remaining frontend/server synchronization behavior.
22. [x] Make collection energy debit atomic and add a regression test for a failed balance guard.
23. [x] Validate the web app origin and PostgreSQL connection URL at startup; require HTTPS for production origins and cover validation with tests.

## Next priorities
- Continue reviewing server authorization, input validation, idempotency and transaction behavior; collection energy and production URL configuration now have explicit guards.
- Audit timer-driven actions and reward paths for duplicate execution; building completion now has client-side in-flight deduplication and a demo-store idempotency guard.
- The construction watcher now avoids an always-running interval when the world has no unfinished buildings; countdown rendering remains unchanged.
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

## Game design source of truth and product development plan (2026-10-16)

### Source documents reviewed
- `src/imports/pasted_text/game-design-doc.md` — product vision, core loop, screens, visual direction, resources, construction, progression, mysteries/events, pets, social features, collection, and MVP acceptance.
- `src/imports/pasted_text/afterzero-tech-spec.md` — server-authoritative world state, Telegram Mini App, the seven-handshakes social graph, visits, social actions, persistent progress, and launch criteria.
- `src/imports/pasted_text/afterzero-spec.md` — engineering workflow: small vertical slices, targeted tests, avoid invented features, validate integrations, and do not claim unverified deployment/readiness.
- These source documents are retained in `src/imports/pasted_text/`; do not remove them as generated artifacts.

### Product principles to preserve
- Core loop: explore → collect resources → build → unlock possibilities → discover secrets/events → develop the world → visit other worlds → return and continue.
- The server is the source of truth for resources, progression, rewards, inventory and social actions. Client UI is not an authority.
- Keep the premium, non-childish 2.5D island-game direction; keep the store visual-only and real-money purchases disabled for MVP.
- Build working vertical slices with persistence and tests rather than adding disconnected screens or mock-only functionality.
- No paid mandatory services; no direct commits to `main`; no PR unless explicitly requested.

### Documented product gaps to reconcile before expanding gameplay
These are differences between the current implementation and the design target, not permission to change balance silently:
- Progression currently caps at level 10 in `server/src/game/game.rules.ts`; the design target is at least 30 levels.
- Pet availability currently starts at level 2 in server progression; the design document specifies level 5.
- Server building catalog currently contains 6 types; design target is at least 15.
- The server collection currently explores a small fixed pool of about 10 item IDs; design target is at least 50 collectible items.
- Dynamic server-generated events, a persistent social graph with seven-handshake paths, world visits/reactions/help, social traces, and rankings/achievements are not yet demonstrated as complete end-to-end features.
- The current world map and interaction model should be checked against the intended 2D/2.5D tile/isometric direction before introducing a new game engine. Do not migrate to Phaser merely because it appears in a specification; first assess the current implementation and scope a measurable vertical slice.

### Ordered implementation plan
1. **Server-state correctness (current workstream).**
   - [ ] Finish regression coverage for successful serialization retries, duplicate collection/cooldown races, daily reward races, production claims and quest claims.
   - [ ] Audit every mutation for atomic resource checks, cooldown enforcement, idempotency-key consistency and reward application exactly once.
   - [ ] Verify API error messages are mapped to understandable UI feedback; ensure failed requests do not leave stale optimistic state.
2. **Client/server synchronization and persistence.**
   - [ ] Trace each gameplay action from screen → hook → API → controller/DTO → service → database → snapshot → store.
   - [ ] Cover refresh/reconnect, duplicate taps, expired sessions, delayed responses and concurrent actions with focused tests.
   - [ ] Verify demo mode remains separate and never overrides an enabled backend session.
3. **First complete gameplay vertical slice.**
   - [ ] Reconcile the starter tutorial with the documented new-player path: enter world, gather resources, build the first house, gain XP, see the next unlock.
   - [ ] Align server and demo-mode rules for costs, unlock levels, rewards, quests and discoveries.
   - [ ] Add server-backed tests and persistence checks before broadening content.
4. **Progression and exploration content.**
   - [ ] Define a versioned progression table for the 30-level target; specify unlocks and XP thresholds before changing the current level cap.
   - [ ] Reconcile pet unlock timing and ensure pet decay does not punish absence, as required by the design.
   - [ ] Expand buildings and the collection in data-driven catalogs; add discovery chains and server-persisted event outcomes.
5. **Social core: seven handshakes.**
   - [ ] Design data model and authorization for connections, requests, visit permissions, reactions and contributions.
   - [ ] Implement a minimal persistent contact graph and path/distance calculation with tests.
   - [ ] Complete a vertical slice: find a player → request/accept a connection → visit an allowed world → leave a reaction/trace → persist it.
   - [ ] Add cooperative tasks and contribution-based rewards only after the basic social slice is reliable.
6. **Mobile UX and product polish.**
   - [ ] Validate the documented screens and core loop on narrow Telegram viewports, including loading/error/empty states, safe areas, touch targets and readable resource indicators.
   - [ ] Decompose oversized components only where it reduces complexity, preserving visual design and game rules.
   - [ ] Keep shop as “coming soon”; do not enable real payments during MVP.
7. **Release validation.**
   - [ ] Verify migrations and readiness against a real PostgreSQL instance.
   - [ ] Deploy HTTPS frontend/API, configure Telegram BotFather and run an end-to-end Telegram login/save/return test.
   - [ ] Verify mobile performance, persistence across sessions, API authorization, basic analytics and recovery from network failures.
   - [ ] Mark MVP ready only when the end-to-end acceptance path in the design document has actually been exercised.

### Current execution focus
The active branch remains `fix/server-state-concurrency`. A regression test now verifies that an active resource-node cooldown rejects collection without changing world resources or recording a successful action. Separate regression coverage now proves a game mutation retries successfully after a serializable transaction conflict, and that the successful operation is applied once. Regression tests now simulate a competing daily reward claim and a competing production claim winning between serializable attempts; the retried request must not grant either reward twice. A deterministic concurrent resource-collection/cooldown race and a competing quest-claim retry still need coverage before closing the server mutation block. Idempotency keys are also now bound to the concrete target for collection nodes, building type/coordinates, building completion IDs and quest IDs, so accidental reuse of one request ID for a different target is rejected rather than silently replaying a different action. The next code changes should complete server mutation/concurrency tests first, then trace synchronization end-to-end. Product discrepancies above remain explicit backlog items until their rules are defined and tested; do not silently alter progression or resource balance during a concurrency fix.

