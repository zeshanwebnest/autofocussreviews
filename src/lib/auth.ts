import { NextResponse } from 'next/server';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export type Role = 'admin' | 'owner';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  /** null for central admins; the owner's single shop otherwise. */
  client_id: string | null;
  /** Access revoked by an admin. The account and its history survive. */
  disabled: boolean;
}

/**
 * Identity comes from the signed session cookie; role comes from the profiles
 * table, which only a central admin can write. Nothing here trusts a value
 * supplied by the browser — no query string, no request body, no header.
 */
export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();
  if (!admin) {
    throw new Error('Supabase is not configured; cannot resolve the current profile.');
  }

  const { data, error } = await admin
    .from('profiles')
    .select('id, email, full_name, role, client_id, disabled')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    throw new Error(`[auth] Could not load profile for ${user.id}: ${error.message}`);
  }

  // A signed-in user with no profile row has no role, so they get nothing.
  if (!data) return null;

  return data as Profile;
}

/** True when this profile may read or write records belonging to `clientId`. */
export function canAccessClient(profile: Profile | null, clientId: string): boolean {
  if (!profile) return false;
  if (profile.disabled) return false;
  if (profile.role === 'admin') return true;
  // An owner with no shop assigned deliberately matches nothing.
  if (!profile.client_id) return false;
  return profile.client_id.toLowerCase() === clientId.toLowerCase();
}

/**
 * Narrows an owner's request to their own shop.
 * Admins may pass any shop id, or none to mean "all shops".
 * Returns the shop id that queries must actually be scoped to.
 */
export function resolveScope(
  profile: Profile,
  requestedClientId?: string | null
): { clientId: string | null } | { error: string } {
  if (profile.role === 'admin') {
    return { clientId: requestedClientId || null };
  }
  if (!profile.client_id) {
    return { error: 'Your account is not assigned to a shop yet. Contact your administrator.' };
  }
  if (requestedClientId && requestedClientId.toLowerCase() !== profile.client_id.toLowerCase()) {
    return { error: 'You do not have access to that shop.' };
  }
  return { clientId: profile.client_id };
}

// ---------------------------------------------------------------------------
// Route guards — every admin/owner API route calls one of these directly.
// The middleware only proves a user is signed in; it does not know roles, so
// relying on it alone would let any signed-in owner call an admin endpoint.
// ---------------------------------------------------------------------------

type Guard<T> = { ok: true; profile: T } | { ok: false; response: NextResponse };

function deny(message: string, status: number): { ok: false; response: NextResponse } {
  return {
    ok: false,
    response: NextResponse.json({ success: false, error: message }, { status }),
  };
}

/** Any signed-in user with a profile. */
export async function guardUser(): Promise<Guard<Profile>> {
  const profile = await getCurrentProfile();
  if (!profile) return deny('Unauthorized', 401);
  if (profile.disabled) return deny('Your access has been revoked. Contact your administrator.', 403);
  return { ok: true, profile };
}

/** Central administrators only. */
export async function guardAdmin(): Promise<Guard<Profile>> {
  const profile = await getCurrentProfile();
  if (!profile) return deny('Unauthorized', 401);
  if (profile.disabled) return deny('Your access has been revoked. Contact your administrator.', 403);
  if (profile.role !== 'admin') return deny('Forbidden — central administrators only.', 403);
  return { ok: true, profile };
}

/**
 * Signed-in user who is allowed to act on `clientId`.
 * Pass the shop id taken from the request; this is where an owner trying
 * another shop's id via URL or body is rejected.
 */
export async function guardShop(clientId: string): Promise<Guard<Profile>> {
  const profile = await getCurrentProfile();
  if (!profile) return deny('Unauthorized', 401);
  if (profile.disabled) return deny('Your access has been revoked. Contact your administrator.', 403);
  if (!canAccessClient(profile, clientId)) {
    return deny('Forbidden — you do not have access to that shop.', 403);
  }
  return { ok: true, profile };
}

/**
 * Keeps the JWT claims used by the database policies in step with the
 * profiles table. Must be called after any change to a user's role or shop;
 * the new claims apply from their next sign-in or token refresh.
 */
export async function syncAuthClaims(
  userId: string,
  role: Role,
  clientId: string | null
): Promise<void> {
  const admin = createAdminClient();
  if (!admin) throw new Error('Supabase is not configured; cannot sync auth claims.');

  const { error } = await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role, client_id: clientId },
  });
  if (error) {
    throw new Error(`[auth] Could not sync claims for ${userId}: ${error.message}`);
  }
}
