# AFTERZERO

AFTERZERO is a Telegram Mini App game about developing a civilization on an isolated island. Players gather resources, build structures, complete quests, discover collection items, and care for the creature Nox.

## Technology

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Zustand.
- **API:** NestJS, JWT sessions, Telegram Mini App `initData` verification.
- **Database:** PostgreSQL through Prisma.
- **Tests:** Vitest and Supertest.

## Run the frontend in demo mode

Requirements: Node.js 22 and pnpm 10 (versions are listed in `.mise.toml`).

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Open the Vite URL shown in the terminal (default `http://localhost:8443`). If `VITE_API_URL` is not set, the frontend uses its demo/local game mode; no Telegram bot token or database is needed for that mode.

## Run the API locally

1. Start a local PostgreSQL instance and create a database/user matching your connection string.
2. Copy `.env.example` to `.env` and set real local values. Do not commit `.env`.
3. Set `DATABASE_URL`, `JWT_SECRET` (at least 32 characters in production), `TELEGRAM_BOT_TOKEN`, and `WEB_APP_ORIGIN`.
4. Generate Prisma Client and apply migrations.
5. Start the API and frontend.

```bash
pnpm db:generate
pnpm db:migrate:deploy
pnpm api:dev
```

The API listens on port `3000` by default and exposes its routes under `/api/v1`. Configure `VITE_API_URL=http://localhost:3000/api/v1` to connect the frontend. `WEB_APP_ORIGIN` must match the frontend origin.

Health endpoints:
- `GET /api/v1/health/live` — process liveness.
- `GET /api/v1/health/ready` — database readiness.

## Useful commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start frontend development server |
| `pnpm build` | Generate Prisma Client, build frontend, and type-check/build API |
| `pnpm api:build` | Build/type-check API TypeScript |
| `pnpm test` | Run unit tests |
| `pnpm preview` | Serve the production frontend build locally |

## Code layout

- `src/components/` — game screens and reusable UI.
- `src/store/` — client game and settings state.
- `src/api/` and `src/hooks/` — API integration and reusable hooks.
- `server/src/auth/` — Telegram authentication and JWT session.
- `server/src/game/` — authoritative resource and building rules.
- `server/src/progression/` — quests, collection, and pet progression.
- `prisma/` — database schema and migrations.
- `TECHNICAL_ROADMAP.md` — current engineering status and next steps.

## Security notes

- Telegram login is verified server-side; the frontend must not be treated as an authority for backend gameplay actions.
- Keep bot tokens, database credentials, and JWT secrets in environment variables only.
- The production API requires a strong JWT secret and a database connection.
- This repository does not require paid APIs or hosted AI services.

## Project status

The roadmap tracks work in progress and verification requirements. A successful source edit does not imply a verified release: run the build and test commands in an environment with Node.js, pnpm, and any required database available.
