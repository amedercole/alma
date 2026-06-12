# Coding-agent usage & attribution

This project was built as a take-home exercise with **heavy, deliberate use of a
coding agent** (Claude Code). This file is the running record required by the
submission guidance: which tools were used, what was delegated vs. written by
hand, and at least one case where the agent produced wrong/subtly-bad code and
how it was caught and fixed.

## Tools

- **Claude Code** (agentic CLI) — primary driver for scaffolding, implementation,
  running migrations/tests, and docs.

## Attribution model

- **Agent-generated** code/docs are the default and are marked in commit messages
  with a `[agent]` tag.
- **Human-authored / human-directed decisions** (architecture, tech-stack choices,
  state-machine rules, the review gates between phases) are marked `[human]` or
  called out in the commit body.
- Commits are organized by phase so the history reads as a build log.

## What was delegated vs. hand-written

- **Delegated to the agent:** boilerplate, Prisma schema/migrations, the service/
  repository/route layers, React components, tests, and config — then reviewed.
- **Human-owned:** the requirements interpretation, the tech-stack decision
  (Next.js + Prisma 7 + Railway), the storage abstraction approach, and the
  per-phase acceptance review.

## Bugs the agent caught in its own output

> A short log of subtly-bad output and the fix. (Expanded as the build proceeds.)

1. **Prisma 7 connection setup.** The agent's first instinct (from older Prisma
   knowledge) was the Prisma 5/6 pattern: `url` in the `datasource` block and
   `import { PrismaClient } from "@prisma/client"`. Prisma **7** rejects `url`
   in the schema and requires a **driver adapter**. Caught by actually running
   `prisma generate`/`migrate` against the installed v7 instead of trusting
   memory; fixed by moving the URL to `prisma.config.ts` and instantiating
   `PrismaClient` with `new PrismaPg({ connectionString })`.
2. **`postinstall` build robustness.** Using Prisma's `env("DATABASE_URL")`
   helper in `prisma.config.ts` made `prisma generate` throw when the variable
   wasn't injected yet (fresh CI/Railway install). Caught by testing
   `prisma generate` with `DATABASE_URL` unset; fixed by reading
   `process.env.DATABASE_URL` directly so generation (which never connects)
   succeeds while connecting commands still error clearly.
3. **Login timing-equalization bug (Phase 3).** To avoid leaking which emails
   exist, the login service compares the password even when no user is found.
   The agent's first version compared against a hand-written fake string
   (`"$2a$10$invalid…"`), which is not a valid bcrypt hash — `bcrypt.compare`
   can error on a malformed hash, which would surface as a 500 instead of the
   intended 401. Fixed by precomputing a real dummy hash with
   `bcrypt.hashSync(...)` at module load. Verified the unknown-email path
   returns 401 via the end-to-end smoke test.
4. **Vitest `@/` alias not resolving (Phase 6).** The first test setup used the
   `vite-tsconfig-paths` plugin, but the suite failed with "Cannot find package
   '@/...'". Root cause: the plugin only applies path mappings to files within
   the tsconfig `include`, and `tests/` had been deliberately excluded (to keep
   the Next/tsc build focused). Caught on the first `vitest run`; fixed by
   configuring an explicit `resolve.alias` in `vitest.config.ts` instead of
   depending on tsconfig — independent of the include/exclude set.
5. **Lead submit blocked on email (caught from prod logs).** `createLead`
   `await`ed `sendLeadCreatedEmails` before responding. Emails were already
   best-effort (errors caught), but _awaiting_ a slow/failing send still blocked
   the HTTP response — on Railway, where outbound SMTP is blocked, the form hung
   on "Submitting…" for the full SMTP timeout while the lead was already saved.
   Caught by reading the Railway deploy logs (`ETIMEDOUT`/`ENETUNREACH :587`).
   Fixed by dispatching the emails fire-and-forget (the long-running server
   finishes them after responding) and adding fail-fast SMTP timeouts.

## Session transcripts

Representative prompt logs / session excerpts live in
[`docs/agent-usage/`](./docs/agent-usage/).
