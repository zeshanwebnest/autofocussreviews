'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Where an invitation or password-reset link lands.
 *
 * Supabase puts a one-time session in the URL; the browser client picks it up,
 * the owner chooses a password, and the link is spent. No password is ever
 * transmitted to our own server or stored anywhere by us.
 */
export default function SetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [sessionOk, setSessionOk] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // The session may land either immediately or via the auth state change,
    // depending on how quickly the URL fragment is parsed.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionOk(true);
        setEmail(session.user.email ?? null);
        setChecking(false);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSessionOk(true);
        setEmail(data.session.user.email ?? null);
      }
      setChecking(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Use at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    // The server decides where they belong based on their role.
    setTimeout(() => router.replace('/dashboard'), 1200);
  };

  return (
    <main className="min-h-screen bg-[#F5F8FF] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <span className="text-2xl font-black tracking-tight text-[#0B1220]">
            D<span className="text-[#00C896]">(AI)</span>Y
          </span>
          <p className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider mt-1">Choose your password</p>
        </div>

        <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 shadow-[0_20px_45px_-18px_rgba(15,23,42,0.12)]">
          {checking ? (
            <div className="py-8 text-center">
              <div className="h-3 w-40 bg-[#F5F8FF] rounded mx-auto animate-pulse" />
              <p className="text-xs text-[#8A93A3] mt-3">Checking your link…</p>
            </div>
          ) : !sessionOk ? (
            <div className="py-4 text-center">
              <h1 className="text-lg font-black text-[#0B1220]">This link has expired</h1>
              <p className="text-sm text-[#5B6472] mt-2 leading-relaxed">
                Invitation links can only be used once and last 24 hours. Ask your administrator to send a new one.
              </p>
              <a href="/admin/login" className="btn btn-outline text-xs font-bold py-2.5 px-5 mt-5 inline-flex">
                Go to sign in
              </a>
            </div>
          ) : done ? (
            <div className="py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#EAFBF5] flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <h1 className="text-lg font-black text-[#0B1220]">Password set</h1>
              <p className="text-sm text-[#5B6472] mt-1">Taking you to your dashboard…</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {email && (
                <p className="text-xs text-[#5B6472]">
                  Setting a password for <strong className="text-[#0B1220] break-all">{email}</strong>
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

              {error && (
                <div className="rounded-xl bg-[#FFF1F5] px-3.5 py-2.5 text-[12px] font-semibold text-[#D62E6B]">
                  {error}
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
