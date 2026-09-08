'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError('Invalid email or password.');
      return;
    }

    router.push('/admin');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#F5F8FF] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <a href="/" className="text-2xl font-black tracking-tight text-[#0B1220]">
            D<span className="text-[#00C896]">(AI)</span>Y
          </a>
          <p className="text-xs font-bold text-[#8A93A3] uppercase tracking-wider mt-1">
            Admin Control Login
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white border border-[#E6EAF2] rounded-2xl shadow-sm p-6 space-y-4"
        >
          {error && (
            <div className="p-3 bg-[#FFF1F5] border border-[#FED7D7] rounded-xl text-xs font-semibold text-[#FF4D8D]">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-xs font-bold text-[#0B1220] uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-sm rounded-xl border border-[#E6EAF2] bg-white text-[#0B1220] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-bold text-[#0B1220] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 text-sm rounded-xl border border-[#E6EAF2] bg-white text-[#0B1220] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full font-bold text-sm text-white py-3 rounded-xl"
            style={{ backgroundColor: '#2563EB', opacity: isSubmitting ? 0.75 : 1 }}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
