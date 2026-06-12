import type { NextRequest } from "next/server";
import { errorToResponse } from "@/lib/errors";
import { requireSession } from "@/server/auth/dal";
import { leadService } from "@/server/leads/lead.service";

/**
 * GET /api/leads/[id]/resume — AUTH.
 * Streams back the stored resume/CV with the original filename and type.
 */
export async function GET(
  _request: NextRequest,
  ctx: RouteContext<"/api/leads/[id]/resume">,
) {
  try {
    await requireSession();
    const { id } = await ctx.params;
    const { data, lead } = await leadService.getResume(id);

    const asciiFallback = lead.resumeFilename.replace(/[^\x20-\x7e]/g, "_");
    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": lead.resumeMimeType,
        "Content-Length": String(lead.resumeSize),
        "Content-Disposition": `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(
          lead.resumeFilename,
        )}`,
      },
    });
  } catch (error) {
    return errorToResponse(error);
  }
}
