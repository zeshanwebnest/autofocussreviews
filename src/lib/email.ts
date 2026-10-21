/**
 * Transport layer for outbound email, using Resend's REST API directly.
 *
 * Called with plain fetch rather than the `resend` npm package: the request is
 * a single POST, and this keeps the dependency list unchanged.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const SEND_TIMEOUT_MS = 10_000;

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string | null;
}

export interface SendEmailResult {
  ok: boolean;
  providerId?: string;
  error?: string;
}

/** The sender address. Must be on a domain verified in Resend. */
export function getFromAddress(): string {
  return process.env.RESEND_FROM || 'Autofocuss Alerts <onboarding@resend.dev>';
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return {
      ok: false,
      error: 'RESEND_API_KEY is not set, so no email could be sent.',
    };
  }
  if (!input.to.length) {
    return { ok: false, error: 'No recipient address was supplied.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromAddress(),
        to: input.to,
        ...(input.cc?.length ? { cc: input.cc } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({}) as Record<string, unknown>);

    if (!response.ok) {
      // Resend reports problems as { name, message } — surface the message so
      // the email log says why, e.g. "domain is not verified".
      const detail =
        (body as any)?.message || (body as any)?.error || `HTTP ${response.status}`;
      return { ok: false, error: String(detail) };
    }

    return { ok: true, providerId: (body as any)?.id ?? undefined };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.name === 'AbortError' ? 'Email provider timed out after 10s' : String(err?.message || err),
    };
  } finally {
    clearTimeout(timeout);
  }
}
