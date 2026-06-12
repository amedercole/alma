import type { Lead, LeadState } from "@/generated/prisma/client";
import { prisma } from "@/server/db/client";

export interface CreateLeadData {
  firstName: string;
  lastName: string;
  email: string;
  resumeKey: string;
  resumeFilename: string;
  resumeMimeType: string;
  resumeSize: number;
}

export interface UpdateLeadData {
  state?: LeadState;
  reachedOutAt?: Date | null;
  reachedOutById?: string | null;
}

/**
 * Data-access boundary for leads. Defined as an interface so the service can be
 * unit-tested with an in-memory fake, and implemented with Prisma for runtime.
 */
export interface LeadRepository {
  create(data: CreateLeadData): Promise<Lead>;
  findMany(filter: { state?: LeadState }): Promise<Lead[]>;
  findById(id: string): Promise<Lead | null>;
  update(id: string, data: UpdateLeadData): Promise<Lead>;
}

export const leadRepository: LeadRepository = {
  create(data) {
    return prisma.lead.create({ data });
  },

  findMany(filter) {
    return prisma.lead.findMany({
      where: filter.state ? { state: filter.state } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  findById(id) {
    return prisma.lead.findUnique({ where: { id } });
  },

  update(id, data) {
    return prisma.lead.update({ where: { id }, data });
  },
};
