'use client';

/**
 * QR Standee Builder — /dashboard/admin/qr-builder
 *
 * Premium print-ready A4 standee generator for clinic managers.
 * Dependency: react-qrcode-logo (npm install react-qrcode-logo)
 */

import { useState, useEffect } from 'react';
import { useSubscription } from '@/lib/subscription-context';
import {
  Printer,
  QrCode,
  Stethoscope,
  Palette,
  Grid3X3,
  Smartphone,
  Scan,
  Ticket,
  Building2,
  Link2,
  CheckCircle,
  User,
} from 'lucide-react';
import PremiumQRCode from '@/components/PremiumQRCode';

// ── Config ────────────────────────────────────────────────────────────────
const YOUR_DOMAIN = 'https://opedox.app';

const THEMES = [
  { label: 'Opedox Emerald', value: '#25D366', bg: '#f0fdf4', ring: '#bbf7d0' },
  { label: 'Premium Slate', value: '#0f172a', bg: '#f8fafc', ring: '#cbd5e1' },
  { label: 'Royal Indigo', value: '#4f46e5', bg: '#eef2ff', ring: '#c7d2fe' },
  { label: 'Crimson Care', value: '#dc2626', bg: '#fff1f2', ring: '#fecdd3' },
] as const;

const PATTERNS = [
  { label: 'Smooth Dots', value: 'dots' as const },
  { label: 'Classic Squares', value: 'squares' as const },
] as const;

type ThemeValue = typeof THEMES[number]['value'];
type PatternValue = typeof PATTERNS[number]['value'];

// ── Helpers ───────────────────────────────────────────────────────────────
function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// ── Left panel sub-components ─────────────────────────────────────────────
function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <p className="flex items-center gap-2 text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-2">
      <Icon size={12} className="shrink-0" />
      {label}
    </p>
  );
}

