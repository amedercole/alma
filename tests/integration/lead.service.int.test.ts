import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ConflictError } from "@/lib/errors";
import { prisma } from "@/server/db/client";
import { EmailService } from "@/server/email/email.service";
import type { EmailProvider } from "@/server/email/email.service";
import { leadRepository } from "@/server/leads/lead.repository";
import { LeadService } from "@/server/leads/lead.service";
import { LocalStorageProvider } from "@/server/storage/providers/local.provider";

/**
 * Integration test: the real Prisma repository + real on-disk storage against a
 * live Postgres. Requires DATABASE_URL to point at a reachable database
 * (docker compose locally; a service container in CI).
 */
class NoopEmailProvider implements EmailProvider {
  async send(): Promise<void> {}
}

let service: LeadService;
let storageDir: string;
let attorneyId: string;

beforeAll(async () => {
  storageDir = await mkdtemp(path.join(tmpdir(), "alma-storage-"));
  const email = new EmailService(new NoopEmailProvider(), {
    from: "Alma <noreply@alma.test>",
    attorneyEmail: "attorney@alma.test",
    appUrl: "http://localhost:3000",
  });
  service = new LeadService({
    repo: leadRepository,
    storage: new LocalStorageProvider(storageDir),
    email,
  });

  const attorney = await prisma.user.create({
    data: {
      email: `it-attorney-${Date.now()}@alma.test`,
      name: "IT Attorney",
      passwordHash: "x",
      role: "ATTORNEY",
    },
  });
  attorneyId = attorney.id;
});

beforeEach(async () => {
  await prisma.lead.deleteMany();
});

afterAll(async () => {
  await prisma.lead.deleteMany();
  await prisma.user.delete({ where: { id: attorneyId } });
  await rm(storageDir, { recursive: true, force: true });
  await prisma.$disconnect();
});

function resume(content = "integration resume") {
  return new File([content], "cv.pdf", { type: "application/pdf" });
}

describe("LeadService (integration)", () => {
  it("persists a lead and its resume, then reads both back", async () => {
    const created = await service.createLead({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      resume: resume("grace-cv"),
    });

    const row = await prisma.lead.findUnique({ where: { id: created.id } });
    expect(row?.email).toBe("grace@example.com");
    expect(row?.state).toBe("PENDING");

    const { data } = await service.getResume(created.id);
    expect(new TextDecoder().decode(data)).toBe("grace-cv");
  });

  it("transitions a lead to REACHED_OUT and persists the audit fields", async () => {
    const created = await service.createLead({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      resume: resume(),
    });

    await service.markReachedOut(created.id, attorneyId);

    const row = await prisma.lead.findUnique({ where: { id: created.id } });
    expect(row?.state).toBe("REACHED_OUT");
    expect(row?.reachedOutById).toBe(attorneyId);
    expect(row?.reachedOutAt).toBeInstanceOf(Date);
  });

  it("rejects a second transition with a ConflictError", async () => {
    const created = await service.createLead({
      firstName: "Grace",
      lastName: "Hopper",
      email: "grace@example.com",
      resume: resume(),
    });
    await service.markReachedOut(created.id, attorneyId);
    await expect(
      service.markReachedOut(created.id, attorneyId),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("lists and filters leads by state", async () => {
    const a = await service.createLead({
      firstName: "A",
      lastName: "One",
      email: "a@example.com",
      resume: resume(),
    });
    await service.createLead({
      firstName: "B",
      lastName: "Two",
      email: "b@example.com",
      resume: resume(),
    });
    await service.markReachedOut(a.id, attorneyId);

    expect(await service.listLeads({})).toHaveLength(2);
    expect(await service.listLeads({ state: "PENDING" })).toHaveLength(1);
    expect(await service.listLeads({ state: "REACHED_OUT" })).toHaveLength(1);
  });
});
