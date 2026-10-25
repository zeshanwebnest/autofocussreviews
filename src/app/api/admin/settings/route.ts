import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/data-repository';
import {
  NotificationsRepository,
  isValidEmail,
  normaliseEmails,
} from '@/lib/notifications-repository';
import { sendTestAlertEmail } from '@/lib/alerts';
import { guardAdmin, guardShop, guardUser } from '@/lib/auth';

/**
 * Alert-recipient settings.
 *
 * Central admins see and edit the global row plus every shop's row.
 * Shop owners see and edit only their own shop, enforced here and again by
 * the database policies on notification_settings.
 */
export async function GET() {
  try {
    const guard = await guardUser();
    if (!guard.ok) return guard.response;
    const { profile } = guard;

    const clients = await DataRepository.getAllClients();
    const visibleClients =
      profile.role === 'admin' ? clients : clients.filter((c) => c.id === profile.client_id);

    const perClient = await Promise.all(
      visibleClients.map(async (c) => {
        const row = await NotificationsRepository.getForClient(c.id);
        return {
          client_id: c.id,
          business_name: c.business_name,
          alert_threshold: c.alert_threshold,
          recipient_email: row?.recipient_email ?? null,
          cc_emails: row?.cc_emails ?? [],
          enabled: row?.enabled ?? true,
          updated_at: row?.updated_at ?? null,
        };
      })
    );

    // Only a central admin has a global row to manage.
    const global =
      profile.role === 'admin' ? await NotificationsRepository.getGlobal() : null;

    return NextResponse.json({
      success: true,
      role: profile.role,
      global: global
        ? {
            recipient_email: global.recipient_email,
            cc_emails: global.cc_emails ?? [],
            enabled: global.enabled,
            updated_at: global.updated_at,
          }
        : null,
      clients: perClient,
    });
  } catch (err: any) {
    console.error('[Admin Settings GET Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

interface SavePayload {
  scope?: 'global' | 'client';
  clientId?: string | null;
  recipient_email?: string | null;
  cc_emails?: unknown;
  enabled?: boolean;
  action?: 'save' | 'test';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SavePayload;
    const scope = body.scope === 'client' ? 'client' : 'global';
    const action = body.action === 'test' ? 'test' : 'save';

    // --- authorise by scope -------------------------------------------------
    let profileEmail: string | null = null;
    let actorId: string | null = null;

    if (scope === 'global') {
      const guard = await guardAdmin();
      if (!guard.ok) return guard.response;
      profileEmail = guard.profile.email;
      actorId = guard.profile.id;
    } else {
      const clientId = (body.clientId ?? '').trim();
      if (!clientId) {
        return NextResponse.json(
          { success: false, error: 'A shop must be selected.' },
          { status: 400 }
        );
      }
      // Rejects an owner naming a shop that is not theirs.
      const guard = await guardShop(clientId);
      if (!guard.ok) return guard.response;
      profileEmail = guard.profile.email;
      actorId = guard.profile.id;
    }

    // --- validate ----------------------------------------------------------
    const rawRecipient = (body.recipient_email ?? '').toString().trim().toLowerCase();
    const recipient = rawRecipient.length ? rawRecipient : null;

    if (recipient && !isValidEmail(recipient)) {
      return NextResponse.json(
        { success: false, error: `"${rawRecipient}" is not a valid email address.` },
        { status: 400 }
      );
    }

    // Report bad CC entries rather than silently dropping them.
    const rawCc = Array.isArray(body.cc_emails) ? body.cc_emails : [];
    const invalidCc = rawCc
      .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
      .map((v) => v.trim())
      .filter((v) => !isValidEmail(v));

    if (invalidCc.length) {
      return NextResponse.json(
        {
          success: false,
          error: `Not a valid email address: ${invalidCc.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const cc = normaliseEmails(rawCc).filter((e) => e !== recipient);
    const enabled = body.enabled !== false;

    // --- test send ---------------------------------------------------------
    if (action === 'test') {
      if (!recipient) {
        return NextResponse.json(
          { success: false, error: 'Enter a recipient address before sending a test.' },
          { status: 400 }
        );
      }
      const shopName =
        scope === 'global'
          ? 'All shops (central admin)'
          : (await DataRepository.getClientById(body.clientId as string))?.business_name ??
            (body.clientId as string);

      const result = await sendTestAlertEmail({
        to: [recipient],
        cc,
        shopName,
        shopId: scope === 'client' ? (body.clientId as string) : null,
      });

      if (!result.ok) {
        return NextResponse.json({ success: false, error: result.error }, { status: 502 });
      }
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${recipient}${cc.length ? ` (cc ${cc.join(', ')})` : ''}.`,
      });
    }

    // --- save --------------------------------------------------------------
    const saved =
      scope === 'global'
        ? await NotificationsRepository.saveGlobal({
            recipient_email: recipient,
            cc_emails: cc,
            enabled,
            updated_by: actorId,
          })
        : await NotificationsRepository.saveForClient(body.clientId as string, {
            recipient_email: recipient,
            cc_emails: cc,
            enabled,
            updated_by: actorId,
          });

    return NextResponse.json({
      success: true,
      message: 'Settings saved. Future alerts will use these addresses.',
      settings: {
        scope: saved.scope,
        client_id: saved.client_id,
        recipient_email: saved.recipient_email,
        cc_emails: saved.cc_emails,
        enabled: saved.enabled,
        updated_at: saved.updated_at,
      },
      updated_by: profileEmail,
    });
  } catch (err: any) {
    console.error('[Admin Settings POST Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
