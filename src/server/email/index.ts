import { env, isSmtpConfigured } from "@/server/config/env";
import { EmailService } from "@/server/email/email.service";
import type { EmailProvider } from "@/server/email/email.service";
import { ConsoleEmailProvider } from "@/server/email/providers/console.provider";
import { ResendEmailProvider } from "@/server/email/providers/resend.provider";
import { SmtpEmailProvider } from "@/server/email/providers/smtp.provider";

/**
 * Wires the email service with a provider chosen from configuration:
 *  1. SMTP (e.g. Gmail) when SMTP_HOST/USER/PASS are set — sends from your own
 *     address with no domain verification;
 *  2. else Resend when RESEND_API_KEY is set;
 *  3. else a console transport for local dev.
 */
function createEmailProvider(): EmailProvider {
  if (isSmtpConfigured) {
    return new SmtpEmailProvider({
      host: env.SMTP_HOST!,
      port: env.SMTP_PORT,
      user: env.SMTP_USER!,
      pass: env.SMTP_PASS!,
    });
  }
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
