import { NextRequest, NextResponse } from 'next/server';
import { generateQrSvg, generateQrBuffer } from '@/lib/qr';
import { DataRepository } from '@/lib/data-repository';
import { guardShop } from '@/lib/auth';

/**
 * The public base URL that printed QR codes point at.
 *
 * NEXT_PUBLIC_APP_URL wins when set, because a QR code is permanent once it is
 * printed: generating one while visiting a preview deployment or the raw
 * .vercel.app address would bake that hostname into every sticker. The request
 * host remains the fallback so existing behaviour is unchanged if the variable
 * is missing.
 */
function resolveBaseUrl(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');

  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const format = searchParams.get('format') || 'png';
    const size = parseInt(searchParams.get('size') || '1800', 10);

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'Client ID is required.' }, { status: 400 });
    }

    // A shop owner can only ever download their own shop's QR code.
    const guard = await guardShop(clientId);
    if (!guard.ok) return guard.response;

    const client = await DataRepository.getClientById(clientId);
    if (!client) {
      return NextResponse.json({ success: false, error: 'Client not found.' }, { status: 404 });
    }

    const targetUrl = `${resolveBaseUrl(req)}/f/${client.id}`;

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
