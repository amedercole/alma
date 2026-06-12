import { Resend } from "resend";
import type { EmailMessage, EmailProvider } from "@/server/email/email.service";

/** Sends email via the Resend API. */
export class ResendEmailProvider implements EmailProvider {
  private readonly client: Resend;

  constructor(apiKey: string) {
    this.client = new Resend(apiKey);
  }

  async send(message: EmailMessage & { from: string }): Promise<void> {
    // The Resend SDK returns `{ data, error }` rather than throwing on API
    // errors, so we surface the error explicitly.
    const { error } = await this.client.emails.send({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });

    if (error) {
      throw new Error(`Resend failed to send email: ${error.message}`);
    }
  }
}
