'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { readAuthCallback, type AuthCallback } from '@/lib/auth-callback';

/**
 * Where an invitation or password-reset link lands.
 *
 * Supabase puts either a session or an error in the URL fragment. The Supabase
 * client is still the only thing that validates the session — this page just
 * reports accurately on what happened and offers a way forward when the link
 * cannot be used.
 */

type Phase =
  | { name: 'checking' }
  | { name: 'ready'; email: string | null }
  | { name: 'unusable'; title: string; detail: string; code?: string }
  | { name: 'done' };

export default function SetPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>({ name: 'checking' });

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // "Request a new link"
  const [retryEmail, setRetryEmail] = useState('');
  const [retryBusy, setRetryBusy] = useState(false);
  const [retryDone, setRetryDone] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      let callback: AuthCallback;
      try {
        callback = readAuthCallback(window.location.hash, window.location.search);
      } catch {
        callback = { kind: 'none' };
      }

      if (callback.kind === 'error') {
        if (!cancelled) {
          setPhase({ name: 'unusable', title: callback.title, detail: callback.detail, code: callback.code });
        }
        return;
      }

      if (callback.kind === 'legacy') {
        if (!cancelled) {
          setPhase({
            name: 'unusable',
            title: 'This link is from an older email',
            detail:
              'Sign-in links changed recently, and this one can no longer be opened. ' +
              'Request a new one below — it will work straight away.',
            code: 'legacy_link',
          });
        }
        return;
      }

      if (callback.kind === 'none') {
        if (!cancelled) {
          setPhase({
            name: 'unusable',
            title: 'Nothing to set up here',
            detail:
              'Open this page using the link from your email. If you typed the address ' +
              'directly, request a new link below.',
          });
        }
        return;
      }

      // Exchange the one-time token for a session. Until this succeeds there
      // is no session, and the password form below is never rendered.
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: callback.tokenHash,
          type: callback.type,
        });

        if (cancelled) return;

        if (error || !data?.session?.user) {
          // Supabase reports an already-used link and an expired one alike.
          const spent = /expired|invalid|not found/i.test(error?.message ?? '');
          setPhase({
            name: 'unusable',
            title: spent ? 'This link can no longer be used' : 'This link could not be verified',
            detail: spent
              ? 'Sign-in links work only once and stop working after 24 hours. This one has ' +
                'either already been opened or has passed its 24 hours.'
              : 'The link could not be verified. Requesting a new one should fix it.',
            // An error code only — never the token.
            code: (error as { code?: string } | null)?.code || 'verification_failed',
          });
          return;
        }

        // Drop the token from the address bar so it does not linger in history.
        try {
          window.history.replaceState(window.history.state, '', window.location.pathname);
        } catch {
          /* non-fatal */
        }

        setPhase({ name: 'ready', email: data.session.user.email ?? null });
      } catch {
        if (!cancelled) {
          setPhase({
            name: 'unusable',
            title: 'Could not reach the server',
            detail: 'Check your connection and open the link again, or request a new one below.',
            code: 'network_error',
          });
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (password.length < 8) {
      setFormError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setFormError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      // Fails unless the session established above is still valid, so a
      // password cannot be set without one.
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setFormError(error.message);
        return;
      }
      setPhase({ name: 'done' });
      setTimeout(() => router.replace('/dashboard'), 1200);
    } catch {
      setFormError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const requestNewLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retryBusy || retryDone) return;

    setRetryBusy(true);
    setRetryMessage(null);
    try {
      const res = await fetch('/api/auth/request-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: retryEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        setRetryMessage(data.error || 'Could not request a new link. Please try again.');
        return;
      }
      setRetryDone(true);
      setRetryMessage(data.message);
    } catch {
      setRetryMessage('Could not reach the server. Check your connection and try again.');
    } finally {
      setRetryBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F5F8FF] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-2xl font-black tracking-tight text-[#0B1220]">
            D<span className="text-[#00C896]">(AI)</span>Y
          </span>
          <p className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider mt-1">
            {phase.name === 'unusable' ? 'Sign-in link' : 'Choose your password'}
          </p>
        </div>

        <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-[0_20px_45px_-18px_rgba(15,23,42,0.12)]">
          {phase.name === 'checking' && (
            <div className="py-8 text-center">
              <div className="h-3 w-40 bg-[#F5F8FF] rounded mx-auto animate-pulse" />
              <p className="text-xs text-[#8A93A3] mt-3">Checking your link…</p>
            </div>
          )}

          {phase.name === 'unusable' && (
            <div className="py-2">
              <div className="w-11 h-11 rounded-full bg-[#FFF8E8] flex items-center justify-center mb-4">
                <span className="text-xl">⏳</span>
              </div>
              <h1 className="text-lg font-black text-[#0B1220]">{phase.title}</h1>
              <p className="text-sm text-[#5B6472] mt-2 leading-relaxed">{phase.detail}</p>
              {phase.code && (
                <p className="text-[11px] text-[#8A93A3] mt-2 font-mono">Reference: {phase.code}</p>
              )}

              <div className="border-t border-[#E6EAF2] mt-5 pt-5">
                {retryDone ? (
                  <div className="rounded-xl bg-[#EAFBF5] px-3.5 py-3 text-[12px] font-semibold text-[#0E9F76]">
                    {retryMessage}
                  </div>
                ) : (
                  <form onSubmit={requestNewLink} className="space-y-3">
                    <label
                      htmlFor="retry-email"
                      className="block text-[11px] font-bold text-[#0B1220] uppercase tracking-wider"
                    >
                      Request a new link
                    </label>
                    <input
                      id="retry-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={retryEmail}
                      placeholder="you@business.in"
                      onChange={(e) => setRetryEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] text-sm text-[#0B1220] placeholder-[#8A93A3] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                    />
                    {retryMessage && (
                      <div className="rounded-xl bg-[#FFF1F5] px-3.5 py-2.5 text-[12px] font-semibold text-[#D62E6B]">
                        {retryMessage}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={retryBusy || !retryEmail.trim()}
                      className="btn btn-primary w-full text-sm font-bold py-2.5 text-white shadow-btn disabled:opacity-50"
                    >
                      {retryBusy ? 'Sending…' : 'Email me a new link'}
                    </button>
                    <p className="text-[11px] text-[#8A93A3] leading-relaxed">
                      Open the new link as soon as it arrives — each one works only once.
                    </p>
                  </form>
                )}
              </div>

              <a
                href="/admin/login"
                className="block text-center text-xs font-bold text-[#2563EB] hover:underline mt-4"
              >
                Already know your password? Sign in
              </a>
            </div>
          )}

          {phase.name === 'done' && (
            <div className="py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EAFBF5] flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <h1 className="text-lg font-black text-[#0B1220]">Password set</h1>
              <p className="text-sm text-[#5B6472] mt-1">Taking you to your dashboard…</p>
            </div>
          )}

          {phase.name === 'ready' && (
            <form onSubmit={submit} className="space-y-4">
              {phase.email && (
                <p className="text-xs text-[#5B6472]">
                  Setting a password for <strong className="text-[#0B1220] break-all">{phase.email}</strong>
                </p>
              )}

              <div>
                <label
                  htmlFor="password"
                  className="block text-[11px] font-bold text-[#0B1220] uppercase tracking-wider mb-1.5"
                >
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] text-sm text-[#0B1220] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
                <p className="text-[11px] text-[#8A93A3] mt-1.5">At least 8 characters.</p>
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="block text-[11px] font-bold text-[#0B1220] uppercase tracking-wider mb-1.5"
                >
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6EAF2] text-sm text-[#0B1220] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                />
              </div>

              {formError && (
                <div className="rounded-xl bg-[#FFF1F5] px-3.5 py-2.5 text-[12px] font-semibold text-[#D62E6B]">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn btn-primary w-full text-sm font-bold py-3 text-white shadow-btn disabled:opacity-50"
              >
                {busy ? 'Saving…' : 'Set password and continue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
