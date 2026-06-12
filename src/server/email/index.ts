import { env } from "@/server/config/env";
import { EmailService } from "@/server/email/email.service";
import type { EmailProvider } from "@/server/email/email.service";
import { ConsoleEmailProvider } from "@/server/email/providers/console.provider";
import { ResendEmailProvider } from "@/server/email/providers/resend.provider";

/**
 * Wires the email service with a provider chosen from configuration: Resend
 * when an API key is present, otherwise a console transport for local dev.
 */
function createEmailProvider(): EmailProvider {
  if (env.RESEND_API_KEY) {
    return new ResendEmailProvider(env.RESEND_API_KEY);
  }
  return new ConsoleEmailProvider();
}

export const emailService = new EmailService(createEmailProvider(), {
  from: env.EMAIL_FROM,
  attorneyEmail: env.ATTORNEY_NOTIFY_EMAIL,
  appUrl: env.NEXT_PUBLIC_APP_URL,
});

export { EmailService } from "@/server/email/email.service";
