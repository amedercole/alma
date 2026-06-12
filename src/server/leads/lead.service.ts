import { LeadState, type Lead } from "@/generated/prisma/client";
import { NotFoundError } from "@/lib/errors";
import { emailService } from "@/server/email";
import { EmailService } from "@/server/email/email.service";
import {
  leadRepository,
  type LeadRepository,
} from "@/server/leads/lead.repository";
import type { CreateLeadInput } from "@/server/leads/lead.schema";
import { assertTransition } from "@/server/leads/lead.state";
import { storage, type StorageService } from "@/server/storage";

export interface LeadServiceDeps {
  repo: LeadRepository;
  storage: StorageService;
  email: EmailService;
}

/**
 * Orchestrates lead use-cases: persisting the resume, creating the record,
 * triggering notification emails, and enforcing state transitions. Dependencies
 * are injected so the service can be unit-tested with fakes.
 */
export class LeadService {
  constructor(private readonly deps: LeadServiceDeps) {}

  /**
   * Creates a lead from validated form input: stores the resume, persists the
   * record, then fires the prospect + attorney emails (best-effort).
   */
  async createLead(input: CreateLeadInput): Promise<Lead> {
    const { resume, firstName, lastName, email } = input;

    const bytes = new Uint8Array(await resume.arrayBuffer());
    const { key } = await this.deps.storage.save({
      data: bytes,
      filename: resume.name,
      contentType: resume.type,
    });

    const lead = await this.deps.repo.create({
      firstName,
      lastName,
      email,
      resumeKey: key,
      resumeFilename: resume.name,
      resumeMimeType: resume.type,
      resumeSize: resume.size,
    });

    await this.deps.email.sendLeadCreatedEmails(lead);

    return lead;
  }

  listLeads(filter: { state?: LeadState } = {}): Promise<Lead[]> {
    return this.deps.repo.findMany(filter);
  }

  async getLead(id: string): Promise<Lead> {
    const lead = await this.deps.repo.findById(id);
    if (!lead) {
      throw new NotFoundError("Lead not found");
    }
    return lead;
  }

  /** Reads the stored resume bytes for a lead. */
  async getResume(id: string): Promise<{ data: Uint8Array; lead: Lead }> {
    const lead = await this.getLead(id);
    const data = await this.deps.storage.read(lead.resumeKey);
    return { data, lead };
  }

  /**
   * Transitions a lead to REACHED_OUT, recording who reached out and when.
   * Rejects invalid transitions (e.g. an already-reached-out lead) via the
   * state machine (409).
   */
  async markReachedOut(id: string, attorneyUserId: string): Promise<Lead> {
    const lead = await this.getLead(id);
    assertTransition(lead.state, LeadState.REACHED_OUT);
    return this.deps.repo.update(id, {
      state: LeadState.REACHED_OUT,
      reachedOutAt: new Date(),
      reachedOutById: attorneyUserId,
    });
  }
}

/** Default instance wired with the real repository, storage, and email. */
export const leadService = new LeadService({
  repo: leadRepository,
  storage,
  email: emailService,
});
