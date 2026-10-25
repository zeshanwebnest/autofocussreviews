import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DataRepository } from '@/lib/data-repository';
import { isValidEmail } from '@/lib/notifications-repository';
import { sendOwnerInvite } from '@/lib/invites';

/**
 * Lets someone whose sign-in link failed ask for a fresh one.
 *
 * Deliberately unauthenticated — the person asking has no session, that is the
 * whole problem. What keeps it safe:
 *
 *   1. The reply is one shared constant, identical whether the address has an
 *      account, has none, or has been revoked. Nothing else is returned.
 *   2. The link itself only ever travels by email; the caller never sees it.
 *   3. Sending is gated by an atomic claim on the account's cooldown, so two
 *      requests arriving together cannot both send — a duplicate would
 *      invalidate the link just sent, which is the failure we are trying to
 *      avoid in the first place.
 *
 * It grants no access by itself: the emailed link is still verified by
 * Supabase exactly as before, and this route cannot change a password.
 */

const COOLDOWN_SECONDS = 60;

/** The same answer in every case. */
const NEUTRAL =
  'If that address has an account, a new sign-in link is on its way. It can take a minute to arrive — please check spam too.';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    // profiles.email is stored lowercased, and PostgREST eq() is
    // case-sensitive, so the input has to be normalised the same way.
    const email = String(body?.email ?? '').trim().toLowerCase();

    // Shape errors are safe to report: they reveal nothing about accounts.
    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Enter the email address the link was sent to.' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { success: false, error: 'This service is temporarily unavailable. Please try again shortly.' },
        { status: 503 }
      );
    }

    // Everything below either succeeds quietly or fails quietly.
    try {
      // Look the account up by indexed column rather than listing every user:
      // auth.admin.listUsers() returns only the first page, so past that page
      // a real account would silently never be found.
      const { data: found } = await admin
        .from('profiles')
        .select('id, client_id, disabled')
        .eq('email', email)
        .maybeSingle();

      const prof = found as { id: string; client_id: string | null; disabled: boolean } | null;

      // A revoked account gets the same neutral reply and no email.
      if (prof && !prof.disabled) {
        // Claim the cooldown slot atomically. This is a single UPDATE whose
        // WHERE clause carries the cooldown test, so concurrent requests
        // cannot both match — exactly one gets a row back and may send.
        const cutoff = new Date(Date.now() - COOLDOWN_SECONDS * 1000).toISOString();
        const { data: claimed } = await (admin.from('profiles') as any)
          .update({ invited_at: new Date().toISOString() })
          .eq('id', prof.id)
          .or(`invited_at.is.null,invited_at.lt.${cutoff}`)
          .select('id');

        const won = Array.isArray(claimed) && claimed.length > 0;

        if (won) {
          // Resolve the address from the auth record rather than trusting the
          // profile copy, in case the two have drifted apart.
          const { data: userRes } = await admin.auth.admin.getUserById(prof.id);
          const target = userRes?.user?.email || email;

          const client = prof.client_id ? await DataRepository.getClientById(prof.client_id) : null;
          const result = await sendOwnerInvite({
            email: target,
            kind: 'recovery',
            businessName: client?.business_name ?? 'Autofocuss Reviews',
          });

          if (!result.ok) {
            // Logged for us, never shown to the caller. The cooldown stays
            // claimed, so a failed send costs the user one minute rather than
            // risking two links in flight at once.
            console.error('[request-link] could not send recovery email:', result.error);
          }
        }
      }
    } catch (inner: any) {
      // A lookup or send failure must not change the reply, or the difference
      // becomes a way to probe for accounts.
      console.error('[request-link] internal failure:', inner?.message ?? inner);
    }

    return NextResponse.json({ success: true, message: NEUTRAL });
  } catch (err: any) {
    console.error('[request-link] unexpected error:', err?.message ?? err);
    return NextResponse.json(
      { success: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
