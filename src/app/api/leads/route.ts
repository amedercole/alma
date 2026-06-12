import type { NextRequest } from "next/server";
import { errorToResponse } from "@/lib/errors";
import { requireSession } from "@/server/auth/dal";
import {
  createLeadSchema,
  listLeadsQuerySchema,
} from "@/server/leads/lead.schema";
import { leadService } from "@/server/leads/lead.service";
import { toLeadDTO } from "@/server/leads/lead.types";

/**
 * POST /api/leads — PUBLIC.
 * Accepts multipart/form-data (firstName, lastName, email, resume) from the
 * public form, creates the lead, and triggers the notification emails.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const input = createLeadSchema.parse({
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      resume: formData.get("resume"),
    });
    const lead = await leadService.createLead(input);
    return Response.json(toLeadDTO(lead), { status: 201 });
  } catch (error) {
    return errorToResponse(error);
  }
}

/**
 * GET /api/leads — AUTH.
 * Lists leads for the dashboard, optionally filtered by `?state=`.
 */
export async function GET(request: NextRequest) {
  try {
    await requireSession();
    const query = listLeadsQuerySchema.parse({
      state: request.nextUrl.searchParams.get("state") ?? undefined,
    });
    const leads = await leadService.listLeads(query);
    return Response.json({ leads: leads.map(toLeadDTO) });
  } catch (error) {
    return errorToResponse(error);
  }
}
