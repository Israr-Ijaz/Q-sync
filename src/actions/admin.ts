'use server'

import { createClient as createServerClient } from '@/utils/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { formatDoctorName } from '@/lib/utils'

// ─── Admin client (Service Role — bypasses RLS) ───────────────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ─── Shared guard: resolve the calling user's profile ─────────────────────────
async function getCallerProfile() {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return { error: 'Not authenticated.' }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role, clinic_id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || !profile) return { error: 'Profile not found.' }

  return { profile }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ActionResult {
  error?: string
  success?: boolean
}

export interface ClinicSettingsPayload {
  name: string
  address: string
  consultationFee: number | null
}

// ─── Update Clinic Settings ───────────────────────────────────────────────────

export async function updateClinicSettingsAction(
  payload: ClinicSettingsPayload
): Promise<ActionResult> {
  const result = await getCallerProfile()
  if ('error' in result) return { error: result.error }

  const { profile } = result

  if (profile.role !== 'admin') {
    return { error: 'Forbidden: Only clinic admins can update clinic settings.' }
  }

  if (!payload.name?.trim()) {
    return { error: 'Clinic name is required.' }
  }

  const updatePayload: Record<string, unknown> = {
    name: payload.name.trim(),
    address: payload.address?.trim() ?? '',
  }

  // Only include consultation_fee if the column exists (null clears it)
  if (payload.consultationFee !== undefined) {
    updatePayload.consultation_fee = payload.consultationFee
  }

  const { error } = await supabaseAdmin
    .from('clinics')
    .update(updatePayload)
    .eq('id', profile.clinic_id)

  if (error) {
    console.error('[updateClinicSettingsAction] Error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ─── Reset Staff Password ─────────────────────────────────────────────────────

export interface ResetStaffPasswordPayload {
  staffUid: string
  newPassword: string
}

export async function resetStaffPasswordAction(
  payload: ResetStaffPasswordPayload
): Promise<ActionResult> {
  const result = await getCallerProfile()
  if ('error' in result) return { error: result.error }

  const { profile } = result

  // Guard 1: caller must be an admin
  if (profile.role !== 'admin') {
    return { error: 'Forbidden: Only clinic admins can reset staff passwords.' }
  }

  // Guard 2: validate new password
  if (!payload.newPassword || payload.newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  // Guard 3: verify the target staff belongs to the same clinic
  const { data: staffProfile, error: staffError } = await supabaseAdmin
    .from('profiles')
    .select('id, clinic_id, role')
    .eq('id', payload.staffUid)
    .maybeSingle()

  if (staffError || !staffProfile) {
    return { error: 'Staff member not found.' }
  }

  if (staffProfile.clinic_id !== profile.clinic_id) {
    return { error: 'Forbidden: Staff member does not belong to your clinic.' }
  }

  // Use Admin API to force-update credentials — bypasses RLS and email flow
  const { error: updateError } =
    await supabaseAdmin.auth.admin.updateUserById(payload.staffUid, {
      password: payload.newPassword,
    })

  if (updateError) {
    console.error('[resetStaffPasswordAction] Error:', updateError)
    return { error: updateError.message }
  }

  return { success: true }
}

// ─── Create Staff Member ───────────────────────────────────────────────────────

export interface CreateStaffPayload {
  fullName: string
  password: string
  role: 'doctor' | 'receptionist'
  credentials: string
  /** Required when role === 'doctor'. Exactly 2 uppercase alpha characters. */
  queuePrefix?: string
}

export interface CreateStaffResult extends ActionResult {
  staffId?: string
  generatedEmail?: string
}

export async function createStaffAction(
  payload: CreateStaffPayload
): Promise<CreateStaffResult> {
  const result = await getCallerProfile()
  if ('error' in result) return { error: result.error }

  const { profile } = result

  if (profile.role !== 'admin') {
    return { error: 'Forbidden: Only clinic admins can create staff accounts.' }
  }

  if (!payload.fullName?.trim()) return { error: 'Full name is required.' }
  if (!payload.password || payload.password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  // Validate queue prefix for doctors
  if (payload.role === 'doctor') {
    const prefix = payload.queuePrefix?.trim().toUpperCase() ?? ''
    if (!/^[A-Z]{2}$/.test(prefix)) {
      return { error: 'Queue Prefix must be exactly 2 letters (e.g. "AL").' }
    }
  }

  // Fetch clinic name to build the generated email
  const { data: clinic } = await supabaseAdmin
    .from('clinics')
    .select('name')
    .eq('id', profile.clinic_id)
    .maybeSingle()

  const safeStaffName = payload.fullName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const safeClinicName = (clinic?.name ?? 'clinic').toLowerCase().replace(/[^a-z0-9]/g, '')
  const generatedEmail = `${safeStaffName}@${safeClinicName}.opedox.com`

  // Create auth user (auto-confirm to skip email verification)
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: generatedEmail,
      password: payload.password,
      email_confirm: true,
    })

  if (authError || !authData.user) {
    console.error('[createStaffAction] Auth create error:', authError)
    return {
      error: `Failed to create auth account: ${authError?.message ?? 'Unknown error'}`,
    }
  }

  const finalName =
    payload.role === 'doctor'
      ? formatDoctorName(payload.fullName)
      : payload.fullName

  const profileInsert: Record<string, unknown> = {
    id: authData.user.id,
    clinic_id: profile.clinic_id,
    role: payload.role,
    full_name: finalName,
    credentials: payload.credentials,
  }

  if (payload.role === 'doctor' && payload.queuePrefix) {
    profileInsert.queue_prefix = payload.queuePrefix.trim().toUpperCase()
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .upsert(profileInsert, { onConflict: 'id' })

  if (profileError) {
    console.error('[createStaffAction] Profile upsert error:', profileError)
    return { error: `Failed to create profile: ${profileError.message}` }
  }

  return { success: true, staffId: authData.user.id, generatedEmail }
}
