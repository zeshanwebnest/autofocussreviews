import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { DataRepository } from '@/lib/data-repository';
import { ClientManager } from '@/components/admin/ClientManager';
import { SubmissionsTable } from '@/components/admin/SubmissionsTable';
import { SignOutButton } from '@/components/admin/SignOutButton';
import { NotificationSettings } from '@/components/admin/NotificationSettings';
import { GoogleLinkManager } from '@/components/admin/GoogleLinkManager';
import { OwnerAccounts } from '@/components/admin/OwnerAccounts';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Autofocuss AI Review Capture',
  description: 'Manage clients, print QR codes, view customer submissions, and export CSVs.',
};

export const revalidate = 0; // Fresh dynamic data

export default async function AdminDashboardPage() {
  // This page renders every shop's data using the service-role client, which
  // bypasses row-level security. The middleware only proves someone is signed
  // in, so the role has to be checked here too — without this, a shop owner
  // could read the whole admin dashboard by visiting the URL.
  const profile = await getCurrentProfile();
  if (!profile || profile.disabled) redirect('/admin/login');
  if (profile.role !== 'admin') redirect('/dashboard');

  const clients = await DataRepository.getAllClients();
  const submissions = await DataRepository.getAllSubmissions();

  const clientsWithStats = await Promise.all(
    clients.map(async (client) => {
      const stats = await DataRepository.getClientStats(client.id);
      return {
        ...client,
        stats,
      };
    })
  );

  const totalSubmissions = submissions.length;
  const avgRating = totalSubmissions > 0
    ? (submissions.reduce((acc, curr) => acc + curr.rating, 0) / totalSubmissions).toFixed(1)
    : '0.0';
  const happyCount = submissions.filter((s) => s.rating >= 4).length;
  const recoveryCount = submissions.filter((s) => s.rating <= 3).length;

  return (
    <div className="min-h-screen bg-[#F5F8FF]">
      {/* Admin Nav */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6EAF2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-xl font-black tracking-tight text-[#0B1220]">
              D<span className="text-[#00C896]">(AI)</span>Y <span className="text-xs font-bold text-[#8A93A3] ml-1 uppercase">Admin Control</span>
            </a>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/f/tambi"
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline text-xs font-bold py-2 px-3.5 hidden sm:inline-flex"
            >
              Preview /f/tambi ↗
            </a>
            <a
              href="/"
              className="text-xs font-semibold text-[#5B6472] hover:text-[#0B1220]"
            >
              Public Landing Page
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Top Metric Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Total Clients</span>
            <p className="text-3xl font-black text-[#0B1220] mt-1">{clients.length}</p>
            <span className="text-[11px] text-[#00C896] font-semibold">Multi-tenant active</span>
          </div>

          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Captured Leads</span>
            <p className="text-3xl font-black text-[#2563EB] mt-1">{totalSubmissions}</p>
            <span className="text-[11px] text-[#5B6472] font-semibold">Verified 10-digit mobile numbers</span>
          </div>

          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Google Review CTAs</span>
            <p className="text-3xl font-black text-[#00C896] mt-1">{happyCount}</p>
            <span className="text-[11px] text-[#00C896] font-semibold">4–5 ★ Raters routed to Google</span>
          </div>

          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Recovery Alerts</span>
            <p className="text-3xl font-black text-[#FF4D8D] mt-1">{recoveryCount}</p>
            <span className="text-[11px] text-[#FF4D8D] font-semibold">Intercepted privately</span>
          </div>
        </section>

        {/* Section 1: Client Manager & QR Studio */}
        <section>
          <ClientManager initialClients={clientsWithStats} />
        </section>

        {/* Section 2: Google review links */}
        <section className="pt-4">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Google Review Links</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Where each shop&apos;s happy customers are sent. A link stays marked unverified until someone opens it and
              confirms it is the right business.
            </p>
          </div>
          <GoogleLinkManager />
        </section>

        {/* Section 3: Shop owner accounts */}
        <section className="pt-4">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Shop Owner Accounts</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Give a shop owner their own login. They see only their shop, and choose their own password from an emailed
              link.
            </p>
          </div>
          <OwnerAccounts />
        </section>

        {/* Section 4: Alert recipients */}
        <section className="pt-4">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Negative Review Alerts</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Who gets emailed when a customer leaves a low rating. Changes apply to the next alert.
            </p>
          </div>
          <NotificationSettings />
        </section>

        {/* Section 5: Submissions Stream */}
        <section className="pt-4">
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Customer Feed & Phone List</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Live customer ratings captured at the counter. Exportable to CSV for CRM or WhatsApp marketing.
            </p>
          </div>
          <SubmissionsTable submissions={submissions} clients={clients} />
        </section>
      </main>
    </div>
  );
}
