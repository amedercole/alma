# Representative session excerpts

Lightly edited, representative excerpts from the build session. They show _how_
the agent was directed — tight specs up front, reading the installed libraries'
own docs instead of trusting training data, empirical verification at every step,
and using the agent's own runs and logs to catch and fix subtle bugs. Full
attribution and the complete bug log are in [`../../NOTES.md`](../../NOTES.md).

---

## 1. Lock the requirements before writing code

> **Me:** for this product create a detailed plan and also I will use railway to
> persist the data.

Rather than jump in, the agent surfaced the decisions that actually shape the
build and asked for a call on each — each with a recommendation attached:

- **Stack:** Next.js full-stack (TS) vs. FastAPI + React vs. Express + React
- **Resume storage:** a storage abstraction (disk/volume) vs. S3 vs. Postgres blob
- **Email:** SMTP vs. Resend vs. console

I chose Next.js full-stack, the storage abstraction (Railway-volume default), and
a pluggable email provider. Only then did it produce a phase-by-phase plan — and I
kept a review gate between every phase.

---

## 2. Treat a "new framework" as unknown, not remembered

The scaffold shipped an `AGENTS.md` warning that **Next.js 16** has breaking
changes vs. older versions. Instead of coding from memory, I had the agent read
the _installed_ docs and pull out only the deltas that mattered here:

> - Middleware is renamed **`proxy.ts`** (and is for _optimistic_ checks only)
> - Route-handler **`params` are async** — typed via `RouteContext<'/path/[id]'>`
> - **`cookies()` / `headers()` are async**
> - The real auth boundary is a **DAL checked next to the data**, not the proxy

Each of these shaped the implementation and would have been wrong from training
data.

---

## 3. Prove the unfamiliar version empirically

**Prisma 7** also differs from the 5/6 patterns the model "knows." Instead of
writing the old pattern, the agent tested the installed CLI on a scratch schema:

```text
$ npx prisma generate     # datasource with the old `url = env("DATABASE_URL")`
error: The datasource property `url` is no longer supported in schema files.
       Move connection URLs ... pass `adapter` ... to the PrismaClient constructor.
```

→ I had it move the connection into **`prisma.config.ts`**, instantiate the client
with the **`@prisma/adapter-pg`** driver adapter, and use the new `prisma-client`
generator. A second empirical check — running `prisma generate` with
`DATABASE_URL` unset — caught that the `env()` helper would **crash a fresh
CI/Railway install**, so we read `process.env` directly instead.

---

## 4. Architect for testing and swappability up front

I directed a deliberately layered structure rather than letting logic pile up in
route handlers:

> **route handler → service → repository**, with the **storage** and **email**
> backends behind interfaces, and the service taking its dependencies by
> injection.

That decision paid off twice later: I swapped the email backend (Resend ⇄ SMTP)
and changed the notification target without touching business logic, and the
`LeadService` unit tests run in-memory against fakes while the integration tests
exercise the _real_ Prisma repository and on-disk storage.

---

## 5. Catch the agent's own subtly-bad code _(the required example)_

To avoid leaking which emails exist, login compares a password even when the user
isn't found. The agent's first version did this:

> **Agent (first pass):** compare against a placeholder hash `"$2a$10$invalid…"`.

That string **isn't a valid bcrypt hash**, and `bcrypt.compare` can _throw_ on a
malformed hash — which would turn the intended **401 into a 500** and reintroduce
the exact user-enumeration timing signal the code was meant to remove. I caught it
by reasoning about bcrypt's behavior on bad input, replaced it with a
**precomputed real dummy hash**, and added an integration test pinning the
unknown-email path to **401**.

---

## 6. …and more, each caught by running it

- **`postinstall` crash:** Prisma's `env()` in the config file threw when
  `DATABASE_URL` wasn't injected yet on a fresh install → switched to
  `process.env` so generation (which never connects) always succeeds.
- **Vitest `@/` alias:** the `vite-tsconfig-paths` plugin skips files outside the
  tsconfig `include`, and `tests/` was excluded → added an explicit
  `resolve.alias`.
- **Email blocked the response:** `createLead` _awaited_ the email send →
  dispatch fire-and-forget so a captured lead never waits on delivery.

(Full list in [`../../NOTES.md`](../../NOTES.md).)

---

## 7. Verify end to end, not by eyeballing

After building the API, the agent booted the real server and exercised every
route with `curl`:

```text
1) POST /api/leads (multipart)        -> 201 + both emails logged + file persisted
2) GET  /api/leads (no auth)          -> 401
3) POST /api/auth/login               -> 200 + Set-Cookie
4) PATCH /api/leads/:id REACHED_OUT   -> 200  (reachedOutAt / reachedOutBy set)
5) PATCH again                        -> 409  (state machine enforced)
6) GET  /api/leads/:id/resume         -> 200 + correct content headers
7) POST /api/leads (missing file)     -> 400 + field-level error
```

…backed by **38** unit + integration tests against a live Postgres and a green
production build.

---

## 8. Debug production from the logs, not guesses

When the deployed form hung on "Submitting…", I handed the agent one line from the
Railway logs:

```text
Failed to send attorney notification: connect ENETUNREACH 2607:...:587 (ETIMEDOUT)
```

From that it diagnosed **two** issues: Railway **blocks outbound SMTP** (so Gmail
can't work there — switch to Resend over HTTPS), _and_ the request was **awaiting**
the email before responding. Fix: dispatch email fire-and-forget plus fail-fast
SMTP timeouts — then I had it document the Railway/SMTP gotcha in the README and
`DESIGN.md`.

---

## 9. Iterate on product, not just code

> **Me:** make a start screen that says this is a demo project … the email
> entered becomes the attorney … only resets on refresh … so the hiring manager
> can see the platform actually works.

The agent restated the intent, confirmed the two real forks with one question,
then built a demo gate that provisions a **real signed session** (keeping the
"internal UI guarded by auth" requirement intact) while routing notifications to
the **signed-in attorney's email, derived from the session** — verified live
(demo-login → session → notification to the entered address).

---

## 10. Drive CI to green from the Actions logs

The first CI runs were red. Reading the GitHub Actions logs showed both causes
were precise and fixable: `tsc` ran before Next generated its route types
(`Cannot find name 'RouteContext'`) → `typecheck` now runs `next typegen` first;
and a Playwright strict-mode selector clash plus a `page.goto` that reset the
in-memory demo session → an exact selector and in-app navigation. I verified the
typecheck fix from a clean tree before pushing.
