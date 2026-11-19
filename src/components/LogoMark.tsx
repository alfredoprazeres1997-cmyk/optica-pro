import React, { useState } from 'react';
import { Glasses } from 'lucide-react';

export function OpticaLogo({
  light = false,
  compact = false,
}: {
  light?: boolean;
  compact?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
      <div
        className={`flex items-center justify-center w-9 h-9 rounded-lg border ${
          light
            ? 'bg-sky-400/15 border-sky-300/30 text-sky-300'
            : 'bg-[#0B1F3A] border-[#16335B] text-sky-300'
        }`}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="6.5" cy="13" r="3.5" />
          <circle cx="17.5" cy="13" r="3.5" />
          <path d="M10 13c.6-.8 1.3-1.2 2-1.2s1.4.4 2 1.2" />
          <path d="M3 12.5 4.8 7.5c.3-.8 1-1.3 1.8-1.3H8" />
          <path d="M21 12.5 19.2 7.5c-.3-.8-1-1.3-1.8-1.3H16" />
        </svg>
      </div>
      {!compact && (
        <span
          className={`font-display text-base font-bold tracking-tight ${
            light ? 'text-white' : 'text-[#0B1F3A]'
          }`}
        >
          ÓPTICA <span className={light ? 'text-sky-300' : 'text-sky-600'}>PRO</span>
        </span>
      )}
    </div>
  );
}

export function ProductImage({
  src,
  alt,
  className = 'w-12 h-12 rounded-lg',
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-slate-100 to-sky-50 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0`}
        title={alt}
      >
        <Glasses className="w-5 h-5 text-[#0B1F3A]/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`${className} object-cover border border-slate-200 bg-slate-100 shrink-0`}
    />
  );
}
