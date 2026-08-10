'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      id="rx-print-btn"
      onClick={() => window.print()}
      className="print:hidden flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 active:scale-95"
      aria-label="Print or save this prescription as PDF"
    >
      <Printer className="h-4 w-4" strokeWidth={2} />
      <span className="hidden sm:inline">Print / Save PDF</span>
      <span className="sm:hidden">Print</span>
    </button>
  );
}
