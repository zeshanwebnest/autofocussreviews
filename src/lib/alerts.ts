import { Client, Submission } from '@/types/app.types';
import { NotificationsRepository } from '@/lib/notifications-repository';
import { isEmailConfigured, sendEmail } from '@/lib/email';

export interface AlertResult {
  status: 'sent' | 'failed' | 'skipped';
  reason?: string;
  recipients?: string[];
  cc?: string[];
}

const TIME_ZONE = 'Asia/Kolkata';

function formatTimestamp(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: TIME_ZONE,
    }).format(new Date(iso)) + ' IST';
  } catch {
    return iso;
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Digits only, so the number is tap-to-call on a phone. */
function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 ? `+91${digits}` : `+${digits}`;
}

export function renderNegativeReviewEmail(params: {
  client: Client;
  submission: Submission;
  appUrl?: string;
}): { subject: string; html: string; text: string } {
  const { client, submission } = params;
  const when = formatTimestamp(submission.created_at);
  const stars = '★'.repeat(submission.rating) + '☆'.repeat(5 - submission.rating);
  const comment = submission.comment?.trim() || 'No comment left.';
  const accent = '#D62E6B';

  const subject = `Negative Review Alert – ${client.business_name}`;

  const rows: Array<[string, string]> = [
    ['Rating', `${stars}  (${submission.rating} out of 5)`],
    ['Customer', submission.name],
    ['Phone', submission.phone],
    ['Comment', comment],
    ['Shop', client.business_name],
    ['Shop ID', client.id],
    ['Submitted', when],
    ['Source', submission.source || 'qr'],
    ['Submission ID', submission.id],
  ];

  const text = [
    `NEGATIVE REVIEW ALERT — ${client.business_name}`,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    'This customer was shown a private service-recovery message and was not',
    'routed to Google. Contacting them quickly is the point of this alert.',
  ].join('\n');

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#F5F8FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B1220;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E6EAF2;border-radius:16px;overflow:hidden;">
    <tr>
      <td style="padding:20px 24px;background:${accent};">
        <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#FFFFFF;opacity:.85;">Negative review alert</div>
        <div style="font-size:21px;font-weight:800;color:#FFFFFF;margin-top:4px;">${escapeHtml(client.business_name)}</div>
      </td>
    </tr>
    <tr>
      <td style="padding:22px 24px 6px;">
        <div style="font-size:30px;line-height:1;color:${accent};letter-spacing:2px;">${stars}</div>
        <div style="font-size:13px;color:#5B6472;margin-top:6px;">${submission.rating} out of 5 &middot; threshold is ${client.alert_threshold} or below</div>
      </td>
    </tr>
    <tr>
      <td style="padding:14px 24px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;">
          ${rows
            .slice(1)
            .map(
              ([k, v], i) => `<tr${i % 2 ? ' style="background:#F5F8FF;"' : ''}>
            <td style="padding:10px 12px;color:#5B6472;font-weight:600;width:132px;vertical-align:top;border-bottom:1px solid #E6EAF2;">${escapeHtml(k)}</td>
            <td style="padding:10px 12px;color:#0B1220;vertical-align:top;border-bottom:1px solid #E6EAF2;">${
              k === 'Phone'
                ? `<a href="tel:${escapeHtml(telHref(v))}" style="color:#2563EB;text-decoration:none;font-weight:600;">${escapeHtml(v)}</a>`
                : escapeHtml(v)
            }</td>
          </tr>`
            )
            .join('')}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 26px;">
        <div style="background:#FFF1F5;border-radius:12px;padding:14px 16px;font-size:13px;line-height:1.6;color:#742A2A;">
          This customer saw a private service-recovery message and was <strong>not</strong> sent to Google.
          Reaching out quickly is what turns this into a recovered customer rather than a public one-star review.
        </div>
        <div style="margin-top:16px;font-size:11px;color:#8A93A3;">
          Sent automatically by Autofocuss Reviews. Change who receives these in the admin panel.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html, text };
}

/**
 * Sends the alert for one negative submission.
 *
 * Never throws: a mail problem must not fail the customer's feedback request.
 * Every outcome — sent, failed or skipped — is written to email_log, which is
 * also what prevents the same submission being alerted on twice.
 */
