import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/data-repository';
import { guardAdmin, guardShop, guardUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      // guardShop rejects an owner asking for a shop that is not theirs.
      const guard = await guardShop(clientId);
      if (!guard.ok) return guard.response;

      const client = await DataRepository.getClientById(clientId);
      if (!client) {
        return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
      }
      const stats = await DataRepository.getClientStats(clientId);
      const submissions = await DataRepository.getSubmissionsByClientId(clientId);
      return NextResponse.json({ success: true, client, stats, submissions });
    }

    const guard = await guardUser();
    if (!guard.ok) return guard.response;

    // Owners only ever see their own shop in a list request.
    const all = await DataRepository.getAllClients();
    const visible =
      guard.profile.role === 'admin'
        ? all
        : all.filter((c) => c.id === guard.profile.client_id);

    const clientsWithStats = await Promise.all(
      visible.map(async (client) => ({
        ...client,
        stats: await DataRepository.getClientStats(client.id),
      }))
    );

    return NextResponse.json({ success: true, clients: clientsWithStats });
  } catch (err: any) {
    console.error('[Admin Clients GET Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Creating and editing shops is a central-admin action only.
    const guard = await guardAdmin();
    if (!guard.ok) return guard.response;

    const body = await req.json();
    const { id, business_name, google_review_url, brand_colour, logo_url, owner_whatsapp, owner_email, alert_threshold, webhook_url, status, location_id } = body;

    if (!id || !business_name || !google_review_url) {
      return NextResponse.json({ success: false, error: 'ID slug, Business Name, and Google Review URL are required.' }, { status: 400 });
    }

    const client = await DataRepository.upsertClient({
      id,
      business_name,
      google_review_url,
      brand_colour,
      logo_url,
      owner_whatsapp,
      owner_email,
      alert_threshold: alert_threshold ? Number(alert_threshold) : 3,
      webhook_url,
      status: status || 'active',
      location_id,
    });

    return NextResponse.json({ success: true, client });
  } catch (err: any) {
    console.error('[Admin Clients POST Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const guard = await guardAdmin();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client ID is required' }, { status: 400 });
    }

    if (clientId === 'demo' || clientId === 'tambi') {
      return NextResponse.json({ success: false, error: 'Default seeded clients cannot be deleted.' }, { status: 403 });
    }

    await DataRepository.deleteClient(clientId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Admin Clients DELETE Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
