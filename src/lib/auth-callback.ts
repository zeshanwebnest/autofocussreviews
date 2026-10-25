/**
 * Reads what arrives on the set-password page after an invitation or
 * password-reset link.
 *
 * Links are now application-owned: they point at this app carrying a
 * `token_hash`, which the page exchanges for a session with verifyOtp(). The
 * older style pointed at Supabase's /verify endpoint, which redirected back
 * with the session in the URL fragment — those cannot be honoured, because
 * @supabase/ssr forces the PKCE flow and auth-js rejects an implicit fragment
 * outright (GoTrueClient _getSessionFromURL, "Not a valid PKCE flow url").
 * They are detected so the page can say so plainly instead of timing out.
 *
 * Pure and framework-free so it can be tested directly against fixtures.
 */

/** The verification types Supabase mints for these emails. */
const ALLOWED_TYPES = ['recovery', 'invite', 'signup', 'magiclink', 'email', 'email_change'] as const;
export type VerifyType = (typeof ALLOWED_TYPES)[number];

export type AuthCallback =
  | { kind: 'verify'; tokenHash: string; type: VerifyType }
  | { kind: 'legacy' }
  | { kind: 'none' }
  | {
      kind: 'error';
      /** Supabase's machine-readable code, e.g. otp_expired. Safe to show. */
      code: string;
      title: string;
      detail: string;
      /** Whether requesting a fresh link is the right next step. */
      canRetry: boolean;
    };

function paramsFrom(raw: string): URLSearchParams {
  if (!raw) return new URLSearchParams();
  const cleaned = raw.startsWith('#') || raw.startsWith('?') ? raw.slice(1) : raw;
  try {
    return new URLSearchParams(cleaned);
  } catch {
    // A malformed fragment must not throw — it is just an unusable callback.
    return new URLSearchParams();
  }
}

function isAllowedType(value: string): value is VerifyType {
  return (ALLOWED_TYPES as readonly string[]).includes(value);
}

/**
 * @param hash   window.location.hash
 * @param search window.location.search
 */
export function readAuthCallback(hash: string, search = ''): AuthCallback {
  const h = paramsFrom(hash);
  const q = paramsFrom(search);
  const get = (key: string) => q.get(key) ?? h.get(key);

  const error = get('error');
  const errorCode = get('error_code');
  const errorDescription = get('error_description');

  if (error || errorCode || errorDescription) {
    const code = (errorCode || error || 'unknown').toLowerCase();

    // Supabase reports an already-used link and a genuinely expired one with
    // the same code, so the wording has to cover both without guessing which.
    if (code === 'otp_expired' || code === 'access_denied') {
      return {
        kind: 'error',
        code,
        title: 'This link can no longer be used',
        detail:
          'Sign-in links work only once and stop working after 24 hours. ' +
          'This one has either already been opened or has passed its 24 hours.',
        canRetry: true,
      };
    }

    return {
      kind: 'error',
      code,
      title: 'That link did not work',
      detail:
        (errorDescription && errorDescription.replace(/\+/g, ' ')) ||
        'The link could not be verified. Requesting a new one should fix it.',
      canRetry: true,
    };
  }

  // The current format: our own URL carrying a token to exchange.
  const tokenHash = get('token_hash');
  if (tokenHash) {
    const rawType = (get('type') || 'recovery').toLowerCase();
    if (!isAllowedType(rawType)) {
      return {
        kind: 'error',
        code: 'unsupported_type',
        title: 'That link did not work',
        detail: 'The link is not a recognised sign-in link. Requesting a new one should fix it.',
        canRetry: true,
      };
    }
    return { kind: 'verify', tokenHash, type: rawType };
  }

  // An older Supabase-hosted link that redirected back with the session in the
  // fragment. The configured client cannot accept these.
  if (get('access_token') || get('refresh_token') || get('code')) {
    return { kind: 'legacy' };
  }

  return { kind: 'none' };
}
