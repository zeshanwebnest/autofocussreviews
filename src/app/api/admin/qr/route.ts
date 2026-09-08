import { NextRequest, NextResponse } from 'next/server';
import { generateQrSvg, generateQrBuffer } from '@/lib/qr';
import { DataRepository } from '@/lib/data-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const format = searchParams.get('format') || 'png';
    const size = parseInt(searchParams.get('size') || '1800', 10);

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client ID is required.' }, { status: 400 });
    }

    const client = await DataRepository.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    // Target feedback URL
    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.startsWith('localhost') ? 'http' : 'https';
    const targetUrl = `${protocol}://${host}/f/${client.id}`;

    if (format === 'svg') {
      const svg = await generateQrSvg(targetUrl, { width: Math.min(size, 800) });
      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Content-Disposition': `attachment; filename="qr-${client.id}.svg"`,
        },
      });
    }

    const pngBuffer = await generateQrBuffer(targetUrl, size);
    return new Response(new Uint8Array(pngBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="qr-${client.id}-300dpi.png"`,
      },
    });
  } catch (err: any) {
    console.error('[Admin QR Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
