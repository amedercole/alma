# Coding-agent usage — writeup

**Tool.** The entire project was built with **Claude Code** (an agentic CLI)
driving file edits, shell, migrations, the dev server, and `curl`/test runs. I
(the human) owned the requirements interpretation, the stack decision, and a
review gate between each phase; the agent produced the code and verified it.

**Delegated vs. hand-written.** I delegated essentially all of the _writing_:
scaffolding, the Prisma schema/migrations, the layered server (service /
repository / state machine), the storage and email abstractions, the auth/DAL,
the route handlers, the React UI, the tests, and CI. I kept the _direction_ for
myself: choosing Next.js + Prisma 7 + Railway, insisting on a storage
abstraction and a lightweight JWT session (vs. a heavyweight auth library),
defining the state-machine rule, and accepting/redirecting each phase. The
division was deliberate — agents are fast and reliable at well-specified
implementation, so the leverage is in specifying tightly and then _verifying_,
not in typing.

**Verification, not vibes.** Because this Next.js (16) and Prisma (7) are newer
than the agent's training data, I had it read the _installed_ version's docs and
prove behavior empirically rather than trust memory: it ran `prisma generate`/
`migrate` against a live Postgres, exercised every endpoint with `curl`, and ran
37 unit/integration tests.

**A subtly-bad output it caught (and fixed).** Several are logged in
[`../../NOTES.md`](../../NOTES.md); the sharpest: the login service does a
password compare even when the email is unknown (to avoid leaking which emails
exist). The agent's first version compared against a _hand-written_ fake string
`"$2a$10$invalid…"`, which is **not a valid bcrypt hash** — `bcrypt.compare` can
throw on a malformed hash, turning the intended **401** into a **500** (and
ironically re-introducing an enumeration signal). It was caught by reasoning
about bcrypt's behavior on bad input and fixed by precomputing a _real_ dummy
hash with `bcrypt.hashSync(...)` at module load; the unknown-email path was then
confirmed to return 401 in both the smoke test and the integration tests.

See [`transcripts.md`](./transcripts.md) for representative session excerpts.
