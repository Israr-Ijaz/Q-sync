'use server'

import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { formatDoctorName } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClinicPayload {
  name: string
  slug: string
  address: string
  consultation_fee: number
  whatsapp_number: string
  bank_name: string
  bank_iban: string
  easypaisa_number: string
}

interface StaffMember {
  full_name: string
  password: string
  credentials: string
}

export interface VerifyAndSetupPayload {
  // OTP
  email: string
  otp: string
  // Owner
  owner_name: string
  // Clinic
  clinic: ClinicPayload
  // Doctors
  staff: StaffMember[]
}

export type VerifyAndSetupResult =
  | { success: true; clinicId: string; generatedStaff: { name: string; email: string; password: string }[] }
  | { error: string; cleanup?: 'auth_deleted' | 'auth_delete_failed' }

// ─── Helper: verbose Postgres error string ────────────────────────────────────
type PgError = { message?: string; code?: string; details?: string; hint?: string }
function pgMsg(err: PgError | null | undefined, prefix: string): string {
  if (!err) return `${prefix}: unknown error`
  const parts = [`${prefix}: ${err.message ?? 'unknown'}`]
  if (err.details) parts.push(`details: ${err.details}`)
  if (err.hint)    parts.push(`hint: ${err.hint}`)
  if (err.code)    parts.push(`code: ${err.code}`)
  return parts.join(' | ')
}

// ─── Main Server Action ───────────────────────────────────────────────────────
/**
 * verifyOtpAndSetupClinic
 *
 * Single server action that:
 *  1. Verifies the Supabase email OTP using the SSR user client (reads cookies
 *     set by the client-side signUp — @supabase/ssr propagates the session).
 *  2. Uses the Service Role admin client (bypasses RLS) to atomically seed:
 *       a) clinics row
 *       b) clinic_subscriptions row
 *       c) owner profiles row  (upsert, role = 'admin')
 *       d) doctor auth users + profiles
 *  3. On any DB failure, immediately deletes the auth user (admin API) so we
 *     never leave an orphaned account, and returns the exact Postgres error.
 */
