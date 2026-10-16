# AFTERZERO — Development Guide

## Stack
- Frontend: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand.
- Backend: NestJS, Prisma, PostgreSQL.
- Package manager: pnpm.

## Project structure
- `src/App.tsx`: application shell and screen routing.
- `src/components/`: reusable UI and game screens.
- `src/store/`: client state and settings.
- `src/api/`: frontend API clients.
- `src/hooks/`: reusable application hooks.
- `server/src/`: NestJS API modules and game rules.
- `prisma/`: schema and database migrations.
- `TECHNICAL_ROADMAP.md`: current status, rules, and next steps.

## Development rules
- Never commit directly to `main`; work on a dedicated branch and open a pull request.
- Preserve existing gameplay behavior unless a change is explicitly planned.
- Keep components, services, and rules focused; extract reusable logic rather than duplicating it.
- Keep every source file under 1500 lines.
- Prefer dependency-free solutions and do not add paid services or mandatory paid APIs.
- Never commit secrets or fabricate player/game data.
- Run the frontend build, API type-check, and tests when the environment permits; document blockers clearly.
- Update `TECHNICAL_ROADMAP.md` as work progresses.
