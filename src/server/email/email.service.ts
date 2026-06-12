import { prospectConfirmationTemplate } from "@/server/email/templates/prospect";
import { attorneyNotificationTemplate } from "@/server/email/templates/attorney";

/** A renderable email message. `from` is supplied by the service. */
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/** Pluggable transport (Resend in prod, console in dev/test). */
export interface EmailProvider {
  send(message: EmailMessage & { from: string }): Promise<void>;
}

export interface EmailServiceConfig {
  from: string;
  attorneyEmail: string;
  appUrl: string;
}

/** Minimal lead shape needed to render notification emails. */
export interface LeadEmailContext {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

/**
 * Builds and dispatches the two emails triggered on lead submission:
 * a confirmation to the prospect and a notification to the attorney.
 */
export class EmailService {
  constructor(
    private readonly provider: EmailProvider,
    private readonly config: EmailServiceConfig,
  ) {}

  private async send(message: EmailMessage): Promise<void> {
    await this.provider.send({ ...message, from: this.config.from });
  }

  async sendProspectConfirmation(lead: LeadEmailContext): Promise<void> {
    const tpl = prospectConfirmationTemplate(lead);
    await this.send({ to: lead.email, ...tpl });
  }

  async sendAttorneyNotification(
    lead: LeadEmailContext,
    attorneyEmailOverride?: string,
  ): Promise<void> {
    const tpl = attorneyNotificationTemplate(lead, this.config.appUrl);
    await this.send({
      to: attorneyEmailOverride ?? this.config.attorneyEmail,
      ...tpl,
    });
  }

  /**
   * Sends both emails for a new lead. Failures are isolated and logged rather
   * than thrown, so a transient email outage never loses a captured lead.
   * `attorneyEmail` overrides the configured notification recipient (used by
   * the demo, where notifications go to the signed-in attorney).
   * Returns whether each message was sent (useful for tests/observability).
   * A production system would move this to a durable outbox/queue (see DESIGN.md).
   */
  async sendLeadCreatedEmails(
    lead: LeadEmailContext,
    options?: { attorneyEmail?: string },
  ): Promise<{ prospect: boolean; attorney: boolean }> {
    const [prospect, attorney] = await Promise.allSettled([
      this.sendProspectConfirmation(lead),
      this.sendAttorneyNotification(lead, options?.attorneyEmail),
    ]);

    if (prospect.status === "rejected") {
      console.error("Failed to send prospect confirmation:", prospect.reason);
    }
    if (attorney.status === "rejected") {
      console.error("Failed to send attorney notification:", attorney.reason);
    }

    return {
      prospect: prospect.status === "fulfilled",
      attorney: attorney.status === "fulfilled",
    };
  }
}
