# Representative session excerpts

Lightly edited excerpts showing _how_ the agent was directed: tight specs,
reading the installed library docs, empirical verification over recalled
knowledge, and catching its own mistakes. Full attribution and the complete bug
log are in [`../../NOTES.md`](../../NOTES.md).

---

## 1. Pin the requirements before any code

> **Me:** for this product create a detailed plan and also I will use railway to
> persist the data.

The agent asked three scoping questions (stack, file storage, email provider),
each with a recommendation, then produced a phase-by-phase plan. Decisions:
**Next.js full-stack TS**, a **storage abstraction** defaulting to a Railway
volume, and a **pluggable email provider**. Nothing was written until the shape
was agreed.

---

## 2. Treat "new framework" as unknown, not remembered

The scaffold shipped an `AGENTS.md` warning that Next.js 16 has breaking changes.
Instead of trusting training data, I had the agent read the _installed_ docs and
extract the deltas that actually mattered here:

> Middleware is now `proxy.ts`; route-handler `params` are async via
> `RouteContext<'/path/[id]'>`; `cookies()`/`headers()` are async; the auth
> boundary should be a **DAL checked next to the data**, with `proxy.ts` doing
> only optimistic redirects.

---

## 3. Verify the unfamiliar version empirically

Rather than write the Prisma 5/6 pattern from memory, the agent proved Prisma 7's
setup against the installed CLI before committing to it:

```text
$ npx prisma generate   # scratch schema with `url` in the datasource
error: The datasource property `url` is no longer supported in schema files.
       Move connection URLs ... pass `adapter` ... to the PrismaClient constructor.
```

→ connection moved to `prisma.config.ts`; client instantiated with
`new PrismaPg({ connectionString })`; the new `prisma-client` generator output.
A follow-up check (`prisma generate` with `DATABASE_URL` unset) caught that the
`env()` helper would crash a fresh CI/Railway install — fixed by reading
`process.env` directly.

---

## 4. Catch the agent's own subtly-bad code

> **Agent (self-review):** the login service compares a password even when the
> email is unknown, to avoid leaking which emails exist. My first version
> compared against a hand-written `"$2a$10$invalid…"` — that isn't a valid
> bcrypt hash, and `bcrypt.compare` can throw on a malformed hash, turning the
> 401 into a 500. Replacing it with a precomputed real dummy hash; adding a test
> that the unknown-email path returns 401.

---

## 5. Verify end to end, not by eyeballing

After building the API, the agent ran the real server and exercised every route:

```text
1) POST /api/leads (multipart)        -> 201 + both emails + file persisted
2) GET  /api/leads (no auth)          -> 401
3) POST /api/auth/login               -> 200 + Set-Cookie
4) PATCH /api/leads/:id REACHED_OUT   -> 200 (audit fields set)
5) PATCH again                        -> 409 (state machine)
6) GET  /api/leads/:id/resume         -> 200 + correct headers
7) POST /api/leads (missing file)     -> 400 (field error)
```

…then **38 passing** unit + integration tests against live Postgres, and a
green production build.

---

## 6. Debug production from the logs, not guesses

When the deployed form hung on "Submitting…", I handed the agent the Railway logs:

```text
Failed to send attorney notification: connect ENETUNREACH 2607:...:587  (ETIMEDOUT, CONN)
```

It diagnosed two things from that single line: **Railway blocks outbound SMTP**
(so Gmail can't work there — switch to Resend over HTTPS), _and_ the request was
**awaiting** the email before responding. Fix: dispatch email fire-and-forget so
a captured lead never waits on delivery, plus fail-fast SMTP timeouts — then
documented the Railway/SMTP gotcha in the README and `DESIGN.md`.

---

## 7. Iterate on product, not just code

> **Me:** make a start screen that says this is a demo project … add an email to
> be the attorney email … the only way this changes is if the page refreshes …
> so the hiring manager can see the platform actually works.

The agent restated the intent, confirmed the two real forks with a quick
question, then built a demo gate that provisions a **real session** (keeping the
"internal UI guarded by auth" requirement) while routing lead notifications to
the **signed-in attorney's email derived from the session** — verified live
(demo-login → session → notification to the entered email).
