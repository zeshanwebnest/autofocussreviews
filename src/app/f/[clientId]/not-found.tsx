import React from 'react';
import Link from 'next/link';

export default function ClientNotFound() {
  return (
    <main className="min-h-screen bg-[#F5F8FF] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-[#E6EAF2] rounded-3xl p-8 text-center shadow-card">
        <div className="w-16 h-16 mx-auto rounded-full bg-[#FFF1F5] flex items-center justify-center text-2xl text-[#FF4D8D] mb-4">
          🔍
        </div>
        <h1 className="text-2xl font-black text-[#0B1220] tracking-tight mb-2">
          Business Not Found
        </h1>
        <p className="text-sm text-[#5B6472] leading-relaxed mb-6">
          This feedback link is either invalid, paused, or no longer active. Please check the QR code or link provided at the counter.
        </p>
        <Link
          href="/"
          className="btn btn-outline w-full text-sm font-bold py-3 hover:bg-[#0B1220] hover:text-white"
        >
          Return to Homepage
        </Link>
      </div>
    </main>
  );
}
