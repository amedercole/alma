# Coding-agent usage — writeup

**Tools.** I built this end to end through **Claude Code** (an agentic CLI),
driving file edits, shell, Prisma migrations, a live Postgres, the dev server,
`curl`, and the test runner from one place — plus reading the libraries' own
installed docs when their versions were newer than the model's knowledge.

**What I delegated vs. wrote myself.** I treated the agent as a fast, literal
implementer and kept the judgment for myself. I owned the **direction**: the
requirements interpretation; the stack (Next.js 16 + Prisma 7 + Railway); the
layered architecture (route → service → repository with dependency injection);
the `PENDING → REACHED_OUT` state-machine rule; the **provider abstractions** for
storage and email; the demo-mode UX; and a review gate between every phase. I
delegated the **writing** of nearly everything else — scaffolding,
schema/migrations, the service/auth/route layers, the React UI, 38
unit/integration/E2E tests, and CI — and reviewed each phase before moving on.
The leverage isn't in typing; it's in specifying tightly and then
**verifying hard**.

**Verification over trust.** Because the installed Next.js (16) and Prisma (7)
have breaking changes vs. the model's training data, I made the agent **read the
bundled docs and prove behavior empirically** instead of recalling it: it ran
`prisma generate`/`migrate` against a real database, exercised every endpoint
with `curl`, and ran the full suite — and at one point diagnosed a production bug
straight from the Railway deploy logs.

**A subtly-bad output I caught.** To avoid leaking which emails exist, the login
service compares a password even when the user isn't found. The agent's first
version compared against a **hand-written fake string** (`"$2a$10$invalid…"`) —
which isn't a valid bcrypt hash. `bcrypt.compare` can _throw_ on a malformed
hash, which would turn the intended **401 into a 500** and reintroduce the very
user-enumeration signal the code was trying to remove. I caught it by reasoning
about bcrypt's behavior on bad input, fixed it with a precomputed _real_ dummy
hash, and added an integration test pinning the unknown-email path to 401.

Four more catches are logged in [`../../NOTES.md`](../../NOTES.md) — a Prisma-7
connection misstep, a `postinstall` env crash, a Vitest path-alias bug, and an
email send that blocked the form's response — each surfaced by **running the
thing**, not eyeballing it. Representative excerpts:
[`transcripts.md`](./transcripts.md).
