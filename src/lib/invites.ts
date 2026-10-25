import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';

/**
 * Shop-owner invitations.
 *
 * Supabase mints the one-time link; Resend delivers it. No password is ever
 * generated, shown, stored or emailed by us — the owner sets their own on the
 * page the link opens.
 */

export type InviteKind = 'invite' | 'recovery';

function appUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
  return raw.endsWith('/') ? raw.slice(0, -1) : raw;
}

function escapeHtml(v: string): string {
  return v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderInviteEmail(params: {
  kind: InviteKind;
  businessName: string;
  actionLink: string;
}): { subject: string; html: string; text: string } {
  const isNew = params.kind === 'invite';
  const subject = isNew
    ? `Your Autofocuss Reviews login for ${params.businessName}`
    : `Reset your Autofocuss Reviews password (${params.businessName})`;

  const heading = isNew ? 'Set up your dashboard login' : 'Reset your password';
  const blurb = isNew
    ? `You've been given access to the review dashboard for <strong>${escapeHtml(params.businessName)}</strong>. Choose a password to get started — you'll then be able to see your customer feedback, ratings and QR code.`
    : `A password reset was requested for your <strong>${escapeHtml(params.businessName)}</strong> dashboard login. If this wasn't you, you can safely ignore this email.`;

  const html = `<!doctype html>
<html>
<body style="margin:0;padding:24px;background:#F5F8FF;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0B1220;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#FFFFFF;border:1px solid #E6EAF2;border-radius:16px;overflow:hidden;">
    <tr><td style="padding:22px 24px;background:#0B1220;">
      <div style="font-size:18px;font-weight:800;color:#FFFFFF;">D<span style="color:#00C896;">(AI)</span>Y</div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#FFFFFF;opacity:.6;margin-top:3px;">Autofocuss Reviews</div>
    </td></tr>
    <tr><td style="padding:26px 24px 8px;">
      <h1 style="font-size:20px;margin:0 0 10px;">${heading}</h1>
      <p style="font-size:14px;line-height:1.65;color:#5B6472;margin:0 0 20px;">${blurb}</p>
      <a href="${params.actionLink}" style="display:inline-block;background:#2563EB;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:100px;">
        ${isNew ? 'Set my password' : 'Reset my password'}
      </a>
      <p style="font-size:12px;line-height:1.6;color:#8A93A3;margin:20px 0 0;">
        This link can only be used once and expires in 24 hours. If the button doesn't work, copy this address into your browser:
      </p>
      <p style="font-size:11px;line-height:1.5;color:#8A93A3;word-break:break-all;margin:6px 0 0;">${escapeHtml(params.actionLink)}</p>
    </td></tr>
    <tr><td style="padding:18px 24px 24px;">
      <div style="border-top:1px solid #E6EAF2;padding-top:14px;font-size:11px;color:#8A93A3;">
        You are receiving this because an administrator gave this address access to ${escapeHtml(params.businessName)}.
      </div>
    </td></tr>
  </table>
</body>
</html>`;

  const text = [
    heading,
    '',
    isNew
      ? `You've been given access to the review dashboard for ${params.businessName}. Choose a password to get started.`
      : `A password reset was requested for your ${params.businessName} dashboard login.`,
    '',
    params.actionLink,
    '',
    'This link can only be used once and expires in 24 hours.',
  ].join('\n');

  return { subject, html, text };
}

/**
 * Generates a one-time Supabase link and emails it.
 *
 * `invite` creates the auth user if it does not exist; `recovery` targets an
 * account that already exists. The link itself is never logged.
 */
export async function sendOwnerInvite(params: {
  email: string;
  kind: InviteKind;
  businessName: string;
}): Promise<{ ok: boolean; error?: string; userId?: string }> {
  const admin = createAdminClient();
  if (!admin) return { ok: false, error: 'Supabase is not configured.' };

  const { data, error } = await admin.auth.admin.generateLink({
    type: params.kind,
    email: params.email,
    options: { redirectTo: `${appUrl()}/auth/set-password` },
  });

  if (error) return { ok: false, error: error.message };

  const actionLink = data?.properties?.action_link;
  if (!actionLink) return { ok: false, error: 'Supabase did not return an invitation link.' };

  const { subject, html, text } = renderInviteEmail({
    kind: params.kind,
    businessName: params.businessName,
    actionLink,
  });

  const sent = await sendEmail({ to: [params.email], subject, html, text });
  if (!sent.ok) {
    // The account may now exist even though the email failed; the admin can
    // resend from the owner-accounts screen.
    return { ok: false, error: `Account prepared, but the email failed: ${sent.error}`, userId: data.user?.id };
  }

  return { ok: true, userId: data.user?.id };
}
