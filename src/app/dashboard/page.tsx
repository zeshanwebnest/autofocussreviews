import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';
import { DataRepository, computeStats } from '@/lib/data-repository';
import { SubmissionsTable } from '@/components/admin/SubmissionsTable';
import { SignOutButton } from '@/components/admin/SignOutButton';
import { GoogleLinkManager } from '@/components/admin/GoogleLinkManager';
import { NotificationSettings } from '@/components/admin/NotificationSettings';

export const metadata: Metadata = {
  title: 'Shop Dashboard | Autofocuss Reviews',
  description: 'Your customer feedback, ratings and alert settings.',
};

export const revalidate = 0;

export default async function ShopOwnerDashboard() {
  const profile = await getCurrentProfile();

  // Identity and role come from the session and the profiles table, never from
  // the URL. There is no shop id in this route for anyone to change.
  if (!profile) redirect('/admin/login');
  if (profile.disabled) redirect('/admin/login?revoked=1');
  if (profile.role === 'admin') redirect('/admin');
  if (!profile.client_id) {
    return (
      <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E6EAF2] rounded-3xl p-8 max-w-md text-center shadow-sm">
          <h1 className="text-xl font-black text-[#0B1220]">No shop assigned</h1>
          <p className="text-sm text-[#5B6472] mt-2">
            Your account is not linked to a shop yet. Your administrator needs to assign one before you can see any
            feedback.
          </p>
          <div className="mt-5 flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  const client = await DataRepository.getClientById(profile.client_id);
  if (!client) {
    return (
      <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center p-6">
        <div className="bg-white border border-[#E6EAF2] rounded-3xl p-8 max-w-md text-center shadow-sm">
          <h1 className="text-xl font-black text-[#0B1220]">Shop not found</h1>
          <p className="text-sm text-[#5B6472] mt-2">
            The shop linked to your account no longer exists. Please contact your administrator.
          </p>
          <div className="mt-5 flex justify-center">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  const submissions = await DataRepository.getSubmissionsByClientId(client.id);
  const stats = computeStats(submissions);

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: submissions.filter((s) => s.rating === star).length,
  }));
  const maxInDistribution = Math.max(1, ...distribution.map((d) => d.count));
  const lowRatings = submissions.filter((s) => s.rating <= client.alert_threshold);

  return (
    <div className="min-h-screen bg-[#F5F8FF]">
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#E6EAF2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xl font-black tracking-tight text-[#0B1220]">
              D<span className="text-[#00C896]">(AI)</span>Y
            </span>
            <span className="text-xs font-bold text-[#8A93A3] ml-2 uppercase hidden sm:inline">Shop Dashboard</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <a
              href={`/f/${client.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline text-xs font-bold py-2 px-3.5 hidden sm:inline-flex"
            >
              View my feedback page ↗
            </a>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-10">
        {/* Shop identity */}
        <section className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-white text-xl font-black"
            style={{ backgroundColor: client.brand_colour }}
          >
            {client.business_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-[#0B1220] tracking-tight truncate">
              {client.business_name}
            </h1>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Shop ID {client.id}
              {client.location_id ? ` · ${client.location_id}` : ''} · Alerts on {client.alert_threshold} stars or below
            </p>
          </div>
        </section>

        {/* Summary cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Total Feedback</span>
            <p className="text-3xl font-black text-[#0B1220] mt-1 tabular-nums">{stats.count}</p>
            <span className="text-[11px] text-[#5B6472] font-semibold">Customers who rated you</span>
          </div>
          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Average Rating</span>
            <p className="text-3xl font-black text-[#2563EB] mt-1 tabular-nums">
              {stats.count ? stats.averageRating : '—'}
            </p>
            <span className="text-[11px] text-[#5B6472] font-semibold">Out of 5 stars</span>
          </div>
          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Happy Customers</span>
            <p className="text-3xl font-black text-[#00C896] mt-1 tabular-nums">{stats.happyCount}</p>
            <span className="text-[11px] text-[#00C896] font-semibold">4–5 ★ sent to Google</span>
          </div>
          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider">Needs Follow-Up</span>
            <p className="text-3xl font-black text-[#FF4D8D] mt-1 tabular-nums">{stats.alertCount}</p>
            <span className="text-[11px] text-[#FF4D8D] font-semibold">Kept private, you were emailed</span>
          </div>
        </section>

        {/* Rating distribution */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Rating Breakdown</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">How your {stats.count} ratings are spread.</p>
          </div>
          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-5 sm:p-6 shadow-sm">
            {stats.count === 0 ? (
              <p className="text-sm text-[#8A93A3] text-center py-6">
                No ratings yet. They appear here as soon as a customer scans your QR code.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {distribution.map((d) => (
                  <div key={d.star} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#0B1220] w-10 shrink-0 tabular-nums">{d.star} ★</span>
                    <div className="flex-1 h-3 rounded-full bg-[#F5F8FF] overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(d.count / maxInDistribution) * 100}%`,
                          backgroundColor: d.star >= 4 ? '#00C896' : '#FF4D8D',
                        }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-[#5B6472] w-10 text-right shrink-0 tabular-nums">
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Low ratings needing attention */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Customers To Call Back</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Ratings of {client.alert_threshold} or below. These never went to Google — reaching out quickly is the point.
            </p>
          </div>
          <div className="bg-white border border-[#E6EAF2] rounded-3xl p-5 sm:p-6 shadow-sm">
            {lowRatings.length === 0 ? (
              <p className="text-sm text-[#8A93A3] text-center py-6">
                Nothing to follow up. Every rating so far has been {client.alert_threshold + 1} stars or better.
              </p>
            ) : (
              <ul className="divide-y divide-[#E6EAF2]">
                {lowRatings.slice(0, 10).map((s) => (
                  <li key={s.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                    <span className="text-xs font-black text-[#FF4D8D] w-10 shrink-0 tabular-nums">{s.rating} ★</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#0B1220]">
                        {s.name}{' '}
                        <a href={`tel:+91${s.phone}`} className="font-semibold text-[#2563EB] hover:underline">
                          +91 {s.phone}
                        </a>
                      </p>
                      <p className="text-xs text-[#5B6472] mt-0.5">{s.comment || 'No comment left.'}</p>
                    </div>
                    <span className="text-[11px] text-[#8A93A3] shrink-0">
                      {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Google review link */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Your Google Review Link</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Where happy customers are sent. Check it opens your own business listing.
            </p>
          </div>
          <GoogleLinkManager />
        </section>

        {/* Alert recipients — owner scope only */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">Who Gets Your Alerts</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Email addresses notified when a customer leaves a low rating at your shop.
            </p>
          </div>
          <NotificationSettings />
        </section>

        {/* Full feedback history */}
        <section>
          <div className="mb-4">
            <h2 className="text-2xl font-black text-[#0B1220] tracking-tight">All Feedback</h2>
            <p className="text-xs sm:text-sm text-[#5B6472] mt-0.5">
              Every customer who rated you, with their phone number. Exportable to CSV.
            </p>
          </div>
          <SubmissionsTable submissions={submissions} clients={[client]} />
        </section>
      </main>
    </div>
  );
}
