'use client';

import React, { useCallback, useEffect, useState } from 'react';

/**
 * Shop-owner accounts. Admin-only — the API refuses every one of these calls
 * for a non-admin, so hiding the section is presentation, not security.
 *
 * No password is ever created or displayed here. Access is granted by emailing
 * a one-time link; the owner chooses their own password.
 */

interface OwnerRow {
  id: string;
  email: string;
  full_name: string | null;
  disabled: boolean;
  invited_at: string | null;
  last_sign_in_at: string | null;
  has_signed_in: boolean;
}

interface ShopRow {
  client_id: string;
  business_name: string;
  owner: OwnerRow | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function when(iso: string | null): string {
  if (!iso) return 'never';
  try {
    return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

export function OwnerAccounts() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);

  const [inviteFor, setInviteFor] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/owners', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not load owner accounts.');
      setShops(data.shops ?? []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (key: string, fn: () => Promise<Response>) => {
    setBusyId(key);
    setNotice(null);
    try {
      const res = await fn();
      const data = await res.json();
      setNotice(
        res.ok && data.success
          ? { kind: 'ok', text: data.message || 'Done.' }
          : { kind: 'error', text: data.error || 'Something went wrong.' }
      );
      if (res.ok && data.success) await load();
    } catch (err: any) {
      setNotice({ kind: 'error', text: err.message });
    } finally {
      setBusyId(null);
    }
  };

  const invite = async (clientId: string) => {
    const email = inviteEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setNotice({ kind: 'error', text: `"${inviteEmail}" is not a valid email address.` });
      return;
    }
    await run(`invite-${clientId}`, () =>
      fetch('/api/admin/owners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, email, full_name: inviteName.trim() || null }),
      })
    );
    setInviteFor(null);
    setInviteEmail('');
    setInviteName('');
  };

  const patch = (userId: string, action: string, extra: Record<string, unknown> = {}) =>
    run(`${action}-${userId}`, () =>
      fetch('/api/admin/owners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, ...extra }),
      })
    );

  const remove = (userId: string, email: string) => {
    if (!confirm(`Remove ${email}? They lose access immediately. The shop's feedback is not affected.`)) return;
    void run(`del-${userId}`, () => fetch(`/api/admin/owners?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' }));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm animate-pulse">
            <div className="h-4 w-44 bg-[#E6EAF2] rounded mb-3" />
            <div className="h-3 w-64 bg-[#F5F8FF] rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFF1F5] border border-[#FED7D7] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-[#9B2C2C]">Could not load owner accounts</h3>
          <p className="text-xs text-[#742A2A] mt-1">{error}</p>
        </div>
        <button type="button" onClick={() => void load()} className="btn btn-outline text-xs font-bold py-2 px-4 self-start">
          Try again
        </button>
      </div>
    );
  }

  const withOwner = shops.filter((s) => s.owner).length;

  return (
    <div className="space-y-4">
      {notice && (
        <div
          role="status"
          className={`rounded-2xl px-4 py-3 text-[12px] font-semibold ${
            notice.kind === 'ok' ? 'bg-[#EAFBF5] text-[#0E9F76]' : 'bg-[#FFF1F5] text-[#D62E6B]'
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="bg-[#F5F8FF] rounded-2xl px-4 py-3 text-[12px] font-semibold text-[#5B6472]">
        {withOwner} of {shops.length} shop{shops.length === 1 ? '' : 's'} {withOwner === 1 ? 'has' : 'have'} an owner
        account. One owner per shop.
      </div>

      {shops.map((s) => {
        const o = s.owner;
        const inviting = inviteFor === s.client_id;
        return (
          <div key={s.client_id} className="bg-white border border-[#E6EAF2] rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="font-extrabold text-base text-[#0B1220] leading-tight">{s.business_name}</h3>
                <p className="text-[11px] text-[#8A93A3] mt-0.5">Shop ID {s.client_id}</p>

                {o ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm font-semibold text-[#0B1220] break-all">
                      {o.email}
                      {o.full_name ? <span className="font-normal text-[#5B6472]"> · {o.full_name}</span> : null}
                    </p>
                    <p className="text-[11px] text-[#8A93A3]">
                      Invited {when(o.invited_at)} · Last signed in {when(o.last_sign_in_at)}
                      {!o.has_signed_in && ' · has not signed in yet'}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-[#8A93A3] mt-3">No owner account yet.</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {o && (
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      o.disabled ? 'bg-[#FFF1F5] text-[#D62E6B]' : 'bg-[#EAFBF5] text-[#0E9F76]'
                    }`}
                  >
                    {o.disabled ? 'Revoked' : o.has_signed_in ? 'Active' : 'Invited'}
                  </span>
                )}
              </div>
            </div>

            {/* actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {o ? (
                <>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void patch(o.id, 'resend')}
                    className="btn btn-outline text-xs font-bold py-2 px-4 disabled:opacity-40"
                  >
                    {busyId === `resend-${o.id}` ? 'Sending…' : 'Resend password link'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void patch(o.id, o.disabled ? 'enable' : 'disable')}
                    className="btn btn-outline text-xs font-bold py-2 px-4 disabled:opacity-40"
                  >
                    {busyId === `disable-${o.id}` || busyId === `enable-${o.id}`
                      ? 'Working…'
                      : o.disabled
                        ? 'Restore access'
                        : 'Revoke access'}
                  </button>
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => remove(o.id, o.email)}
                    className="btn btn-outline text-xs font-bold py-2 px-4 text-[#D62E6B] hover:bg-[#D62E6B] hover:text-white disabled:opacity-40"
                  >
                    Remove
                  </button>
                </>
              ) : inviting ? (
                <div className="w-full flex flex-col gap-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="email"
                      autoFocus
                      value={inviteEmail}
                      placeholder="owner@business.in"
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-[#E6EAF2] text-xs text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                    <input
                      type="text"
                      value={inviteName}
                      placeholder="Owner's name (optional)"
                      onChange={(e) => setInviteName(e.target.value)}
                      className="px-3.5 py-2 rounded-xl border border-[#E6EAF2] text-xs text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busyId !== null || !inviteEmail.trim()}
                      onClick={() => void invite(s.client_id)}
                      className="btn btn-primary text-xs font-bold py-2.5 px-5 text-white shadow-btn disabled:opacity-40"
                    >
                      {busyId === `invite-${s.client_id}` ? 'Sending…' : 'Send invitation'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInviteFor(null);
                        setInviteEmail('');
                        setInviteName('');
                      }}
                      className="btn btn-outline text-xs font-bold py-2.5 px-4"
                    >
                      Cancel
                    </button>
                  </div>
                  <p className="text-[11px] text-[#8A93A3]">
                    They receive a one-time link and choose their own password. No password is created or shown here.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={busyId !== null}
                  onClick={() => setInviteFor(s.client_id)}
                  className="btn btn-primary text-xs font-bold py-2.5 px-5 text-white shadow-btn disabled:opacity-40"
                >
                  Invite owner
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
