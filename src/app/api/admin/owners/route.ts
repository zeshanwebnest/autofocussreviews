import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/data-repository';
import { createAdminClient } from '@/lib/supabase/admin';
import { guardAdmin, syncAuthClaims } from '@/lib/auth';
import { isValidEmail } from '@/lib/notifications-repository';
import { sendOwnerInvite } from '@/lib/invites';

/**
 * Shop-owner account management. Central administrators only — every handler
 * calls guardAdmin() before touching anything.
 *
 * Passwords are never created, shown or stored here. Access is granted by
 * emailing a one-time Supabase link; revoking sets `disabled` on the profile
 * AND bans the auth user, so sessions already issued stop working too.
 */

interface OwnerProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  client_id: string | null;
  disabled: boolean;
  invited_at: string | null;
}

function admin() {
  const c = createAdminClient();
  if (!c) throw new Error('Supabase is not configured.');
  return c;
}

/**
 * The generated Database types do not narrow this table's select strings
 * correctly, so queries come back as `never`. Results are cast to
 * OwnerProfileRow at each call site, which keeps the shape documented.
 */
function profilesTable() {
  return admin().from('profiles') as any;
}

async function findAuthUserByEmail(email: string) {
  const { data, error } = await admin().auth.admin.listUsers();
  if (error) throw new Error(error.message);
  return data.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase()) ?? null;
}

