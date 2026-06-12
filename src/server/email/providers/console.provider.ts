import type { EmailMessage, EmailProvider } from "@/server/email/email.service";

/**
 * Logs emails to the server console instead of sending them. Used when no
 * RESEND_API_KEY is configured so the app is fully runnable locally without
 * email credentials.
 */
export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage & { from: string }): Promise<void> {
    console.info(
      [
        "📧 [console email] (no RESEND_API_KEY set — not actually sent)",
        `   from:    ${message.from}`,
        `   to:      ${message.to}`,
        `   subject: ${message.subject}`,
      ].join("\n"),
    );
  }
}
