import type { NextRequest } from "next/server";
import { LeadState } from "@/generated/prisma/client";
import { errorToResponse, ValidationError } from "@/lib/errors";
import { requireSession } from "@/server/auth/dal";
import { updateLeadSchema } from "@/server/leads/lead.schema";
import { leadService } from "@/server/leads/lead.service";
import { toLeadDTO } from "@/server/leads/lead.types";

/** GET /api/leads/[id] — AUTH. Fetch a single lead. */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/leads/[id]">,
) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const lead = await leadService.getLead(id);
    return Response.json(toLeadDTO(lead));
  } catch (error) {
    return errorToResponse(error);
  }
}

/**
 * PATCH /api/leads/[id] — AUTH.
 * Updates a lead's state. Only the PENDING -> REACHED_OUT transition is
 * supported; the state machine rejects anything else with a 409.
 */
export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/leads/[id]">,
) {
  try {
    const session = await requireSession();
    const { id } = await ctx.params;
    const { state } = updateLeadSchema.parse(await request.json());

    if (state !== LeadState.REACHED_OUT) {
      throw new ValidationError(
        "Only transitioning a lead to REACHED_OUT is supported",
      );
    }

    const lead = await leadService.markReachedOut(id, session.userId);
    return Response.json(toLeadDTO(lead));
  } catch (error) {
    return errorToResponse(error);
  }
}
