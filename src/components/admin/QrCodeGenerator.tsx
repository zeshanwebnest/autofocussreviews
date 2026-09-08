'use client';

import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Client } from '@/types/app.types';

interface QrCodeGeneratorProps {
  client: Client;
}

export function QrCodeGenerator({ client }: QrCodeGeneratorProps) {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine feedback URL
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://autofocuss-reviews.vercel.app';
  const feedbackUrl = `${origin}/f/${client.id}`;

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(feedbackUrl, {
      width: 600,
      margin: 2,
      color: {
        dark: '#0B1220',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    }).then((url) => {
      if (isMounted) setDataUrl(url);
    });
    return () => {
      isMounted = false;
    };
  }, [feedbackUrl]);

  const downloadPng300Dpi = async () => {
    setIsGenerating(true);
    try {
      // 300 DPI target for 4" x 4" table tent = 2400 x 2400 pixels
      const highResDataUrl = await QRCode.toDataURL(feedbackUrl, {
        width: 2400,
        margin: 3,
        color: {
          dark: '#0B1220',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      const link = document.createElement('a');
      link.href = highResDataUrl;
      link.download = `qr-stand-${client.id}-300dpi.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Failed to generate high DPI PNG', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSvg = async () => {
    try {
      const svgString = await QRCode.toString(feedbackUrl, {
        type: 'svg',
        width: 1000,
        margin: 2,
        color: {
          dark: '#0B1220',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      });

      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qr-${client.id}-vector.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to generate SVG', err);
    }
  };

  return (
    <div className="bg-white border border-[#E6EAF2] rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* QR Preview Box */}
        <div className="flex-shrink-0 text-center">
          <div className="p-4 bg-white border-2 border-[#E6EAF2] rounded-2xl shadow-md inline-block">
            {dataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={dataUrl}
                alt={`QR code for ${client.business_name}`}
                className="w-48 h-48 sm:w-56 sm:h-56 rounded-lg object-contain"
              />
            ) : (
              <div className="w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center bg-gray-50 text-xs text-gray-400">
                Generating QR…
              </div>
            )}
          </div>
          <p className="text-[11px] text-[#8A93A3] mt-2 font-mono break-all max-w-[240px]">
            {feedbackUrl}
          </p>
        </div>

        {/* Info & Download actions */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: client.brand_colour || '#2563EB' }} />
              <h3 className="text-xl font-bold text-[#0B1220]">
                {client.business_name} QR Stand
              </h3>
            </div>
            <p className="text-sm text-[#5B6472] mt-1 leading-relaxed">
              Place this QR code on bill folders, acrylic table tents, or billing counter stands. When scanned, it opens the rapid 5-second rating capture flow.
            </p>
          </div>

          <div className="bg-[#F5F8FF] border border-[#E6EAF2] rounded-xl p-4 space-y-2 text-xs text-[#5B6472]">
            <div className="flex justify-between">
              <span className="font-semibold text-[#0B1220]">Print Resolution:</span>
              <span className="font-mono font-bold text-[#00C896]">300+ DPI (2400×2400px)</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[#0B1220]">Format:</span>
              <span>Vector SVG & High-Res PNG</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-[#0B1220]">Target URL:</span>
              <span className="font-mono text-[#2563EB]">/f/{client.id}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={downloadPng300Dpi}
              disabled={isGenerating || !dataUrl}
              className="btn btn-primary text-xs font-bold py-2.5 px-4 flex items-center gap-2 text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download 300 DPI PNG (Print)</span>
            </button>

            <button
              type="button"
              onClick={downloadSvg}
              disabled={!dataUrl}
              className="btn btn-outline text-xs font-bold py-2.5 px-4 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download Vector SVG</span>
            </button>

            <a
              href={feedbackUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline text-xs font-bold py-2.5 px-4 flex items-center gap-2 border-dashed"
            >
              <span>Open Live Form ↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
