# Alma — Lead Management

A full-stack application for capturing and managing prospect **leads**.

- **Public lead form** (no auth): a prospect submits first name, last name, email,
  and a resume/CV. On submission, confirmation + notification emails are sent to
  the prospect and to an internal attorney.
- **Internal dashboard** (auth): attorneys view all leads and move each lead from
  `PENDING` to `REACHED_OUT`.

## Tech stack

| Concern    | Choice                                                           |
| ---------- | ---------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, TypeScript) — UI + REST API in one app   |
| Database   | PostgreSQL via Prisma 7 (driver adapter `@prisma/adapter-pg`)    |
| Validation | Zod                                                              |
| Auth       | JWT session (`jose`) in an httpOnly cookie + `bcryptjs`          |
| Email      | Resend (console fallback when no API key is set)                 |
| Storage    | Pluggable `StorageService` — local disk / Railway volume (or S3) |
| Tests      | Vitest (unit + integration) and Playwright (E2E)                 |
| Deploy     | Railway (Postgres + a volume for resume files)                   |

See [`DESIGN.md`](./DESIGN.md) for the architecture and the rationale behind
these choices, and [`NOTES.md`](./NOTES.md) for how coding agents were used.

## Prerequisites

- Node.js 22+
- A PostgreSQL 16+ database (use the bundled `docker compose`, or any local/remote Postgres)

## Run locally

```bash
# 1. Install dependencies (also runs `prisma generate` via postinstall)
npm install

# 2. Configure environment
cp .env.example .env
#    The defaults match the docker-compose database below. For real emails,
#    set RESEND_API_KEY; otherwise emails are printed to the server console.

# 3. Start Postgres
docker compose up -d
#    (No Docker? Point DATABASE_URL at any Postgres instance instead.)

# 4. Apply the schema and seed an attorney account
npm run db:migrate     # applies migrations
npm run db:seed        # creates attorney@alma.test / password123

# 5. Start the app
npm run dev            # http://localhost:3000
```

- Public form: <http://localhost:3000/leads/new>
- Dashboard: <http://localhost:3000/dashboard> (log in at `/login` with the seeded account)

## Useful scripts

| Script                      | Purpose                              |
| --------------------------- | ------------------------------------ |
| `npm run dev`               | Start the dev server                 |
| `npm run build`             | `prisma generate` + production build |
| `npm run typecheck`         | TypeScript type checking             |
| `npm run lint`              | ESLint                               |
| `npm run format`            | Prettier (write)                     |
| `npm run db:migrate`        | Create/apply migrations (dev)        |
| `npm run db:migrate:deploy` | Apply migrations (prod/CI)           |
| `npm run db:seed`           | Seed the attorney account            |
| `npm run db:studio`         | Open Prisma Studio                   |
| `npm test`                  | Unit + integration tests             |
| `npm run test:e2e`          | Playwright end-to-end tests          |

## Deployment (Railway)

A full walkthrough lives in [`DESIGN.md`](./DESIGN.md#deployment). In short:
provision a Postgres plugin, attach a volume mounted at `STORAGE_LOCAL_DIR`, set
the environment variables from `.env.example`, and Railway builds with
`npm run build` and applies migrations with `npm run db:migrate:deploy`.