function TextInput({
  id, value, onChange, placeholder,
}: { id: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition
                 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
    />
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────
export default function QRBuilderPage() {
  const { clinicSlug: contextSlug, clinicName: contextName } = useSubscription();
  const [clinicName, setClinicName] = useState('Loading...');
  const [clinicSlug, setClinicSlug] = useState('loading');
  const [themeColor, setThemeColor] = useState<ThemeValue>('#25D366');
  const [qrPattern, setQrPattern] = useState<PatternValue>('dots');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync context into editable state
  useEffect(() => {
    if (contextName) setClinicName(contextName);
    if (contextSlug) setClinicSlug(contextSlug);
  }, [contextName, contextSlug]);

  const origin = isMounted && typeof window !== 'undefined' ? window.location.origin : YOUR_DOMAIN;
  const liveUrl = `${origin}/clinic/${clinicSlug || 'your-clinic'}`;

  const activeTheme = THEMES.find((t) => t.value === themeColor) ?? THEMES[0];
  const activeColorCode = themeColor;

  return (
    <>
      {/* ── Print Engine Hijack ──────────────────────────────────────────
          Forces correct print colors and removes browser chrome
      ─────────────────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          /* Hide absolutely everything on the page */
          body * {
            visibility: hidden;
          }
          
          /* Make only the standee and its children visible */
          #printable-standee, #printable-standee * {
            visibility: visible;
          }
          
          /* Rip the standee out of its layout and pin it to the paper */
          #printable-standee {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            height: 297mm;      /* Lock exactly to A4 height */
            max-height: 297mm;  /* Prevent overflow */
            overflow: hidden;   /* Clip anything that tries to spill over */
            page-break-inside: avoid;
            margin: 0;
            padding: 0;
          }

          /* Force background colors and remove browser margins */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          @page {
            margin: 0;
            size: A4 portrait;
          }
        }
      `}</style>

      <div className="w-full max-w-7xl mx-auto p-6 lg:p-10 print:p-0 print:block">
        <div className="flex flex-col lg:flex-row gap-10 items-start justify-center w-full print:block">

        {/* ════════════════════════════════════════════════════════════
            LEFT PANEL — Controls
        ════════════════════════════════════════════════════════════ */}
        <aside className="w-full lg:w-1/3 flex-shrink-0 flex flex-col gap-6 border border-slate-800 rounded-2xl overflow-hidden bg-slate-900/40 print:hidden">

          {/* Header */}
          <div className="px-6 py-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow">
                <QrCode size={18} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-100 leading-none">QR Standee Builder</h1>
                <p className="text-[11px] text-slate-500 mt-0.5">Live preview · Print-ready A4</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6 px-6 pb-6 flex-1">

            {/* ── Clinic Name ── */}
            <div>
              <SectionLabel icon={Building2} label="Clinic Name" />
              <TextInput
                id="clinic-name"
                value={clinicName}
                onChange={setClinicName}
                placeholder="e.g. Sunrise Clinic"
              />
            </div>

            {/* ── Clinic Slug ── */}
            <div>
              <SectionLabel icon={Link2} label="Clinic Slug" />
              <TextInput
                id="clinic-slug"
                value={clinicSlug}
                onChange={(v) => setClinicSlug(slugify(v))}
                placeholder="e.g. sunrise-clinic"
              />
              <p className="mt-1.5 text-[10px] text-slate-600 font-mono truncate">
                {liveUrl}
              </p>
            </div>

            {/* ── Theme Color ── */}
            <div>
              <SectionLabel icon={Palette} label="Theme Color" />
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((t) => {
                  const active = themeColor === t.value;
                  return (
                    <button
                      key={t.value}
                      onClick={() => setThemeColor(t.value)}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all"
                      style={{
                        borderColor: active ? t.value : 'rgba(71,85,105,0.5)',
                        background: active ? `${t.value}20` : 'rgba(15,23,42,0.6)',
                        color: active ? '#f1f5f9' : '#94a3b8',
                        boxShadow: active ? `0 0 0 1px ${t.value}55` : 'none',
                      }}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/10"
                        style={{ background: t.value }}
                      />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── QR Pattern ── */}
            <div>
              <SectionLabel icon={Grid3X3} label="QR Pattern" />
              <div className="flex gap-2">
                {PATTERNS.map((p) => {
                  const active = qrPattern === p.value;
                  return (
                    <button
                      key={p.value}
                      onClick={() => setQrPattern(p.value)}
                      className="flex-1 py-2.5 rounded-xl border text-xs font-medium transition-all"
                      style={{
                        borderColor: active ? '#6366f1' : 'rgba(71,85,105,0.5)',
                        background: active ? 'rgba(99,102,241,0.12)' : 'rgba(15,23,42,0.6)',
                        color: active ? '#a5b4fc' : '#94a3b8',
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Settings summary ── */}
            <div className="rounded-xl bg-slate-900 border border-slate-700/50 px-4 py-3 text-xs space-y-1.5 mt-2">
              {[
                ['Theme', activeTheme.label],
                ['Pattern', PATTERNS.find((p) => p.value === qrPattern)?.label ?? ''],
                ['URL', liveUrl],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className="text-slate-500 shrink-0">{k}</span>
                  <span className="text-slate-200 font-medium truncate text-right">{v}</span>
                </div>
              ))}
            </div>

            {/* ── Print button ── */}
            <button
              onClick={() => window.print()}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-sm font-semibold text-white transition-all active:scale-[0.97] select-none"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                boxShadow: '0 4px 20px rgba(99,102,241,0.4)',
              }}
            >
              <Printer size={16} />
              Print / Save as PDF
            </button>
          </div>
        </aside>

        {/* ════════════════════════════════════════════════════════════
            RIGHT PANEL — Live A4 Preview
        ════════════════════════════════════════════════════════════ */}
        <div className="w-full lg:w-2/3 flex flex-col items-center justify-center min-w-0 relative print:block print:w-full">

          {/* Dot-grid backdrop */}
          <div
            className="absolute inset-0 pointer-events-none print:hidden"
            style={{
              backgroundImage: 'radial-gradient(circle,rgba(99,102,241,0.05) 1px,transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />

          {/* ── A4 Standee ── */}
          <div
            id="printable-standee"
            className="w-full max-w-[210mm] aspect-[1/1.414] bg-white shadow-2xl relative overflow-hidden flex flex-col rounded-2xl text-slate-900"
            style={{ borderColor: themeColor, borderWidth: '16px' }}
          >
            {/* Top accent bar */}
            <div
              className="h-2.5 w-full shrink-0"
              style={{ background: `linear-gradient(90deg, ${themeColor}, ${themeColor}99)` }}
            />

            <div className="flex flex-col items-center justify-start gap-3 pt-8 pb-20 mx-auto w-full px-12">

              {/* ── Clinic icon + name ── */}
              <div className="flex flex-col items-center gap-3 mb-2">
                <div
                  className="w-28 h-28 rounded-[32px] flex items-center justify-center shadow-lg mb-4"
                  style={{
                    background: activeTheme.bg,
                    border: `2px solid ${activeTheme.ring}`,
                  }}
                >
                  <Stethoscope size={64} style={{ color: themeColor }} />
                </div>

                <h2
                  className="text-4xl font-extrabold tracking-tight text-slate-900 text-center leading-tight mb-2"
                >
                  {clinicName || 'Your Clinic Name'}
                </h2>

                {/* Thin rule */}
                <div
                  className="w-16 h-1 rounded-full"
                  style={{ background: `${themeColor}66` }}
                />
              </div>

              {/* ── CTA text ── */}
              <div className="flex flex-col items-center text-center mb-2 gap-1">
                <p className="text-3xl font-semibold text-slate-700 mt-4">
                  Scan to Join the Live Queue
                </p>
                <p
                  className="text-2xl font-medium text-slate-500 mt-2 mb-0"
                  dir="rtl"
                  lang="ur"
                >
                  اپنی باری کے لیے کیو آر کوڈ اسکین کریں
                </p>
              </div>

              {/* ── QR Code — premium SVG via qr-code-styling ── */}
              <div
                className="relative w-[320px] h-[320px] min-w-[320px] min-h-[320px] flex-shrink-0 mx-auto my-4 p-5 rounded-3xl"
                style={{
                  border: `2px solid ${activeColorCode}40`,
                  background: `${activeColorCode}05`,
                  boxShadow: `0 8px 40px ${activeColorCode}18, 0 2px 8px rgba(0,0,0,0.06)`,
                }}
              >
                {/* Overlapping Badge */}
                <div 
                  className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full text-sm font-bold tracking-widest text-white shadow-md whitespace-nowrap"
                  style={{ background: activeColorCode }}
                >
                  SCAN WITH CAMERA
                </div>
                <div className="w-full h-full mx-auto flex items-center justify-center bg-white rounded-2xl shadow-sm p-3">
                  <PremiumQRCode data={liveUrl} color={activeColorCode} pattern={qrPattern} width={320} height={320} />
                </div>
              </div>

              {/* URL hint */}
              <p className="text-base text-slate-400 font-mono mt-2 mb-4 tracking-tight">
                {liveUrl}
              </p>

              {/* ── 3-step instructions ── */}
              <div className="w-full">
                <p className="text-sm font-bold tracking-widest uppercase text-slate-400 text-center mb-3">
                  How it works
                </p>
                <div
                  className="flex flex-row justify-center gap-8 w-full mt-4"
                  style={{
                    background: `${themeColor}06`,
                    borderRadius: '24px',
                    border: `1px solid ${themeColor}14`,
                    padding: '24px',
                  }}
                >
                  {([
                    { icon: Smartphone, step: '1', title: 'Open Camera', sub: 'Point at the code' },
                    { icon: CheckCircle, step: '2', title: 'Scan Code', sub: 'Auto-detects QR' },
                    { icon: User, step: '3', title: 'Get Token', sub: 'Your live number' },
                  ] as { icon: React.ElementType; step: string; title: string; sub: string }[]).map(
                    ({ icon: StepIcon, step, title, sub }) => (
                      <div key={step} className="flex flex-col items-center gap-4 text-center">
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-black shadow-sm"
                          style={{ background: themeColor }}
                        >
                          {step}
                        </div>
                        <StepIcon size={40} style={{ color: themeColor }} className="opacity-80" />
                        <div>
                          <p className="text-xl font-bold text-slate-700 leading-none">{title}</p>
                          <p className="text-sm text-slate-500 mt-2">{sub}</p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="absolute bottom-4 left-0 w-full flex flex-col items-center justify-center bg-white z-10">
              <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                Powered by Opedox
              </p>
              <p className="text-sm font-bold text-slate-800 mt-1">opedox.com</p>
            </div>

            {/* Bottom accent bar */}
            <div
              className="h-1.5 w-full shrink-0"
              style={{ background: `linear-gradient(90deg, ${themeColor}99, ${themeColor})` }}
            />
          </div>
        </div>

        </div>{/* end flex-col lg:flex-row */}
      </div>{/* end max-w-7xl wrapper */}
    </>
  );
}