export async function verifyOtpAndSetupClinic(
  payload: VerifyAndSetupPayload
): Promise<VerifyAndSetupResult> {
  const { email, otp, owner_name, clinic, staff } = payload

  // ── Defensive payload log ─────────────────────────────────────────────────
  console.log('[verifyOtpAndSetupClinic] Incoming payload:', JSON.stringify({
    email,
    otp_length: otp.length,
    owner_name,
    clinic_name: clinic.name,
    clinic_slug: clinic.slug,
    clinic_address: clinic.address,
    consultation_fee: clinic.consultation_fee,
    whatsapp_number: clinic.whatsapp_number,
    staff_count: staff.length,
  }, null, 2))

  // ── STEP 1: Verify OTP via SSR user client ────────────────────────────────
  // createServerClient() reads/writes cookies so the refreshed session is
  // available in subsequent requests. Uses the ANON key (not service role).
  const supabase = await createServerClient()
  const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
    email: email.trim().toLowerCase(),
    token: otp.replace(/\D/g, ''),
    type: 'signup',
  })

  if (verifyError || !verifyData.user) {
    console.error('[verifyOtpAndSetupClinic] OTP verification failed:', verifyError)
    return { error: verifyError?.message ?? 'OTP verification failed. Please check the code.' }
  }

  const userId = verifyData.user.id
  console.log('[verifyOtpAndSetupClinic] OTP verified. userId:', userId)

  // ── STEP 2: Seed DB via admin client (bypasses RLS) ───────────────────────
  // Instantiate fresh here (not module-level) so env vars are always resolved
  // inside the action scope rather than at module load time.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Rollback helper — deletes the auth user so we never leave an orphaned account
  async function rollbackAuthUser(reason: string): Promise<'auth_deleted' | 'auth_delete_failed'> {
    console.error('[verifyOtpAndSetupClinic] Rolling back auth user due to:', reason)
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (deleteErr) {
      console.error('[verifyOtpAndSetupClinic] Auth user DELETE failed — manual cleanup needed for:', userId, deleteErr)
      return 'auth_delete_failed'
    }
    console.log('[verifyOtpAndSetupClinic] Auth user deleted cleanly.')
    return 'auth_deleted'
  }

  try {
    // ── 2a: Insert clinic (idempotent) ───────────────────────────────────────
    let clinicId: string

    const { data: existingClinic } = await supabaseAdmin
      .from('clinics')
      .select('id')
      .eq('owner_id', userId)
      .maybeSingle()

    if (existingClinic) {
      console.log('[verifyOtpAndSetupClinic] Clinic already exists, reusing:', existingClinic.id)
      clinicId = existingClinic.id as string
    } else {
      const { data: clinicRow, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .insert({
          owner_id: userId,
          name: clinic.name,
          slug: clinic.slug,
          address: clinic.address,
          consultation_fee: clinic.consultation_fee,
          whatsapp_number: clinic.whatsapp_number,
          bank_name: clinic.bank_name,
          bank_iban: clinic.bank_iban,
          easypaisa_number: clinic.easypaisa_number,
        })
        .select('id')
        .single()

      if (clinicError || !clinicRow) {
        const msg = pgMsg(clinicError as PgError, 'clinics insert')
        console.error('[verifyOtpAndSetupClinic] Clinic insert FAILED:', clinicError)
        const cleanup = await rollbackAuthUser(msg)
        return { error: msg, cleanup }
      }

      clinicId = clinicRow.id as string
      console.log('[verifyOtpAndSetupClinic] Clinic created:', clinicId)
    }

    // ── 2b: Insert subscription (idempotent) ─────────────────────────────────
    const { data: existingSub } = await supabaseAdmin
      .from('clinic_subscriptions')
      .select('id')
      .eq('clinic_slug', clinic.slug)
      .maybeSingle()

    if (!existingSub) {
      const freeExpiry = new Date()
      freeExpiry.setFullYear(freeExpiry.getFullYear() + 1)

      const { error: subError } = await supabaseAdmin
        .from('clinic_subscriptions')
        .insert({
          clinic_slug: clinic.slug,
          plan_tier: 'free',
          expires_at: freeExpiry.toISOString(),
          is_beta_tester: false,
        })

      if (subError) {
        const msg = pgMsg(subError as PgError, 'clinic_subscriptions insert')
        console.error('[verifyOtpAndSetupClinic] Subscription insert FAILED:', subError)
        const cleanup = await rollbackAuthUser(msg)
        return { error: msg, cleanup }
      }
    }

    // ── 2c: Upsert owner profile (role = admin) ───────────────────────────────
    // Upsert handles the case where a DB trigger already created a skeleton row.
    console.log('[verifyOtpAndSetupClinic] Upserting owner profile:', { userId, clinicId })
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        { id: userId, clinic_id: clinicId, role: 'admin', full_name: owner_name },
        { onConflict: 'id' }
      )

    if (profileError) {
      const msg = pgMsg(profileError as PgError, 'profiles upsert (owner)')
      console.error('[verifyOtpAndSetupClinic] Owner profile upsert FAILED:', profileError)
      const cleanup = await rollbackAuthUser(msg)
      return { error: msg, cleanup }
    }

    // ── 2d: Create doctor auth users + profiles ───────────────────────────────
    const safeClinicName = clinic.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const generatedStaff: { name: string; email: string; password: string }[] = []

    for (const member of staff) {
      const safeStaffName = member.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const generatedEmail = `${safeStaffName}@${safeClinicName}.opedox.com`

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: member.password,
        email_confirm: true,
      })

      if (authError || !authData.user) {
        const msg = `Doctor auth create failed for ${member.full_name}: ${authError?.message ?? 'unknown'}`
        console.error('[verifyOtpAndSetupClinic]', msg)
        const cleanup = await rollbackAuthUser(msg)
        return { error: msg, cleanup }
      }

      const finalName = formatDoctorName(member.full_name)
      const cleanName = member.full_name.replace(/^Dr\.?\s*/i, '').trim()
      const parts = cleanName.split(/\s+/).filter(Boolean)
      const queuePrefix = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : (cleanName.substring(0, 2).toUpperCase() || 'DR')

      const { error: doctorProfileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          {
            id: authData.user.id,
            clinic_id: clinicId,
            role: 'doctor',
            full_name: finalName,
            credentials: member.credentials,
            queue_prefix: queuePrefix,
          },
          { onConflict: 'id' }
        )

      if (doctorProfileError) {
        const msg = pgMsg(doctorProfileError as PgError, `profiles upsert (doctor: ${member.full_name})`)
        console.error('[verifyOtpAndSetupClinic] Doctor profile upsert FAILED:', doctorProfileError)
        const cleanup = await rollbackAuthUser(msg)
        return { error: msg, cleanup }
      }

      generatedStaff.push({ name: member.full_name, email: generatedEmail, password: member.password })
    }

    console.log('[verifyOtpAndSetupClinic] ✅ All records created. clinicId:', clinicId)
    return { success: true, clinicId, generatedStaff }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[verifyOtpAndSetupClinic] UNEXPECTED TOP-LEVEL CRASH:', err)
    // Best-effort rollback on unexpected throws
    const cleanup = await (async () => {
      try {
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
        return error ? 'auth_delete_failed' : 'auth_deleted'
      } catch {
        return 'auth_delete_failed'
      }
    })() as 'auth_deleted' | 'auth_delete_failed'
    return { error: `Unexpected server error: ${message}`, cleanup }
  }
}

// ─── Legacy export (kept for import compatibility, delegates to new action) ───
// Remove once all callers are migrated.
export interface RegisterPayload {
  owner_id: string
  owner_name: string
  clinic: ClinicPayload
  staff: (StaffMember & { role: 'doctor'; email: string })[]
}

