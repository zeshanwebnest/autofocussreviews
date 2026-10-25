'use client';

import React, { useCallback, useEffect, useState } from 'react';

/**
 * Who receives negative-review alerts.
 *
 * Deliberately does NOT import from '@/lib/notifications-repository': that
 * module pulls in the service-role Supabase client, which must never reach a
 * browser bundle. The check below is for immediate feedback only — the API
 * route re-validates every address and is the authority.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const looksLikeEmail = (v: string) => EMAIL_RE.test(v.trim());

interface ShopSettings {
  client_id: string;
  business_name: string;
  alert_threshold: number;
  recipient_email: string | null;
  cc_emails: string[];
  enabled: boolean;
  updated_at: string | null;
}

interface GlobalSettings {
  recipient_email: string | null;
  cc_emails: string[];
  enabled: boolean;
  updated_at: string | null;
}

type Status = { kind: 'idle' } | { kind: 'ok'; text: string } | { kind: 'error'; text: string };

/* ------------------------------------------------------------------ */

function CcEditor({
  value,
  onChange,
  disabled,
  idPrefix,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  idPrefix: string;
}) {
  const [draft, setDraft] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const add = () => {
    const candidate = draft.trim().toLowerCase();
    if (!candidate) return;
    if (!looksLikeEmail(candidate)) {
      setErr(`"${candidate}" is not a valid email address.`);
      return;
    }
    if (value.includes(candidate)) {
      setErr('That address is already on the list.');
      return;
    }
    onChange([...value, candidate]);
    setDraft('');
    setErr(null);
  };

  return (
    <div>
      <label
        htmlFor={`${idPrefix}-cc`}
        className="block text-[11px] font-bold text-[#0B1220] uppercase tracking-wider mb-1.5"
      >
        CC addresses
      </label>

      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2 mb-2.5">
          {value.map((email) => (
            <li
              key={email}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full bg-[#EDF3FF] text-[#1741C4] text-[12px] font-semibold max-w-full"
            >
              <span className="truncate">{email}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(value.filter((e) => e !== email))}
                aria-label={`Remove ${email}`}
                className="w-4 h-4 rounded-full flex items-center justify-center text-[#1741C4] hover:bg-[#2563EB] hover:text-white transition-colors disabled:opacity-40"
              >
                <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l8 8M9 1l-8 8" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        <input
          id={`${idPrefix}-cc`}
          type="email"
          value={draft}
          disabled={disabled}
          placeholder="colleague@example.com"
          onChange={(e) => {
            setDraft(e.target.value);
            if (err) setErr(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              add();
            }
          }}
          className="flex-1 min-w-0 px-3.5 py-2 rounded-xl border border-[#E6EAF2] text-xs text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-[#F5F8FF]"
        />
        <button
          type="button"
          onClick={add}
          disabled={disabled || !draft.trim()}
          className="btn btn-outline text-xs font-bold py-2 px-4 disabled:opacity-40"
        >
          Add
        </button>
      </div>

      {err ? (
        <p className="text-[11px] text-[#D62E6B] font-semibold mt-1.5">{err}</p>
      ) : (
        <p className="text-[11px] text-[#8A93A3] mt-1.5">
          {value.length === 0 ? 'No CC addresses. Press Enter or Add after typing.' : `${value.length} CC address${value.length === 1 ? '' : 'es'}.`}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SettingsCard({
  title,
  subtitle,
  badge,
  idPrefix,
  recipient,
  cc,
  enabled,
  onSave,
  onTest,
}: {
  title: string;
  subtitle: string;
  badge?: React.ReactNode;
  idPrefix: string;
  recipient: string | null;
  cc: string[];
  enabled: boolean;
  onSave: (r: string, cc: string[], enabled: boolean) => Promise<{ ok: boolean; text: string }>;
  onTest: (r: string, cc: string[]) => Promise<{ ok: boolean; text: string }>;
}) {
  const [draftRecipient, setDraftRecipient] = useState(recipient ?? '');
  const [draftCc, setDraftCc] = useState<string[]>(cc);
  const [draftEnabled, setDraftEnabled] = useState(enabled);
  const [busy, setBusy] = useState<null | 'save' | 'test'>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  const dirty =
    draftRecipient.trim().toLowerCase() !== (recipient ?? '').toLowerCase() ||
    JSON.stringify(draftCc) !== JSON.stringify(cc) ||
    draftEnabled !== enabled;

  const recipientInvalid = draftRecipient.trim().length > 0 && !looksLikeEmail(draftRecipient);

  const run = async (which: 'save' | 'test') => {
    setBusy(which);
    setStatus({ kind: 'idle' });
    const res =
      which === 'save'
        ? await onSave(draftRecipient.trim(), draftCc, draftEnabled)
        : await onTest(draftRecipient.trim(), draftCc);
    setStatus(res.ok ? { kind: 'ok', text: res.text } : { kind: 'error', text: res.text });
    setBusy(null);
  };

  return (
    <div className="bg-white border border-[#E6EAF2] rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-extrabold text-base text-[#0B1220] leading-tight truncate">{title}</h3>
          <p className="text-[11px] text-[#8A93A3] mt-0.5">{subtitle}</p>
        </div>
        {badge}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-recipient`}
          className="block text-[11px] font-bold text-[#0B1220] uppercase tracking-wider mb-1.5"
        >
          Alert recipient
        </label>
        <input
          id={`${idPrefix}-recipient`}
          type="email"
          value={draftRecipient}
          disabled={busy !== null}
          placeholder="owner@business.in"
          onChange={(e) => {
            setDraftRecipient(e.target.value);
            if (status.kind !== 'idle') setStatus({ kind: 'idle' });
          }}
          className={`w-full px-3.5 py-2 rounded-xl border text-xs text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 disabled:bg-[#F5F8FF] ${
            recipientInvalid ? 'border-[#D62E6B]' : 'border-[#E6EAF2]'
          }`}
        />
        {recipientInvalid ? (
          <p className="text-[11px] text-[#D62E6B] font-semibold mt-1.5">
            That does not look like a valid email address.
          </p>
        ) : (
          <p className="text-[11px] text-[#8A93A3] mt-1.5">
            {draftRecipient.trim() ? 'Receives every low-rating alert.' : 'Empty means nobody is alerted here.'}
          </p>
        )}
      </div>

      <CcEditor value={draftCc} onChange={setDraftCc} disabled={busy !== null} idPrefix={idPrefix} />

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={draftEnabled}
          disabled={busy !== null}
          onChange={(e) => setDraftEnabled(e.target.checked)}
          className="w-4 h-4 rounded border-[#E6EAF2] text-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
        />
        <span className="text-xs font-semibold text-[#0B1220]">
          Alerts enabled
          <span className="font-normal text-[#8A93A3]"> — uncheck to pause without deleting the addresses</span>
        </span>
      </label>

      {status.kind !== 'idle' && (
        <div
          role="status"
          className={`rounded-xl px-3.5 py-2.5 text-[12px] font-semibold ${
            status.kind === 'ok'
              ? 'bg-[#EAFBF5] text-[#0E9F76]'
              : 'bg-[#FFF1F5] text-[#D62E6B]'
          }`}
        >
          {status.text}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-2 pt-1">
        <button
          type="button"
          onClick={() => run('save')}
          disabled={busy !== null || !dirty || recipientInvalid}
          className="btn btn-primary text-xs font-bold py-2.5 px-6 text-white shadow-btn disabled:opacity-40 disabled:shadow-none"
        >
          {busy === 'save' ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
        </button>
        <button
          type="button"
          onClick={() => run('test')}
          disabled={busy !== null || !draftRecipient.trim() || recipientInvalid}
          className="btn btn-outline text-xs font-bold py-2.5 px-4 disabled:opacity-40"
          title="Sends a sample alert to the recipient above"
        >
          {busy === 'test' ? 'Sending…' : 'Send test email'}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function NotificationSettings() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [role, setRole] = useState<'admin' | 'owner'>('owner');
  const [globalSettings, setGlobalSettings] = useState<GlobalSettings | null>(null);
  const [shops, setShops] = useState<ShopSettings[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/settings', { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not load settings.');
      setRole(data.role);
      setGlobalSettings(data.global);
      setShops(data.clients ?? []);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { ok: false, text: data.error || 'Something went wrong.' };
    }
    return { ok: true, text: data.message || 'Done.' };
  };

  const saveGlobal = async (r: string, cc: string[], enabled: boolean) => {
    const out = await post({ scope: 'global', recipient_email: r, cc_emails: cc, enabled });
    if (out.ok) {
      setGlobalSettings({ recipient_email: r || null, cc_emails: cc, enabled, updated_at: new Date().toISOString() });
    }
    return out;
  };

  const saveShop = async (clientId: string, r: string, cc: string[], enabled: boolean) => {
    const out = await post({ scope: 'client', clientId, recipient_email: r, cc_emails: cc, enabled });
    if (out.ok) {
      setShops((prev) =>
        prev.map((s) =>
          s.client_id === clientId
            ? { ...s, recipient_email: r || null, cc_emails: cc, enabled, updated_at: new Date().toISOString() }
            : s
        )
      );
    }
    return out;
  };

  /* ---------------- states ---------------- */

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-sm animate-pulse">
            <div className="h-4 w-40 bg-[#E6EAF2] rounded mb-3" />
            <div className="h-3 w-56 bg-[#F5F8FF] rounded mb-6" />
            <div className="h-9 w-full bg-[#F5F8FF] rounded-xl mb-4" />
            <div className="h-9 w-full bg-[#F5F8FF] rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-[#FFF1F5] border border-[#FED7D7] rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-extrabold text-sm text-[#9B2C2C]">Could not load alert settings</h3>
          <p className="text-xs text-[#742A2A] mt-1">{loadError}</p>
        </div>
        <button type="button" onClick={() => void load()} className="btn btn-outline text-xs font-bold py-2 px-4 self-start">
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {role === 'admin' && globalSettings && (
        <SettingsCard
          title="Central admin — all shops"
          subtitle="Receives an alert for every low rating, across every shop."
          idPrefix="global"
          badge={
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#0B1220] text-white">
              Global
            </span>
          }
          recipient={globalSettings.recipient_email}
          cc={globalSettings.cc_emails}
          enabled={globalSettings.enabled}
          onSave={saveGlobal}
          onTest={(r, cc) => post({ scope: 'global', action: 'test', recipient_email: r, cc_emails: cc })}
        />
      )}

      {shops.length === 0 ? (
        <div className="bg-white border border-[#E6EAF2] rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-[#0B1220]">No shops yet</p>
          <p className="text-xs text-[#8A93A3] mt-1">Add a shop above and its alert settings will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {shops.map((s) => (
            <SettingsCard
              key={s.client_id}
              title={s.business_name}
              subtitle={`Alerts on ratings of ${s.alert_threshold} or below · shop ID ${s.client_id}`}
              idPrefix={`shop-${s.client_id}`}
              badge={
                s.recipient_email ? null : (
                  <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#FFF1F5] text-[#D62E6B]">
                    No recipient
                  </span>
                )
              }
              recipient={s.recipient_email}
              cc={s.cc_emails}
              enabled={s.enabled}
              onSave={(r, cc, enabled) => saveShop(s.client_id, r, cc, enabled)}
              onTest={(r, cc) =>
                post({ scope: 'client', clientId: s.client_id, action: 'test', recipient_email: r, cc_emails: cc })
              }
            />
          ))}
        </div>
      )}

      <p className="text-[11px] text-[#8A93A3] px-1">
        A low rating sends one email combining the central admin address and that shop&apos;s address.
        Shops never see each other&apos;s recipients.
      </p>
    </div>
  );
}
