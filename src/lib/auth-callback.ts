/**
 * Reads what Supabase put in the URL after an invitation or recovery link.
 *
 * Supabase redirects to the callback page with either the session tokens or an
 * error, both in the URL fragment. The page previously only asked "did a
 * session appear?", so every failure — expired, already used, malformed, or a
 * network problem — showed the same "this link has expired" screen and the
 * real reason was discarded.
 *
 * Pure and framework-free so it can be tested directly against fixtures.
 */

export type AuthCallback =
  | { kind: 'tokens' }
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

/**
 * @param hash   window.location.hash
 * @param search window.location.search
 */
export function readAuthCallback(hash: string, search = ''): AuthCallback {
  const h = paramsFrom(hash);
  const q = paramsFrom(search);
  const get = (key: string) => h.get(key) ?? q.get(key);

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

  // An implicit-grant callback carries the session in the fragment. We only
  // detect it here; the Supabase client is still what validates it.
  if (get('access_token') || get('refresh_token') || get('code')) {
    return { kind: 'tokens' };
  }

  return { kind: 'none' };
}
