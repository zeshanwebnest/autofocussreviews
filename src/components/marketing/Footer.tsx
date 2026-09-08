'use client';

import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-[#E6EAF2] pt-14 pb-10 bg-white" id="contact">
      <div className="wrap">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          {/* Logo & Links */}
          <div>
            <a href="#" className="font-black text-2xl tracking-tight text-[#0B1220] block mb-4">
              D<span className="text-[#00C896]">(AI)</span>Y
            </a>
            <div className="flex flex-wrap gap-6 text-xs sm:text-sm font-semibold text-[#5B6472]">
              <a href="#features" className="hover:text-[#0B1220]">Features</a>
              <a href="#cost" className="hover:text-[#0B1220]">The Cost</a>
              <a href="#how" className="hover:text-[#0B1220]">How It Works</a>
              <a href="#pricing" className="hover:text-[#0B1220]">Pricing</a>
              <a href="#faq" className="hover:text-[#0B1220]">FAQ</a>
              <a href="/admin" className="text-[#2563EB] hover:underline">Admin Login</a>
            </div>
          </div>

          {/* Social & Secured by Cashfree */}
          <div className="flex flex-col items-start md:items-end gap-3.5">
            <div className="flex gap-3">
              <span className="w-8 h-8 rounded-full border border-[#E6EAF2] flex items-center justify-center text-xs font-bold text-[#5B6472]">
                in
              </span>
              <span className="w-8 h-8 rounded-full border border-[#E6EAF2] flex items-center justify-center text-xs font-bold text-[#5B6472]">
                X
              </span>
              <span className="w-8 h-8 rounded-full border border-[#E6EAF2] flex items-center justify-center text-xs font-bold text-[#5B6472]">
                ig
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A93A3]">Secured by</span>
              <span className="text-xs font-extrabold text-[#0B1220] px-2 py-0.5 rounded bg-[#F5F8FF] border border-[#E6EAF2]">
                Cashfree Payments
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#E6EAF2] text-xs text-[#8A93A3] flex flex-col sm:flex-row justify-between gap-2">
          <p>&copy; 2026 Autofocuss D(AI)Y. All rights reserved.</p>
          <p>Built for local restaurants, cafés, salons, clinics, and retail in India.</p>
        </div>
      </div>
    </footer>
  );
}
