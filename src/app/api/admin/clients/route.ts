import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/data-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (clientId) {
      const client = await DataRepository.getClientById(clientId);
      if (!client) {
        return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });
      }
      const stats = await DataRepository.getClientStats(clientId);
      const submissions = await DataRepository.getSubmissionsByClientId(clientId);
      return NextResponse.json({ success: true, client, stats, submissions });
    }

    const clients = await DataRepository.getAllClients();
    const clientsWithStats = await Promise.all(
      clients.map(async (client) => {
        const stats = await DataRepository.getClientStats(client.id);
        return {
          ...client,
          stats,
        };
      })
    );

    return NextResponse.json({ success: true, clients: clientsWithStats });
  } catch (err: any) {
    console.error('[Admin Clients GET Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
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
