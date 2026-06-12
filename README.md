# Alma — Lead Management

**▶ Live demo: <https://alma-production-2def.up.railway.app>**

A full-stack application for capturing and managing prospect **leads**.

- **Public lead form** (no auth): a prospect submits first name, last name, email,
  and a resume/CV. On submission, confirmation + notification emails are sent to
  the prospect and to an internal attorney.
- **Internal dashboard** (auth): attorneys view all leads and move each lead from
  `PENDING` to `REACHED_OUT`.

> **Demo mode.** The hosted app opens on a start screen: enter an email and
> you're signed in as an attorney with that address (a real session is
> provisioned — the password step is just skipped). Leads you submit notify that
> email, and a page refresh returns you to the start screen. See
> **[How to use](#how-to-use)** and [`docs/USAGE.md`](./docs/USAGE.md).

## Documentation

| Document                                                               | What it is                                            |
| ---------------------------------------------------------------------- | ----------------------------------------------------- |
| [`docs/USAGE.md`](./docs/USAGE.md)                                     | How to use the app (prospect vs attorney walkthrough) |
| [`DESIGN.md`](./DESIGN.md)                                             | System design — the why/how behind the choices        |
| [`docs/agent-usage/writeup.md`](./docs/agent-usage/writeup.md)         | Coding-agent usage — ½-page writeup                   |
| [`docs/agent-usage/transcripts.md`](./docs/agent-usage/transcripts.md) | Representative prompt logs / session excerpts         |
| [`NOTES.md`](./NOTES.md)                                               | Agent-vs-hand-written attribution + bug log           |

## Tech stack

| Concern    | Choice                                                           |
| ---------- | ---------------------------------------------------------------- |
| Framework  | Next.js 16 (App Router, TypeScript) — UI + REST API in one app   |
| Database   | PostgreSQL via Prisma 7 (driver adapter `@prisma/adapter-pg`)    |
| Validation | Zod                                                              |
| Auth       | JWT session (`jose`, httpOnly cookie) + `bcryptjs`; demo gate    |
| Email      | Pluggable: SMTP (e.g. Gmail) or Resend (HTTPS); console in dev   |
| Storage    | Pluggable `StorageService` — local disk / Railway volume (or S3) |
| Tests      | Vitest (unit + integration) and Playwright (E2E)                 |
| Deploy     | Railway (Postgres + a volume for resume files)                   |

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
#    configure SMTP or Resend (see "Email" below); otherwise emails are just
#    printed to the server console.

# 3. Start Postgres
docker compose up -d
#    (No Docker? Point DATABASE_URL at any Postgres instance instead.)

# 4. Apply the schema and seed an attorney account
npm run db:migrate     # applies migrations
npm run db:seed        # creates attorney@alma.test / password123

# 5. Start the app
npm run dev            # http://localhost:3000
```

Open <http://localhost:3000>, enter any email on the **demo start screen**, then
use **Submit a lead** and **Dashboard**. (The `db:seed` step above is optional
locally — the demo gate provisions a session for whatever email you enter — but
it is what seeds the attorney account on Railway deploys.)

## How to use

Full walkthrough: [`docs/USAGE.md`](./docs/USAGE.md). In short:

**Start (demo gate).** Open the app → on the **"Demo project"** start screen enter
an email → **Enter demo**. You're signed in as an attorney with that email (shown
bottom-right). Refreshing the page returns you to the start screen.

**As a prospect — submit a lead** (`/leads/new`): enter name + email, upload a
resume (PDF/DOC/DOCX, ≤5 MB), submit. A confirmation email goes to the prospect
and a notification goes to the attorney (the demo email).

> 📩 The attorney notification can land in **spam** — check your junk folder.

**As an attorney — manage leads** (`/dashboard`): see all leads with resume
downloads, filter by All / Pending / Reached out, and click **Mark reached out**
to move a `PENDING` lead to `REACHED_OUT` (one-way; it records who and when).

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

## Email

On a new lead, two emails are sent — best-effort and fire-and-forget, so the
public form never blocks on delivery: a **confirmation to the prospect** (the
address they submitted) and a **notification to the attorney**
(`ATTORNEY_NOTIFY_EMAIL`). The provider is auto-selected:

1. **SMTP** — set `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` (e.g.
   Gmail with an App Password). Sends _from your own address_ with no domain
   setup.
2. **Resend** — set `RESEND_API_KEY` (HTTPS API). To send from your own address,
   verify a domain in Resend and point `EMAIL_FROM` at it
   (e.g. `Alma Leads <leads@yourdomain.com>`).
3. **Console** — neither configured: emails are logged, not sent (local-dev
   default).

> **On Railway, outbound SMTP is blocked**, so use **Resend** there (it's HTTPS).
> Gmail/SMTP is best for local development or hosts that allow SMTP egress.

## Deployment (Railway)

A full walkthrough lives in [`DESIGN.md`](./DESIGN.md#10-deployment-railway). In
short: provision a Postgres plugin, attach a volume mounted at
`STORAGE_LOCAL_DIR`, set the environment variables from `.env.example` (use
**Resend** for email — SMTP is blocked on Railway), and deploy. `railway.json`
builds with `npm run build`, and its pre-deploy step runs
`prisma migrate deploy` + `npm run db:seed` so migrations are applied and the
attorney account exists on first boot.
