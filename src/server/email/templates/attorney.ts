import type { LeadEmailContext } from "@/server/email/email.service";
import { escapeHtml } from "@/server/email/templates/util";

/** Notification sent to the internal attorney when a new lead arrives. */
export function attorneyNotificationTemplate(
  lead: LeadEmailContext,
  appUrl: string,
) {
  const fullName = `${lead.firstName} ${lead.lastName}`;
  const dashboardUrl = `${appUrl.replace(/\/$/, "")}/dashboard`;
  const subject = `New lead: ${fullName}`;

  const text = `A new lead has been submitted.

Name:  ${fullName}
Email: ${lead.email}

Review it in the dashboard: ${dashboardUrl}`;

  const html = `<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
    <p>A new lead has been submitted.</p>
    <table cellpadding="0" cellspacing="0" style="margin: 12px 0;">
      <tr><td style="padding-right: 12px;"><strong>Name</strong></td><td>${escapeHtml(fullName)}</td></tr>
      <tr><td style="padding-right: 12px;"><strong>Email</strong></td><td>${escapeHtml(lead.email)}</td></tr>
    </table>
    <p><a href="${escapeHtml(dashboardUrl)}">Review it in the dashboard →</a></p>
  </body>
</html>`;

  return { subject, text, html };
}
