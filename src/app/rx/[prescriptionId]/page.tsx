import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PremiumPrescription, { type MedItem } from '@/components/PremiumPrescription';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Prescription {
  id: string;
  patient_name: string;
  medications: MedItem[] | null;
  advice: string[] | null;
  notes: string | null;
  created_at: string;
  clinic_id: string | null;
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

  return (
    <>
      {/* ── Page Shell — soft gray background so doc pops ── */}
      {/* Global print reset is in globals.css (@media print) */}
      <div className="min-h-screen bg-slate-100 py-10 px-4 print:bg-white print:p-0 print:py-0">

        {/* ── Premium Prescription Document ── */}
        <PremiumPrescription
          patientName={rx.patient_name}
          medications={medications}
          advice={advice}
          notes={notes}
          createdAt={rx.created_at}
          prescriptionId={rx.id}
        />

        {/* ── Viral "Powered by" Footer Banner (screen only, never printed) ── */}
        <div className="print-hide mx-auto mt-8 w-full max-w-[794px]">
          <hr className="mb-6 border-slate-300" />

          <a
            href="https://wa.me/923000000000?text=Hi%2C%20I%20am%20a%20doctor%20interested%20in%20Opedox"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Get Opedox for your clinic — WhatsApp enquiry"
            className="group block rounded-2xl border border-emerald-200/70 bg-gradient-to-r from-emerald-50 to-teal-50 px-6 py-5 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-md hover:border-emerald-300 active:scale-[0.99]"
          >
            <div className="flex flex-col items-center gap-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
              {/* Left copy */}
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-slate-400">
                  Queue &amp; Prescription Powered by Opedox.
                </p>
                <p className="text-base font-bold text-emerald-700 group-hover:text-emerald-600 transition-colors leading-snug">
                  🚀 Are you a doctor? Get Opedox for your clinic.
                </p>
              </div>

              {/* Right CTA pill */}
              <span className="mt-2 inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm group-hover:bg-emerald-500 transition-colors sm:mt-0">
                Chat on WhatsApp
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </span>
            </div>
          </a>

          {/* Below-card note */}
          <p className="mt-4 text-center text-xs text-slate-400">
            Share this page link with your pharmacy or save it as a PDF using your browser&apos;s print function.
          </p>
        </div>
      </div>
    </>
  );
}

