import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/data-repository';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdmin, guardShop, guardUser } from '@/lib/auth';
import { validateGoogleReviewUrl } from '@/lib/validations';

/**
 * Each shop's Google review link.
 *
 * Admins manage every shop; an owner manages only their own, which is checked
 * by guardShop() against their profile rather than anything in the request.
 *
 * Owner edits are written through the service-role client with an explicit
 * column whitelist rather than an RLS UPDATE policy: Postgres row policies
 * cannot restrict which columns a statement writes, so a policy permissive
 * enough to allow this would also expose alert_threshold, status and
 * webhook_url to the owner.
 */

function admin() {
  const c = createAdminClient();
  if (!c) throw new Error('Supabase is not configured.');
  return c;
}

export async function GET() {
  try {
    const guard = await guardUser();
    if (!guard.ok) return guard.response;
    const { profile } = guard;

    const all = await DataRepository.getAllClients();
    const visible = profile.role === 'admin' ? all : all.filter((c) => c.id === profile.client_id);

    return NextResponse.json({
      success: true,
      role: profile.role,
      canVerify: profile.role === 'admin',
      shops: visible.map((c) => ({
        client_id: c.id,
        business_name: c.business_name,
        google_review_url: c.google_review_url,
        verified: c.google_review_url_verified ?? false,
        updated_at: c.google_review_url_updated_at ?? null,
      })),
    });
  } catch (err: any) {
    console.error('[Google Link GET Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientId = String(body.clientId ?? '').trim().toLowerCase();
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'A shop must be selected.' }, { status: 400 });
    }

    // Rejects an owner naming any shop but their own.
    const guard = await guardShop(clientId);
    if (!guard.ok) return guard.response;
    const { profile } = guard;

    const client = await DataRepository.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'That shop does not exist.' }, { status: 404 });
    }

    // Marking a link verified is an administrator's assertion, never an owner's.
    if (typeof body.verified === 'boolean' && body.verified !== (client.google_review_url_verified ?? false)) {
      const adminGuard = await guardAdmin();
      if (!adminGuard.ok) {
        return NextResponse.json(
          { success: false, error: 'Only a central administrator can mark a link as verified.' },
          { status: 403 }
        );
      }
    }

    const urlInput = String(body.google_review_url ?? '');
    const check = validateGoogleReviewUrl(urlInput);
    if (!check.isValid || !check.value) {
      return NextResponse.json({ success: false, error: check.error }, { status: 400 });
    }

    const changed = check.value !== client.google_review_url;

    // Changing the address always clears verification — the new destination has
    // not been confirmed by anyone yet.
    const verified = changed
      ? false
      : typeof body.verified === 'boolean'
        ? body.verified
        : (client.google_review_url_verified ?? false);

    const { data, error } = await (admin().from('clients') as any)
      .update({
        google_review_url: check.value,
        google_review_url_verified: verified,
        google_review_url_updated_at: new Date().toISOString(),
        google_review_url_updated_by: profile.id,
      })
      .eq('id', clientId)
      .select('id, business_name, google_review_url, google_review_url_verified, google_review_url_updated_at')
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      success: true,
      message: changed
        ? 'Link saved. It is marked unverified until someone confirms it opens the right listing.'
        : verified
          ? 'Link confirmed as verified.'
          : 'Link saved.',
      shop: {
        client_id: data.id,
        business_name: data.business_name,
        google_review_url: data.google_review_url,
        verified: data.google_review_url_verified,
        updated_at: data.google_review_url_updated_at,
      },
    });
  } catch (err: any) {
    console.error('[Google Link POST Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