export async function registerClinicWorkflow(
  payload: RegisterPayload
): Promise<{ clinicId: string } | { error: string }> {
  const { owner_id, owner_name, clinic, staff } = payload

  console.log('[registerClinicWorkflow] Incoming payload:', JSON.stringify({
    owner_id,
    owner_name,
    clinic_name: clinic.name,
    clinic_slug: clinic.slug,
    staff_count: staff.length,
  }, null, 2))

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  try {
    // ── Clinic (idempotent) ───────────────────────────────────────────────────
    let clinicId: string
    const { data: existingClinic } = await supabaseAdmin
      .from('clinics').select('id').eq('owner_id', owner_id).maybeSingle()

    if (existingClinic) {
      clinicId = existingClinic.id as string
    } else {
      const { data: clinicRow, error: clinicError } = await supabaseAdmin
        .from('clinics')
        .insert({
          owner_id,
          name: clinic.name,
          slug: clinic.slug,
          address: clinic.address,
          consultation_fee: clinic.consultation_fee,
          whatsapp_number: clinic.whatsapp_number,
          bank_name: clinic.bank_name,
          bank_iban: clinic.bank_iban,
          easypaisa_number: clinic.easypaisa_number,
        })
        .select('id')
        .single()

      if (clinicError || !clinicRow) {
        console.error('[registerClinicWorkflow] Clinic insert FAILED:', {
          message: clinicError?.message,
          code: (clinicError as PgError)?.code,
          details: (clinicError as PgError)?.details,
          hint: (clinicError as PgError)?.hint,
        })
        return { error: pgMsg(clinicError as PgError, 'clinics insert') }
      }
      clinicId = clinicRow.id as string
    }

    // ── Subscription (idempotent) ─────────────────────────────────────────────
    const { data: existingSub } = await supabaseAdmin
      .from('clinic_subscriptions').select('id').eq('clinic_slug', clinic.slug).maybeSingle()

    if (!existingSub) {
      const freeExpiry = new Date()
      freeExpiry.setFullYear(freeExpiry.getFullYear() + 1)
      const { error: subError } = await supabaseAdmin
        .from('clinic_subscriptions')
        .insert({ clinic_slug: clinic.slug, plan_tier: 'free', expires_at: freeExpiry.toISOString(), is_beta_tester: false })

      if (subError) {
        console.error('[registerClinicWorkflow] Subscription insert FAILED:', subError)
        return { error: pgMsg(subError as PgError, 'clinic_subscriptions insert') }
      }
    }

    // ── Owner profile ─────────────────────────────────────────────────────────
    console.log('[registerClinicWorkflow] Upserting owner profile:', { id: owner_id, clinic_id: clinicId })
    const { error: ownerProfileError } = await supabaseAdmin
      .from('profiles')
      .upsert({ id: owner_id, clinic_id: clinicId, role: 'admin', full_name: owner_name }, { onConflict: 'id' })

    if (ownerProfileError) {
      console.error('[registerClinicWorkflow] Owner profile upsert FAILED:', {
        message: ownerProfileError.message,
        code: (ownerProfileError as PgError).code,
        details: (ownerProfileError as PgError).details,
        hint: (ownerProfileError as PgError).hint,
      })
      return { error: pgMsg(ownerProfileError as PgError, 'profiles upsert (owner)') }
    }

    // ── Doctor auth + profiles ────────────────────────────────────────────────
    for (const member of staff) {
      const safeStaffName = member.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const safeClinicName = clinic.name.toLowerCase().replace(/[^a-z0-9]/g, '')
      const generatedEmail = `${safeStaffName}@${safeClinicName}.opedox.com`

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: member.password,
        email_confirm: true,
      })

      if (authError || !authData.user) {
        console.error(`[registerClinicWorkflow] Auth create error for ${generatedEmail}:`, authError)
        return { error: `Failed to create account for ${member.full_name}: ${authError?.message ?? 'Unknown error'}` }
      }

      const finalName = formatDoctorName(member.full_name)
      const cleanName = member.full_name.replace(/^Dr\.?\s*/i, '').trim()
      const parts = cleanName.split(/\s+/).filter(Boolean)
      const queuePrefix = parts.length >= 2
        ? (parts[0][0] + parts[1][0]).toUpperCase()
        : (cleanName.substring(0, 2).toUpperCase() || 'DR')

      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert(
          { id: authData.user.id, clinic_id: clinicId, role: member.role, full_name: finalName, credentials: member.credentials, queue_prefix: queuePrefix },
          { onConflict: 'id' }
        )

      if (profileError) {
        console.error(`[registerClinicWorkflow] Profile upsert FAILED for ${generatedEmail}:`, {
          message: profileError.message,
          code: (profileError as PgError).code,
          details: (profileError as PgError).details,
          hint: (profileError as PgError).hint,
        })
        return { error: pgMsg(profileError as PgError, `profiles upsert (doctor: ${member.full_name})`) }
      }
    }

    console.log('[registerClinicWorkflow] ✅ All records created. clinicId:', clinicId)
    return { clinicId }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[registerClinicWorkflow] UNEXPECTED TOP-LEVEL CRASH:', err)
    return { error: `Unexpected server error: ${message}` }
  }
}
