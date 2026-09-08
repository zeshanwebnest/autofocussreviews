import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/data-repository';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    let submissions = [];
    let filename = `customer-phone-list-all-${new Date().toISOString().slice(0, 10)}.csv`;

    if (clientId) {
      submissions = await DataRepository.getSubmissionsByClientId(clientId);
      filename = `customer-phone-list-${clientId}-${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      submissions = await DataRepository.getAllSubmissions();
    }

    const headers = ['Submission ID', 'Client ID', 'Customer Name', 'Phone', 'Rating', 'Comment', 'Source', 'Submitted At'];
    const csvRows = [headers.join(',')];

    for (const sub of submissions) {
      const escape = (str: string | null | undefined) => {
        if (!str) return '""';
        const formatted = String(str).replace(/"/g, '""');
        return `"${formatted}"`;
      };

      csvRows.push(
        [
          escape(sub.id),
          escape(sub.client_id),
          escape(sub.name),
          escape(sub.phone),
          sub.rating,
          escape(sub.comment),
          escape(sub.source),
          escape(sub.created_at),
        ].join(',')
      );
    }

    const csvContent = csvRows.join('\r\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    console.error('[Admin Export Error]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
