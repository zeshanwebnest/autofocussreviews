'use client';

import React, { useCallback, useEffect, useState } from 'react';

/**
 * Each shop's Google review link.
 *
 * Rendered for both the central admin (all shops) and a shop owner (their own).
 * The API decides what comes back — this component never asks for a specific
 * shop, so there is nothing here for an owner to tamper with.
 */

interface ShopLink {
  client_id: string;
  business_name: string;
  google_review_url: string;
  verified: boolean;
  updated_at: string | null;
}

type Status = { kind: 'idle' } | { kind: 'ok'; text: string } | { kind: 'error'; text: string };

/** Mirrors the server check for instant feedback; the server is authoritative. */
function looksLikeGoogleLink(value: string): boolean {
  try {
    const u = new URL(value.trim());
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    const p = u.pathname.toLowerCase();
    return (
      h === 'g.page' ||
      h === 'maps.app.goo.gl' ||
      (h === 'goo.gl' && p.startsWith('/maps')) ||
      (h === 'search.google.com' && p.startsWith('/local/writereview')) ||
      ((h === 'www.google.com' || h === 'google.com' || h === 'maps.google.com') && p.startsWith('/maps'))
    );
  } catch {
    return false;
  }
}

function LinkCard({
  shop,
  canVerify,
  onSave,
}: {
  shop: ShopLink;
  canVerify: boolean;
  onSave: (url: string, verified: boolean) => Promise<{ ok: boolean; text: string }>;
}) {
  const [url, setUrl] = useState(shop.google_review_url);
  const [verified, setVerified] = useState(shop.verified);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const urlChanged = url.trim() !== shop.google_review_url;
  const dirty = urlChanged || verified !== shop.verified;
  const invalid = url.trim().length > 0 && !looksLikeGoogleLink(url);

  const save = async () => {
    setBusy(true);
    setStatus({ kind: 'idle' });
    const res = await onSave(url.trim(), urlChanged ? false : verified);
    setStatus(res.ok ? { kind: 'ok', text: res.text } : { kind: 'error', text: res.text });
    if (res.ok && urlChanged) setVerified(false);
    setBusy(false);
  };

  return (
    <div className="bg-white border border-[#E6EAF2] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-extrabold text-base text-[#0B1220] leading-tight truncate">{shop.business_name}</h3>
          <p className="text-[11px] text-[#8A93A3] mt-0.5">Shop ID {shop.client_id}</p>
        </div>
        <span
          className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
            shop.verified ? 'bg-[#EAFBF5] text-[#0E9F76]' : 'bg-[#FFF8E8] text-[#A96A05]'
          }`}
        >
          {shop.verified ? 'Verified' : 'Not verified'}
        </span>
      </div>

      <div>
        <label
          htmlFor={`glink-${shop.client_id}`}
          className="block text-[11px] font-bold text-[#0B1220] uppercase tracking-wider mb-1.5"
        >
          Google review link
        </label>
        <input
          id={`glink-${shop.client_id}`}
          type="url"
          value={url}
          disabled={busy}
          placeholder="https://g.page/r/..."
          onChange={(e) => {
            setUrl(e.target.value);
            if (status.kind !== 'idle') setStatus({ kind: 'idle' });
          }}
          className={`w-full px-3.5 py-2 rounded-xl border text-xs text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-[#F5F8FF] ${
            invalid ? 'border-[#D62E6B]' : 'border-[#E6EAF2]'
          }`}
        />
        {invalid ? (
          <p className="text-[11px] text-[#D62E6B] font-semibold mt-1.5">
            That is not a Google address. Use the link from your Google Business Profile.
          </p>
        ) : (
          <p className="text-[11px] text-[#8A93A3] mt-1.5">
            Where 4 and 5 star customers are sent. Low ratings never go here.
          </p>
        )}
      </div>

      {url.trim() && !invalid && (
        <a
          href={url.trim()}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold text-[#2563EB] hover:underline self-start"
        >
          Open this link to check it ↗
        </a>
      )}

      {canVerify && (
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={verified}
            disabled={busy || urlChanged}
            onChange={(e) => setVerified(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#E6EAF2] text-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />
          <span className="text-xs font-semibold text-[#0B1220]">
            I have opened this link and it is the correct business
            {urlChanged && (
              <span className="block font-normal text-[#A96A05] mt-0.5">
                Save the new link first, then confirm it.
              </span>
            )}
          </span>
        </label>
      )}

      {status.kind !== 'idle' && (
        <div
          role="status"
          className={`rounded-xl px-3.5 py-2.5 text-[12px] font-semibold ${
            status.kind === 'ok' ? 'bg-[#EAFBF5] text-[#0E9F76]' : 'bg-[#FFF1F5] text-[#D62E6B]'
          }`}
        >
          {status.text}
        </div>
      )}

      <button
        type="button"
        onClick={save}
        disabled={busy || !dirty || invalid || !url.trim()}
        className="btn btn-primary text-xs font-bold py-2.5 px-6 text-white shadow-btn disabled:opacity-40 disabled:shadow-none self-start"
      >
        {busy ? 'Saving…' : dirty ? 'Save link' : 'Saved'}
      </button>
    </div>
  );
}

export function GoogleLinkManager() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shops, setShops] = useState<ShopLink[]>([]);
  const [canVerify, setCanVerify] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/google-link', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not load review links.');
      setShops(data.shops ?? []);
      setCanVerify(Boolean(data.canVerify));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (clientId: string, url: string, verified: boolean) => {
    const res = await fetch('/api/admin/google-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, google_review_url: url, verified }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) return { ok: false, text: data.error || 'Could not save.' };
    setShops((prev) => prev.map((s) => (s.client_id === clientId ? { ...s, ...data.shop } : s)));
    return { ok: true, text: data.message || 'Saved.' };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm animate-pulse">
            <div className="h-4 w-40 bg-[#E6EAF2] rounded mb-3" />
            <div className="h-3 w-24 bg-[#F5F8FF] rounded mb-6" />
            <div className="h-9 w-full bg-[#F5F8FF] rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#FFF1F5] border border-[#FED7D7] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-[#9B2C2C]">Could not load review links</h3>
          <p className="text-xs text-[#742A2A] mt-1">{error}</p>
        </div>
        <button type="button" onClick={() => void load()} className="btn btn-outline text-xs font-bold py-2 px-4 self-start">
          Try again
        </button>
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="bg-white border border-[#E6EAF2] rounded-3xl p-8 text-center">
        <p className="text-sm font-bold text-[#0B1220]">No shops to configure</p>
        <p className="text-xs text-[#8A93A3] mt-1">Add a shop and its review link will appear here.</p>
      </div>
    );
  }

  const unverified = shops.filter((s) => !s.verified).length;

  return (
    <div className="space-y-5">
      {unverified > 0 && (
        <div className="bg-[#FFF8E8] rounded-2xl px-4 py-3 text-[12px] font-semibold text-[#A96A05]">
          {unverified} of {shops.length} link{shops.length === 1 ? '' : 's'} {unverified === 1 ? 'has' : 'have'} not been
          confirmed. Until confirmed, treat them as unverified — a wrong link sends happy customers to the wrong business.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {shops.map((s) => (
          <LinkCard
            key={s.client_id}
            shop={s}
            canVerify={canVerify}
            onSave={(url, verified) => save(s.client_id, url, verified)}
          />
        ))}
      </div>
    </div>
  );
}
