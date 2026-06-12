import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import type { Lead, LeadState } from "@/generated/prisma/client";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { EmailService } from "@/server/email/email.service";
import type { EmailMessage, EmailProvider } from "@/server/email/email.service";
import type {
  CreateLeadData,
  LeadRepository,
  UpdateLeadData,
} from "@/server/leads/lead.repository";
import { LeadService } from "@/server/leads/lead.service";
import type { StorageService } from "@/server/storage/storage.service";

class InMemoryLeadRepository implements LeadRepository {
  private leads: Lead[] = [];

  async create(data: CreateLeadData): Promise<Lead> {
    const now = new Date();
    const lead: Lead = {
      id: randomUUID(),
      ...data,
      state: "PENDING",
      createdAt: now,
      updatedAt: now,
      reachedOutAt: null,
      reachedOutById: null,
    };
    this.leads.push(lead);
    return lead;
  }

  async findMany(filter: { state?: LeadState }): Promise<Lead[]> {
    const list = filter.state
      ? this.leads.filter((l) => l.state === filter.state)
      : this.leads;
    return [...list].reverse();
  }

  async findById(id: string): Promise<Lead | null> {
    return this.leads.find((l) => l.id === id) ?? null;
  }

  async update(id: string, data: UpdateLeadData): Promise<Lead> {
    const lead = this.leads.find((l) => l.id === id);
    if (!lead) throw new Error("not found");
    Object.assign(lead, data, { updatedAt: new Date() });
    return lead;
  }
}

class InMemoryStorage implements StorageService {
  files = new Map<string, Uint8Array>();
  async save({ data }: { data: Uint8Array }) {
    const key = `${randomUUID()}.pdf`;
    this.files.set(key, data);
    return { key };
  }
  async read(key: string): Promise<Uint8Array> {
    const data = this.files.get(key);
    if (!data) throw new NotFoundError();
    return data;
  }
  async delete(key: string): Promise<void> {
    this.files.delete(key);
  }
}

class RecordingEmailProvider implements EmailProvider {
  sent: (EmailMessage & { from: string })[] = [];
  async send(message: EmailMessage & { from: string }): Promise<void> {
    this.sent.push(message);
  }
}

function makeResume(content = "resume bytes") {
  return new File([content], "resume.pdf", { type: "application/pdf" });
}

describe("LeadService", () => {
  let repo: InMemoryLeadRepository;
  let storage: InMemoryStorage;
  let emailProvider: RecordingEmailProvider;
  let service: LeadService;

  beforeEach(() => {
    repo = new InMemoryLeadRepository();
    storage = new InMemoryStorage();
    emailProvider = new RecordingEmailProvider();
    const email = new EmailService(emailProvider, {
      from: "Alma <noreply@alma.test>",
      attorneyEmail: "attorney@alma.test",
      appUrl: "http://localhost:3000",
    });
    service = new LeadService({ repo, storage, email });
  });

  it("creates a lead, stores the resume, and sends both emails", async () => {
    const lead = await service.createLead({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: makeResume(),
    });

    expect(lead.state).toBe("PENDING");
    expect(lead.resumeFilename).toBe("resume.pdf");
    expect(storage.files.size).toBe(1);

    expect(emailProvider.sent).toHaveLength(2);
    const recipients = emailProvider.sent.map((m) => m.to);
    expect(recipients).toContain("ada@example.com"); // prospect
    expect(recipients).toContain("attorney@alma.test"); // attorney
  });

  it("routes the attorney notification to the notifyEmail override", async () => {
    await service.createLead(
      {
        firstName: "Ada",
        lastName: "Lovelace",
        email: "ada@example.com",
        resume: makeResume(),
      },
      { notifyEmail: "manager@company.com" },
    );

    const recipients = emailProvider.sent.map((m) => m.to);
    expect(recipients).toContain("ada@example.com"); // prospect unchanged
    expect(recipients).toContain("manager@company.com"); // override
    expect(recipients).not.toContain("attorney@alma.test");
  });

  it("throws NotFoundError for a missing lead", async () => {
    await expect(service.getLead("does-not-exist")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("marks a lead reached out with audit fields", async () => {
    const lead = await service.createLead({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: makeResume(),
    });

    const updated = await service.markReachedOut(lead.id, "attorney-1");
    expect(updated.state).toBe("REACHED_OUT");
    expect(updated.reachedOutById).toBe("attorney-1");
    expect(updated.reachedOutAt).toBeInstanceOf(Date);
  });

  it("rejects marking an already reached-out lead (409)", async () => {
    const lead = await service.createLead({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: makeResume(),
    });
    await service.markReachedOut(lead.id, "attorney-1");
    await expect(
      service.markReachedOut(lead.id, "attorney-1"),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it("reads back the stored resume bytes", async () => {
    const lead = await service.createLead({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      resume: makeResume("hello-resume"),
    });
    const { data } = await service.getResume(lead.id);
    expect(new TextDecoder().decode(data)).toBe("hello-resume");
  });

  it("filters leads by state", async () => {
    const a = await service.createLead({
      firstName: "A",
      lastName: "One",
      email: "a@example.com",
      resume: makeResume(),
    });
    await service.createLead({
      firstName: "B",
      lastName: "Two",
      email: "b@example.com",
      resume: makeResume(),
    });
    await service.markReachedOut(a.id, "attorney-1");

    const pending = await service.listLeads({ state: "PENDING" });
    const reached = await service.listLeads({ state: "REACHED_OUT" });
    expect(pending).toHaveLength(1);
    expect(reached).toHaveLength(1);
    expect(reached[0].id).toBe(a.id);
  });
});
