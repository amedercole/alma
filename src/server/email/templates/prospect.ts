import type { LeadEmailContext } from "@/server/email/email.service";
import { escapeHtml } from "@/server/email/templates/util";

/** Confirmation sent to the prospect after they submit the public form. */
export function prospectConfirmationTemplate(lead: LeadEmailContext) {
  const subject = "We received your application";
  const text = `Hi ${lead.firstName},

Thanks for submitting your information to Alma. We've received your application and one of our attorneys will review it and reach out to you soon.

— The Alma Team`;

  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
    <p>Hi ${escapeHtml(lead.firstName)},</p>
    <p>
      Thanks for submitting your information to <strong>Alma</strong>. We've
      received your application and one of our attorneys will review it and
      reach out to you soon.
    </p>
    <p>— The Alma Team</p>
  </body>
</html>`;

  return { subject, text, html };
}
