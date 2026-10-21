import { NextRequest, NextResponse } from 'next/server';
import { DataRepository } from '@/lib/data-repository';
import { guardUser, resolveScope } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const guard = await guardUser();
    if (!guard.ok) return guard.response;

    const { searchParams } = new URL(req.url);
    const requested = searchParams.get('clientId');

    // An owner is pinned to their own shop here; an admin may pass any shop,
    // or none to export everything.
    const scope = resolveScope(guard.profile, requested);
    if ('error' in scope) {
      return NextResponse.json({ success: false, error: scope.error }, { status: 403 });
    }

    const clientId = scope.clientId;
    const stamp = new Date().toISOString().slice(0, 10);

    const submissions = clientId
      ? await DataRepository.getSubmissionsByClientId(clientId)
      : await DataRepository.getAllSubmissions();

    const filename = `customer-phone-list-${clientId ?? 'all'}-${stamp}.csv`;

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