export async function dispatchNegativeReviewAlert(
  client: Client,
  submission: Submission
): Promise<AlertResult> {
  const base = { submission_id: submission.id, client_id: client.id };

  try {
    if (submission.rating > client.alert_threshold) {
      return { status: 'skipped', reason: 'Rating is above the alert threshold.' };
    }

    if (await NotificationsRepository.hasBeenAlerted(submission.id)) {
      return { status: 'skipped', reason: 'An alert was already sent for this submission.' };
    }

    const { to, cc, reason } = await NotificationsRepository.resolveRecipients(client.id);
    if (!to.length) {
      await NotificationsRepository.log({
        ...base,
        recipients: [],
        cc: [],
        subject: null,
        status: 'skipped',
        error: reason,
      });
      return { status: 'skipped', reason };
    }

    if (!isEmailConfigured()) {
      const why = 'RESEND_API_KEY is not set, so no email could be sent.';
      await NotificationsRepository.log({
        ...base,
        recipients: to,
        cc,
        subject: null,
        status: 'skipped',
        error: why,
      });
      return { status: 'skipped', reason: why, recipients: to, cc };
    }

    const { subject, html, text } = renderNegativeReviewEmail({ client, submission });
    const result = await sendEmail({
      to,
      cc,
      subject,
      html,
      text,
      replyTo: client.owner_email || null,
    });

    await NotificationsRepository.log({
      ...base,
      recipients: to,
      cc,
      subject,
      status: result.ok ? 'sent' : 'failed',
      provider_id: result.providerId ?? null,
      error: result.ok ? null : result.error,
    });

    if (!result.ok) {
      console.error('[Alerts] negative review email failed:', result.error);
      return { status: 'failed', reason: result.error, recipients: to, cc };
    }
    return { status: 'sent', recipients: to, cc };
  } catch (err: any) {
    const message = String(err?.message || err);
    console.error('[Alerts] unexpected error dispatching alert:', message);
    try {
      await NotificationsRepository.log({
        ...base,
        recipients: [],
        cc: [],
        subject: null,
        status: 'failed',
        error: message,
      });
    } catch {
      /* logging is best effort */
    }
    return { status: 'failed', reason: message };
  }
}

/** Used by the "Send test email" button in the settings panels. */
export async function sendTestAlertEmail(params: {
  to: string[];
  cc: string[];
  shopName: string;
  shopId: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  if (!isEmailConfigured()) {
    return { ok: false, error: 'RESEND_API_KEY is not set on the server.' };
  }
  if (!params.to.length) {
    return { ok: false, error: 'Set a recipient address before sending a test.' };
  }

  const subject = `Test – Negative Review Alerts (${params.shopName})`;
  const html = `<!doctype html><html><body style="margin:0;padding:24px;background:#F5F8FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B1220;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #E6EAF2;border-radius:16px;">
    <tr><td style="padding:24px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#0E9F76;">Configuration test</div>
      <h1 style="font-size:20px;margin:6px 0 10px;">Your alert emails are working.</h1>
      <p style="font-size:14px;line-height:1.6;color:#5B6472;margin:0 0 14px;">
        This is a test message for <strong>${escapeHtml(params.shopName)}</strong>${
          params.shopId ? ` (shop ID <code>${escapeHtml(params.shopId)}</code>)` : ''
        }. Real alerts are sent automatically whenever a customer leaves a rating at or below the shop's threshold.
      </p>
      <div style="font-size:12px;color:#8A93A3;">Recipients: ${escapeHtml(params.to.join(', '))}${
        params.cc.length ? ` &middot; CC: ${escapeHtml(params.cc.join(', '))}` : ''
      }</div>
    </td></tr>
  </table>
</body></html>`;

  const text = `Configuration test — your alert emails are working.\n\nShop: ${params.shopName}${
    params.shopId ? ` (${params.shopId})` : ''
  }\nRecipients: ${params.to.join(', ')}${params.cc.length ? `\nCC: ${params.cc.join(', ')}` : ''}`;

  const result = await sendEmail({ to: params.to, cc: params.cc, subject, html, text });
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