/** One row per shop, with its owner account if there is one. */
export async function GET() {
  try {
    const guard = await guardAdmin();
    if (!guard.ok) return guard.response;

    const clients = await DataRepository.getAllClients();
    const { data: profileRows, error } = await profilesTable()
      .select('id, email, full_name, role, client_id, disabled, invited_at')
      .eq('role', 'owner');
    if (error) throw new Error(error.message);
    const profiles = (profileRows ?? []) as OwnerProfileRow[];

    const { data: authList } = await admin().auth.admin.listUsers();

    const shops = clients.map((c) => {
      const prof = profiles.find((p) => p.client_id === c.id);
      const authUser = prof ? authList.users.find((u) => u.id === prof.id) : null;
      return {
        client_id: c.id,
        business_name: c.business_name,
        owner: prof
          ? {
              id: prof.id,
              email: prof.email,
              full_name: prof.full_name,
              disabled: prof.disabled,
              invited_at: prof.invited_at,
              last_sign_in_at: authUser?.last_sign_in_at ?? null,
              has_signed_in: Boolean(authUser?.last_sign_in_at),
            }
          : null,
      };
    });

    return NextResponse.json({ success: true, shops });
  } catch (err: any) {
    console.error('[Admin Owners GET Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** Create an owner account for a shop and email the set-password link. */
export async function POST(req: NextRequest) {
  try {
    const guard = await guardAdmin();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const clientId = String(body.clientId ?? '').trim().toLowerCase();
    const fullName = body.full_name ? String(body.full_name).trim() : null;

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: `"${email}" is not a valid email address.` }, { status: 400 });
    }

    const client = await DataRepository.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'That shop does not exist.' }, { status: 404 });
    }

    // One owner per shop, matching the unique index on profiles.
    const { data: existingForShop } = (await profilesTable()
      .select('id, email').eq('role', 'owner').eq('client_id', clientId).maybeSingle()) as {
      data: Pick<OwnerProfileRow, 'id' | 'email'> | null;
    };
    if (existingForShop) {
      return NextResponse.json(
        { success: false, error: `${client.business_name} already has an owner (${existingForShop.email}). Remove or reassign that account first.` },
        { status: 409 }
      );
    }

    // An address may only hold one account of any kind.
    const existingUser = await findAuthUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: `${email} already has an account on this system.` },
        { status: 409 }
      );
    }

    const invite = await sendOwnerInvite({ email, kind: 'invite', businessName: client.business_name });
    if (!invite.userId) {
      return NextResponse.json({ success: false, error: invite.error ?? 'Could not create the account.' }, { status: 502 });
    }

    const { error: profErr } = await profilesTable().insert({
      id: invite.userId,
      email,
      full_name: fullName,
      role: 'owner',
      client_id: clientId,
      disabled: false,
      invited_at: new Date().toISOString(),
      last_invited_by: guard.profile.id,
    });
    if (profErr) {
      // Roll the auth user back so a half-made account cannot linger.
      await admin().auth.admin.deleteUser(invite.userId).catch(() => {});
      throw new Error(profErr.message);
    }

    await syncAuthClaims(invite.userId, 'owner', clientId);

    return NextResponse.json({
      success: true,
      message: invite.ok
        ? `Invitation sent to ${email}.`
        : `Account created, but the email failed: ${invite.error}. Use "Resend invite".`,
      emailSent: invite.ok,
    });
  } catch (err: any) {
    console.error('[Admin Owners POST Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** disable | enable | resend | reassign */
export async function PATCH(req: NextRequest) {
  try {
    const guard = await guardAdmin();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const userId = String(body.userId ?? '').trim();
    const action = String(body.action ?? '');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'An account must be selected.' }, { status: 400 });
    }

    const { data: prof, error: pErr } = (await profilesTable()
      .select('id, email, role, client_id, disabled').eq('id', userId).maybeSingle()) as {
      data: Pick<OwnerProfileRow, 'id' | 'email' | 'role' | 'client_id' | 'disabled'> | null;
      error: { message: string } | null;
    };
    if (pErr) throw new Error(pErr.message);
    if (!prof || prof.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'That is not a shop owner account.' }, { status: 404 });
    }

    if (action === 'disable' || action === 'enable') {
      const disabled = action === 'disable';
      const { error } = await profilesTable().update({ disabled, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw new Error(error.message);

      // Also ban/unban so sessions already issued stop working immediately.
      await admin().auth.admin.updateUserById(userId, { ban_duration: disabled ? '876000h' : 'none' });

      return NextResponse.json({
        success: true,
        message: disabled ? `Access revoked for ${prof.email}.` : `Access restored for ${prof.email}.`,
      });
    }

    if (action === 'resend') {
      const client = prof.client_id ? await DataRepository.getClientById(prof.client_id) : null;
      const result = await sendOwnerInvite({
        email: prof.email as string,
        kind: 'recovery',
        businessName: client?.business_name ?? 'your shop',
      });
      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 502 });
      }
      await profilesTable().update({ invited_at: new Date().toISOString(), last_invited_by: guard.profile.id }).eq('id', userId);
      return NextResponse.json({ success: true, message: `Password link re-sent to ${prof.email}.` });
    }

    if (action === 'reassign') {
      const clientId = String(body.clientId ?? '').trim().toLowerCase();
      const client = await DataRepository.getClientById(clientId);
      if (!client) {
        return NextResponse.json({ success: false, error: 'That shop does not exist.' }, { status: 404 });
      }
      const { data: taken } = (await profilesTable()
        .select('id, email').eq('role', 'owner').eq('client_id', clientId).neq('id', userId).maybeSingle()) as {
        data: Pick<OwnerProfileRow, 'id' | 'email'> | null;
      };
      if (taken) {
        return NextResponse.json(
          { success: false, error: `${client.business_name} already has an owner (${taken.email}).` },
          { status: 409 }
        );
      }
      const { error } = await profilesTable().update({ client_id: clientId, updated_at: new Date().toISOString() }).eq('id', userId);
      if (error) throw new Error(error.message);
      await syncAuthClaims(userId, 'owner', clientId);
      return NextResponse.json({ success: true, message: `${prof.email} now manages ${client.business_name}.` });
    }

    return NextResponse.json({ success: false, error: `Unknown action "${action}".` }, { status: 400 });
  } catch (err: any) {
    console.error('[Admin Owners PATCH Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

/** Permanently remove an owner account. Shop data is untouched. */
export async function DELETE(req: NextRequest) {
  try {
    const guard = await guardAdmin();
    if (!guard.ok) return guard.response;

    const userId = new URL(req.url).searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'An account must be selected.' }, { status: 400 });
    }

    const { data: prof } = (await profilesTable().select('id, email, role').eq('id', userId).maybeSingle()) as {
      data: Pick<OwnerProfileRow, 'id' | 'email' | 'role'> | null;
    };
    if (!prof || prof.role !== 'owner') {
      return NextResponse.json({ success: false, error: 'That is not a shop owner account.' }, { status: 404 });
    }

    await profilesTable().delete().eq('id', userId);
    const { error } = await admin().auth.admin.deleteUser(userId);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, message: `Removed ${prof.email}. The shop's feedback is unaffected.` });
  } catch (err: any) {
    console.error('[Admin Owners DELETE Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
