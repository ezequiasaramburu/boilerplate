import { render } from '@react-email/render';
import React from 'react';

type TemplateName =
  | 'subscription-created'
  | 'payment-succeeded'
  | 'payment-failed'
  | 'invoice-status-changed'
  | 'usage-alert'
  | 'password-reset'
  | 'verify-email'
  | 'admin-notification';

export async function renderEmailTemplate(
  template: TemplateName,
  data: Record<string, any>,
): Promise<{ html: string; text?: string }> {
  const component = resolveTemplate(template, data);
  const html = render(component);
  // Optionally add text generation here
  return { html };
}

function resolveTemplate(template: TemplateName, data: Record<string, any>): React.ReactElement {
  const map: Record<TemplateName, (d: Record<string, any>) => React.ReactElement> = {
    'password-reset': renderPasswordReset,
    'verify-email': renderVerifyEmail,
    'subscription-created': renderSubscriptionCreated,
    'payment-succeeded': renderPaymentSucceeded,
    'payment-failed': renderPaymentFailed,
    'invoice-status-changed': renderInvoiceStatusChanged,
    'usage-alert': renderUsageAlert,
    'admin-notification': renderAdminNotification,
  };
  const renderer = map[template] || renderDefault;
  return renderer(data);
}

function renderPasswordReset(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Reset your password">
      <p>Hi {data.name},</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p>
        <a href={data.resetUrl}>Reset Password</a>
      </p>
    </BaseEmail>
  );
}

function renderVerifyEmail(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Verify your email">
      <p>Hi {data.name},</p>
      <p>Please verify your email by clicking the link below.</p>
      <p>
        <a href={data.verifyUrl}>Verify Email</a>
      </p>
    </BaseEmail>
  );
}

function renderSubscriptionCreated(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Welcome!">
      <p>Thanks for subscribing to {data.planName}.</p>
    </BaseEmail>
  );
}

function renderPaymentSucceeded(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Payment Confirmed">
      <p>Your payment of {data.amount} succeeded.</p>
    </BaseEmail>
  );
}

function renderPaymentFailed(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Payment Failed">
      <p>Your recent payment failed. Please update your payment method.</p>
      <p>
        <a href={data.updatePaymentUrl}>Update payment method</a>
      </p>
    </BaseEmail>
  );
}

function renderInvoiceStatusChanged(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Invoice Update">
      <p>
        Invoice {data.invoiceNumber} status changed to {data.status}.
      </p>
      <p>
        <a href={data.invoiceUrl}>View invoice</a>
      </p>
    </BaseEmail>
  );
}

function renderUsageAlert(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Usage Alert">
      <p>
        {data.metricType} usage at {data.percentage}%.
      </p>
      <p>
        Current: {data.currentUsage} / Limit: {data.limitAmount}
      </p>
    </BaseEmail>
  );
}

function renderAdminNotification(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title={data.event || 'Notification'}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </BaseEmail>
  );
}

function renderDefault(data: Record<string, any>): React.ReactElement {
  return (
    <BaseEmail title="Notification">
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </BaseEmail>
  );
}

function BaseEmail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <title>{title}</title>
      </head>
      <body
        style={{
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          color: '#111',
          lineHeight: 1.6,
        }}
      >
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation">
          <tbody>
            <tr>
              <td align="center">
                <table
                  width="600"
                  role="presentation"
                  style={{ padding: '24px', border: '1px solid #eee', borderRadius: '8px' }}
                >
                  <tbody>
                    <tr>
                      <td>
                        <h1 style={{ marginTop: 0 }}>{title}</h1>
                        {children}
                        <hr
                          style={{ border: 'none', borderTop: '1px solid #eee', margin: '24px 0' }}
                        />
                        <p style={{ color: '#666', fontSize: '12px' }}>
                          If you didn’t request this, you can safely ignore this email.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}
