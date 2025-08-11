import { Resend } from 'resend';
import sgMail from '@sendgrid/mail';

type SendArgs = { to: string; subject: string; html: string; text?: string };

export interface EmailClient {
  send(args: SendArgs): Promise<void>;
}

class ResendClient implements EmailClient {
  private resend: Resend;
  private from: string;
  constructor(apiKey: string, from: string) {
    this.resend = new Resend(apiKey);
    this.from = from;
  }
  async send({ to, subject, html, text }: SendArgs): Promise<void> {
    await this.resend.emails.send({ from: this.from, to, subject, html, text });
  }
}

class SendGridClient implements EmailClient {
  private from: string;
  constructor(apiKey: string, from: string) {
    sgMail.setApiKey(apiKey);
    this.from = from;
  }
  async send({ to, subject, html, text }: SendArgs): Promise<void> {
    await sgMail.send({ to, from: this.from, subject, html, text });
  }
}

export function createEmailClient(): EmailClient {
  const provider = process.env.EMAIL_PROVIDER || 'resend'; // 'resend' | 'sendgrid'

  if (provider === 'sendgrid') {
    const apiKey = process.env.SENDGRID_API_KEY;
    const from = process.env.EMAIL_FROM || 'no-reply@example.com';
    if (!apiKey) throw new Error('SENDGRID_API_KEY is required for SendGrid provider');
    return new SendGridClient(apiKey, from);
  }

  // default to Resend
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  if (!apiKey) throw new Error('RESEND_API_KEY is required for Resend provider');
  return new ResendClient(apiKey, from);
}


