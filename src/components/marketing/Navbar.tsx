'use client';

import React from 'react';

interface NavbarProps {
  buyNowUrl?: string;
}

export function Navbar({ buyNowUrl = 'https://autofocuss.com/checkout/?add-to-cart=57' }: NavbarProps) {
  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#E6EAF2]">
      <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-4 sm:py-4.5 flex items-center justify-between">
        {/* Brand Logo */}
        <a href="#" className="font-black text-[22px] tracking-tight text-[#0B1220] flex items-center gap-0.5">
          <span>D</span>
          <span className="text-[#00C896]">(AI)</span>
          <span>Y</span>
        </a>

        {/* Anchor Links (Desktop) */}
        <div className="hidden md:flex items-center gap-8 text-[14.5px] font-semibold text-[#5B6472]">
          <a href="#features" className="hover:text-[#0B1220] transition-colors">Features</a>
          <a href="#cost" className="hover:text-[#0B1220] transition-colors">The Cost</a>
          <a href="#how" className="hover:text-[#0B1220] transition-colors">How It Works</a>
          <a href="#demo" className="hover:text-[#0B1220] transition-colors">Live Demo</a>
          <a href="#pricing" className="hover:text-[#0B1220] transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-[#0B1220] transition-colors">FAQ</a>
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-3">
          <a
            href="#demo"
            className="btn btn-outline text-xs sm:text-[14.5px] py-2 px-3.5 sm:py-2.5 sm:px-5"
          >
            Try Demo
          </a>
          <a
            href={buyNowUrl}
            className="btn btn-primary text-xs sm:text-[14.5px] py-2 px-4 sm:py-2.5 sm:px-6 text-white"
          >
            Buy Now
          </a>
        </div>
      </div>
    </nav>
  );
}
