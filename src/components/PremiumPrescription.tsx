import { Stethoscope, ShieldCheck } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
export interface MedItem {
  id?: string;
  name: string;
  dosage: string;
  duration: string;
  instructions: string;
}

export interface PremiumPrescriptionProps {
  patientName: string;
  medications: MedItem[];
  advice?: string[];
  notes?: string;
  createdAt: string;
  prescriptionId?: string;
  // Optional clinic/doctor overrides
  clinicName?: string;
  doctorName?: string;
  clinicAddress?: string;
  doctorCredentials?: string;
  doctorSpecialization?: string;
  /** If provided, renders a cursive digital signature in the footer. Falls back to doctorName. */
  doctorSignatureName?: string;
  /** If provided, renders an uploaded image for the signature. Overrides doctorSignatureName. */
  signatureImageUrl?: string;
  /** Consultation fee in PKR — if set, rendered near the Rx ID in the footer. */
  consultationFee?: number | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}


// ─── Main Component ───────────────────────────────────────────────────────────

export default function PremiumPrescription({
  patientName,
  medications,
  advice = [],
  notes = '',
  createdAt,
  prescriptionId,
  clinicName,
  doctorName,
  clinicAddress,
  doctorCredentials,
  doctorSpecialization,
  doctorSignatureName,
  signatureImageUrl,
  consultationFee,
}: PremiumPrescriptionProps) {
  const issueDate = formatDate(createdAt);
  const shortId = prescriptionId?.split('-')[0].toUpperCase() ?? null;

  return (
    <div
      id="print-prescription"
      className="w-full max-w-[794px] mx-auto bg-white text-slate-900 shadow-2xl print:shadow-none print:max-w-full"
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="flex items-start justify-between gap-6 border-b-2 border-slate-200 px-10 pb-6 pt-8 print:px-8 print:pt-6 print:border-slate-300">
        {/* Left: Clinic branding */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg print:shadow-none">
            <Stethoscope className="h-7 w-7 text-white" strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
              {clinicName}
            </h1>
            <p className="text-sm font-medium text-emerald-600 mt-0.5">Digital Healthcare Platform</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" strokeWidth={2} />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-500">
                Verified E-Prescription
              </span>
            </div>
          </div>
        </div>

        {/* Right: Doctor info + date */}
        <div className="text-right shrink-0">
          <p className="text-base font-bold text-slate-800">{doctorName}</p>
          <p className="text-[12px] text-slate-500 mt-0.5">{doctorCredentials}</p>
          {doctorSpecialization && (
            <p className="text-[12px] text-emerald-600 font-medium">{doctorSpecialization}</p>
          )}
          <p className="mt-1 text-[11px] text-slate-400">{clinicAddress}</p>
          <div className="mt-2 inline-block rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 print:border-slate-300">
            <span className="text-xs font-semibold text-slate-600">{issueDate}</span>
          </div>
        </div>
      </header>

      {/* ── Patient Info Grid ────────────────────────────────────────────── */}
      <div className="mx-10 mt-5 rounded-xl border border-slate-200 bg-slate-50 px-6 py-4 print:mx-8 print:border-slate-300">
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4">
          {[
            { label: 'Patient Name', value: patientName },
            { label: 'Age', value: '—' },
            { label: 'Gender', value: '—' },
            { label: 'Weight', value: '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                {label}
              </span>
              <span className="text-sm font-bold text-slate-800">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Rx Body ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-7 px-10 py-7 print:px-8">

        {/* ── Medications ──────────────────────────────────────────────── */}
        <section>
          {/* Giant Rx emblem row */}
          <div className="mb-3 flex items-baseline gap-4">
            <span
              className="font-serif text-7xl font-black leading-none text-emerald-500/25 select-none print:text-emerald-600/30"
              aria-hidden="true"
            >
              ℞
            </span>
            <div className="flex-1 border-b-2 border-dashed border-slate-200 pb-1 print:border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Prescribed Medications{medications.length > 0 ? ` (${medications.length})` : ''}
              </span>
            </div>
          </div>

          {medications.length === 0 ? (
            <p className="text-sm text-slate-400 italic">No medications prescribed.</p>
          ) : (
            /* High-density typographic list — no cards, no shadows, pure text */
            <ol className="list-none">
              {medications.map((med, i) => (
                <li
                  key={med.id ?? `med-${i}`}
                  className="border-b border-gray-200 py-2 last:border-b-0"
                >
                  {/* Row 1: index · name (left) + duration (right) */}
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[15px] font-bold text-slate-900 leading-snug">
                      <span className="mr-1.5 font-normal text-slate-400">{i + 1}.</span>
                      {med.name}
                    </span>
                    <span className="shrink-0 text-sm text-slate-500 tabular-nums">
                      {med.duration}
                    </span>
                  </div>

                  {/* Row 2: Sig + instructions — indented to align under name */}
                  <div className="ml-5 mt-0.5">
                    <span className="text-sm text-gray-600">
                      Sig: {med.dosage}{med.instructions ? ` • ${med.instructions}` : ''}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>


        {/* ── Doctor's Advice ──────────────────────────────────────────── */}
        {advice.length > 0 && (
          <section>
            <div className="mb-3 border-b border-slate-200 pb-2 print:border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Doctor&apos;s Advice
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {advice.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-2.5 print:border-emerald-200 print:bg-transparent"
                >
                  <span className="text-emerald-500 font-bold">✓</span>
                  <span className="text-sm font-medium text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Notes ───────────────────────────────────────────────────── */}
        {notes.trim() && (
          <section>
            <div className="mb-3 border-b border-slate-200 pb-2 print:border-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Additional Notes
              </span>
            </div>
            <div className="flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 print:border-amber-300 print:bg-transparent">
              <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
              <p className="text-sm leading-relaxed text-slate-700">{notes}</p>
            </div>
          </section>
        )}

        {/* ── Divider ─────────────────────────────────────────────────── */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent print:bg-slate-300" />

        {/* ── Signature + Rx ID ───────────────────────────────────────── */}
        <div className="flex items-end justify-between">
          {/* Left: Prescription ID + Consultation Fee */}
          <div className="flex flex-col gap-1">
            {shortId && (
              <p className="text-[10px] font-mono text-slate-400">
                Rx ID: <span className="font-bold text-slate-600">#{shortId}</span>
              </p>
            )}
            {prescriptionId && (
              <code className="text-[9px] font-mono text-slate-300 break-all max-w-[220px]">
                {prescriptionId}
              </code>
            )}
            {consultationFee != null && (
              <p className="mt-1.5 text-[11px] font-semibold text-slate-600">
                Consultation Fee:{' '}
                <span className="text-emerald-600">Rs. {consultationFee.toLocaleString()}</span>
              </p>
            )}
          </div>

          {/* Right: Doctor digital signature block */}
          <div className="flex flex-col items-center gap-1">
            {/* Signature Area (Image or Text Fallback) */}
            <div className="flex h-14 w-48 items-end justify-center pb-1">
              {signatureImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img 
                  src={signatureImageUrl} 
                  alt={`${doctorName} Signature`} 
                  className="max-h-14 max-w-full object-contain"
                />
              ) : (
                <span
                  className="text-2xl font-bold text-slate-700 leading-none select-none"
                  style={{ fontFamily: 'var(--font-dancing-script), "Brush Script MT", cursive' }}
                >
                  {doctorSignatureName ?? doctorName}
                </span>
              )}
            </div>
            <div className="w-48 border-b-2 border-slate-400" />
            <p className="text-xs font-bold text-slate-700 mt-1">{doctorName}</p>
            <p className="text-[10px] text-slate-400">{doctorCredentials}</p>
            {doctorSpecialization && (
              <p className="text-[10px] text-emerald-600">{doctorSpecialization}</p>
            )}
            <p className="mt-1 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-emerald-600">
              <ShieldCheck className="h-3 w-3" strokeWidth={2} />
              Digitally Signed
            </p>
          </div>
        </div>
      </div>

      {/* ── Powered-by footer ────────────────────────────────────────────── */}
      <div className="border-t border-slate-100 bg-slate-50/50 px-10 py-3 text-center print:bg-transparent print:border-slate-200">
        <p className="text-[10px] font-medium text-slate-400 tracking-wide">
          Powered by{' '}
          <span className="font-bold text-emerald-600">Opedox</span>
          {' '}— Modern Clinical Infrastructure
        </p>
      </div>
    </div>
  );
}
