import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import ClinicSettingsForm from './_components/ClinicSettingsForm'

// ---------------------------------------------------------------------------
// Page — Server Component: fetches clinic data, then delegates form to client
// ---------------------------------------------------------------------------
export default async function ClinicSettingsPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, clinic_id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, address, consultation_fee, payment_bank_name, payment_account_title, payment_account_number, clinic_whatsapp_number')
    .eq('id', profile.clinic_id)
    .maybeSingle()

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-white">Clinic Settings</h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Update your clinic&apos;s name, address, consultation fee, and payment details.
        </p>
      </div>

      {/* ── Form Card ── */}
      <div className="rounded-2xl border border-white/[0.07] bg-slate-900/50 backdrop-blur-sm p-6 sm:p-8 shadow-xl">
        <ClinicSettingsForm
          initialName={clinic?.name ?? ''}
          initialAddress={clinic?.address ?? ''}
          initialFee={(clinic as { consultation_fee?: number | null } | null)?.consultation_fee ?? null}
          initialPaymentBankName={(clinic as any)?.payment_bank_name ?? null}
          initialPaymentAccountTitle={(clinic as any)?.payment_account_title ?? null}
          initialPaymentAccountNumber={(clinic as any)?.payment_account_number ?? null}
          initialClinicWhatsappNumber={(clinic as any)?.clinic_whatsapp_number ?? null}
        />
      </div>
    </div>
  )
}
