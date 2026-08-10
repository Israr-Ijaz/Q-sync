import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { PrintButton } from './print-button';
import {
  Stethoscope,
  ShieldCheck,
  Pill,
  CalendarClock,
  CheckCircle2,
  Clock,
  Hash,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface MedItem {
  id?: string;
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

interface Prescription {
  id: string;
  patient_name: string;
  medications: MedItem[] | null;
  advice: string[] | null;
  notes: string | null;
  created_at: string;
  clinic_id: string | null;
}


// ─── Dosage Ring ───────────────────────────────────────────────────────────────
// Renders Morning-Afternoon-Night pills from a "1-0-1" string
function DosageDisplay({ dosage }: { dosage: string }) {
  const parts = dosage.split('-');
  const labels = ['M', 'A', 'N'];
  const fullLabels = ['Morning', 'Afternoon', 'Night'];

  // If it doesn't match M-A-N format, just show it as text
  if (parts.length !== 3) {
    return (
      <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1 text-sm font-bold text-emerald-700">
        {dosage}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5" title={parts.map((v, i) => `${fullLabels[i]}: ${v === '1' ? '1 tablet' : 'Skip'}`).join(' · ')}>
      {parts.map((val, i) => (
        <span
          key={labels[i]}
          className={`inline-flex flex-col items-center justify-center rounded-lg border px-2.5 py-1 text-center ${
            val === '1'
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
              : 'border-slate-200 bg-slate-50 text-slate-400'
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider">{labels[i]}</span>
          <span className={`text-sm font-bold leading-none ${val === '1' ? 'text-emerald-600' : 'text-slate-300'}`}>
            {val}
          </span>
        </span>
      ))}
      <span className="ml-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
        {dosage}
      </span>
    </div>
  );
}

// ─── Med Card ─────────────────────────────────────────────────────────────────
function MedCard({ med, index }: { med: MedItem; index: number }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm print:border-slate-300 print:shadow-none">
      {/* Index badge */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-black text-white shadow-sm">
        {index + 1}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 min-w-0">
        {/* Medicine name */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Pill className="h-4 w-4 shrink-0 text-emerald-600" strokeWidth={2} />
            <h3 className="text-[15px] font-bold tracking-tight text-slate-900 leading-tight">
              {med.name}
            </h3>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-semibold text-slate-500 print:border-slate-300">
            <Clock className="inline h-2.5 w-2.5 mr-0.5 -mt-px" strokeWidth={2} />
            {med.duration}
          </span>
        </div>

        {/* Dosage */}
        <DosageDisplay dosage={med.dosage} />

        {/* Instructions */}
        {med.instructions && (
          <p className="text-xs font-medium text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100 print:bg-transparent print:border-slate-200">
            ✦ {med.instructions}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Section Heading ──────────────────────────────────────────────────────────
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-200/80 pb-3 print:border-slate-300">
      <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">{children}</h2>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function RxPage({
  params,
}: {
  params: Promise<{ prescriptionId: string }>;
}) {
  const { prescriptionId } = await params;

  // ── Fetch from Supabase ──
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('prescriptions')
    .select('id, patient_name, medications, advice, notes, created_at, clinic_id')
    .eq('id', prescriptionId)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const rx = data as Prescription;

  // ── Safe-parse JSONB medications ──
  let medications: MedItem[] = [];
  if (Array.isArray(rx.medications)) {
    medications = rx.medications;
  } else if (typeof rx.medications === 'string') {
    try {
      const parsed = JSON.parse(rx.medications);
      if (Array.isArray(parsed)) medications = parsed;
    } catch {
      medications = [];
    }
  }

  // ── Safe-parse advice ──
  const advice: string[] = Array.isArray(rx.advice) ? rx.advice : [];
  const notes: string = rx.notes ?? '';

  // ── Format date ──
  const issueDate = new Date(rx.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const issueTime = new Date(rx.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Short ID for display ──
  const shortId = rx.id.split('-')[0].toUpperCase();

  return (
    <>
      {/* Global print styles injected inline */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
              body { background: white !important; }
              @page { margin: 0.75in; size: A4; }
            }
          `,
        }}
      />

      {/* ── Page Shell ── */}
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-emerald-50/30 to-slate-100 py-8 px-4 print:bg-white print:p-0 print:py-0">
        {/* ── Prescription Card ── */}
        <main
          id="rx-card"
          className="mx-auto max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200/80 print:shadow-none print:border-none print:rounded-none print:max-w-full"
        >
          {/* ── Clinic Header ── */}
          <header className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-6 py-7 print:from-emerald-700 print:to-teal-600">
            {/* Subtle mesh overlay */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-10 print:hidden"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 10% 50%, rgba(255,255,255,0.4) 0%, transparent 50%), radial-gradient(circle at 90% 20%, rgba(255,255,255,0.2) 0%, transparent 50%)',
              }}
            />

            <div className="relative flex items-start justify-between gap-4">
              {/* Left: Branding */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 backdrop-blur-sm">
                    <Stethoscope className="h-5 w-5 text-white" strokeWidth={1.75} />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight text-white leading-tight">
                      QSync Digital Clinic
                    </h1>
                    <p className="text-emerald-100 text-xs font-medium">
                      Digital Healthcare Platform
                    </p>
                  </div>
                </div>

                {/* Verified badge */}
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 backdrop-blur-sm">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-200" strokeWidth={2} />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-white">
                    Official Verified E-Prescription
                  </span>
                </div>
              </div>

              {/* Right: Print button */}
              <PrintButton />
            </div>
          </header>

          {/* ── Patient Info Bar ── */}
          <div className="border-b border-slate-200/80 bg-slate-50/70 px-6 py-4 print:bg-slate-50 print:border-slate-300">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {/* Patient name */}
              <div className="col-span-2 sm:col-span-1 flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Patient Name
                </span>
                <span className="text-base font-bold text-slate-900 leading-tight">
                  {rx.patient_name}
                </span>
              </div>

              {/* Issue date */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Issue Date
                </span>
                <div className="flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                  <span className="text-sm font-semibold text-slate-700">
                    {issueDate}
                  </span>
                </div>
              </div>

              {/* Issue time */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Issued At
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-emerald-600" strokeWidth={2} />
                  <span className="text-sm font-semibold text-slate-700">{issueTime}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Card Body ── */}
          <div className="flex flex-col gap-7 px-6 py-7 print:px-0">

            {/* ── Section: Medications ── */}
            {medications.length > 0 && (
              <section aria-labelledby="rx-medications-heading">
                <div className="mb-4">
                  <SectionHeading>
                    <span id="rx-medications-heading">
                      Prescribed Medications ({medications.length})
                    </span>
                  </SectionHeading>
                </div>

                <div className="flex flex-col gap-3">
                  {medications.map((med, i) => (
                    <MedCard key={med.id ?? `med-${i}`} med={med} index={i} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty medications graceful fallback */}
            {medications.length === 0 && (
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-300 py-10 text-center">
                <Pill className="h-8 w-8 text-slate-300" strokeWidth={1.5} />
                <p className="text-sm text-slate-500">No medications were added to this prescription.</p>
              </div>
            )}

            {/* ── Section: Doctor's Advice ── */}
            {advice.length > 0 && (
              <section aria-labelledby="rx-advice-heading">
                <div className="mb-4">
                  <SectionHeading>
                    <span id="rx-advice-heading">Doctor&apos;s Advice</span>
                  </SectionHeading>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {advice.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 print:border-emerald-200 print:bg-transparent"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={2.5} />
                      <span className="text-sm font-medium text-slate-700">{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Section: Notes / Warning ── */}
            {notes.trim() && (
              <section aria-labelledby="rx-notes-heading">
                <div className="mb-4">
                  <SectionHeading>
                    <span id="rx-notes-heading">Additional Notes</span>
                  </SectionHeading>
                </div>

                <div className="flex gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/60 px-4 py-4 print:border-amber-300 print:bg-transparent">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" strokeWidth={2} />
                  <p className="text-sm leading-relaxed text-slate-700">{notes}</p>
                </div>
              </section>
            )}

            {/* ── Divider ── */}
            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent print:bg-slate-300" />

            {/* ── Authenticity Footer ── */}
            <footer className="flex flex-col gap-2 text-center print:text-left">
              <p className="text-[11px] font-medium text-slate-400">
                This is a verified digital prescription issued by QSync Medical Platform.
              </p>
              <div className="flex items-center justify-center gap-2 print:justify-start">
                <Hash className="h-3 w-3 text-slate-400" strokeWidth={2} />
                <code className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[11px] text-slate-500 print:border-slate-300">
                  {rx.id}
                </code>
              </div>
              <p className="text-[10px] text-slate-300">
                Short ID: #{shortId} · Powered by QSync
              </p>
            </footer>
          </div>
        </main>

        {/* Below-card note (screen only) */}
        <p className="mt-6 text-center text-xs text-slate-400 print:hidden">
          Share this page link with your pharmacy or save it as a PDF using the Print button above.
        </p>
      </div>
    </>
  );
}
