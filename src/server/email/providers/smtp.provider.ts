import nodemailer, { type Transporter } from "nodemailer";
import type { EmailMessage, EmailProvider } from "@/server/email/email.service";

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

/**
 * Sends email through any SMTP server (e.g. Gmail with an App Password). This
 * lets mail be sent *from your own address* without verifying a domain — the
 * message is authenticated as the SMTP user and delivered by their provider.
 */
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;

  constructor(config: SmtpConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: config.user, pass: config.pass },
    });
  }

  async send(message: EmailMessage & { from: string }): Promise<void> {
    await this.transporter.sendMail({
      from: message.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
