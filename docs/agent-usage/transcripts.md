# Representative session excerpts

Lightly edited excerpts that show _how_ the agent was used: tight specs, reading
the installed library docs, and empirical verification over recalled knowledge.
Full attribution and the bug log are in [`../../NOTES.md`](../../NOTES.md).

---

## 1. Pinning down requirements before any code

> **Human:** for this product create a detailed plan and also I will use railway
> to persist the data.

The agent asked three scoping questions (stack, file storage, email provider)
with a recommendation for each, then produced a phase-by-phase plan. Decisions:
**Next.js full-stack TS**, a **storage abstraction defaulting to a Railway
volume**, and **Resend**.

---

## 2. Treating "new Next.js / Prisma" as unknown, not remembered

The scaffold's `AGENTS.md` warned that Next.js 16 has breaking changes. Rather
than assume, the agent read the _installed_ docs and pulled out the deltas:

> Middleware is now `proxy.ts`; route-handler `params` are async via
> `RouteContext<'/path/[id]'>`; `cookies()`/`headers()` are async; the auth
> boundary should be a DAL checked next to the data, with `proxy.ts` only doing
> optimistic redirects.

For Prisma it verified the v7 setup **empirically** instead of writing the
Prisma 5/6 pattern from memory:

```text
$ npx prisma generate   # against a scratch schema with `url` in the datasource
error: The datasource property `url` is no longer supported in schema files.
       Move connection URLs ... pass `adapter` ... to the PrismaClient constructor.
```

→ Connection moved to `prisma.config.ts`; client instantiated with
`new PrismaPg({ connectionString })`; new `prisma-client` generator output.

---

## 3. Catching its own subtly-bad output

Building robustness for fresh deploys:

> **Human (implied by the task):** make `postinstall`/CI builds safe.
>
> **Agent:** Prisma's `env("DATABASE_URL")` helper in `prisma.config.ts` throws
> at config-load when the var is missing, which would break `prisma generate`
> during a fresh install. Tested with `DATABASE_URL` unset, then switched to
> `process.env.DATABASE_URL` so generation (which never connects) succeeds while
> connecting commands still error clearly.

And the login timing bug (see [`writeup.md`](./writeup.md)): a hand-written fake
bcrypt hash that `bcrypt.compare` could choke on → replaced with a precomputed
real dummy hash; verified the unknown-email path returns **401**.

---

## 4. Verifying end-to-end instead of declaring done

After building the API, the agent ran the real server and exercised every
endpoint:

```text
1) POST /api/leads (multipart)         -> 201 + lead JSON; both emails logged; file persisted
2) GET  /api/leads (no auth)           -> 401
3) POST /api/auth/login                -> 200 + Set-Cookie
4) GET  /api/leads (auth)              -> list
5) PATCH /api/leads/:id REACHED_OUT    -> 200 (audit fields set)
6) PATCH again                         -> 409 (state machine)
7) GET  /api/leads/:id/resume          -> 200 + correct headers
8) POST /api/leads (missing file)      -> 400 (field error)
```

Then `vitest`: **37 passing** unit + integration tests against live Postgres.

---

## 5. A config bug surfaced by actually running the tests

The first Vitest run failed with `Cannot find package '@/...'`. Diagnosis: the
`vite-tsconfig-paths` plugin skips files outside the tsconfig `include`, and
`tests/` had been excluded to keep the Next build focused. Fixed by configuring
an explicit `resolve.alias` in `vitest.config.ts`.
