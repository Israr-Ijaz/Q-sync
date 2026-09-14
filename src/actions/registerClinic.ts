'use server'

import { createClient } from '@supabase/supabase-js'
import { formatDoctorName } from '@/lib/utils'

// ─── Admin client (bypasses RLS via Service Role Key) ───────────────────────
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
  email: string
  password: string
  role: 'doctor' | 'receptionist'
  full_name: string
  /** Speciality for doctors; empty string for receptionist */
  credentials: string
}

export interface RegisterPayload {
  owner_id: string
  owner_name: string
  clinic: ClinicPayload
  staff: StaffMember[]
}

// ─── Workflow ─────────────────────────────────────────────────────────────────

export async function registerClinicWorkflow(
  payload: RegisterPayload
): Promise<{ clinicId: string } | { error: string }> {
  const { owner_id, owner_name, clinic, staff } = payload

  // ── Step 1: Insert clinic record ─────────────────────────────────────────
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
    console.error('[registerClinicWorkflow] Clinic insert error:', clinicError)
    return { error: clinicError?.message ?? 'Failed to create clinic record.' }
  }

  const clinicId = clinicRow.id as string

  // ── Step 1c: Create default subscription row ─────────────────────────────
  //    The Founder dashboard queries clinic_subscriptions by clinic_slug, so
  //    every new clinic must have a corresponding row or it won't appear there.
  const freeExpiry = new Date()
  freeExpiry.setFullYear(freeExpiry.getFullYear() + 1) // 1-year free window

  const { error: subscriptionError } = await supabaseAdmin
    .from('clinic_subscriptions')
    .insert({
      clinic_slug: clinic.slug,
      plan_tier: 'free',
      expires_at: freeExpiry.toISOString(),
      is_beta_tester: false,
    })

  if (subscriptionError) {
    console.error('[registerClinicWorkflow] Subscription insert error:', subscriptionError)
    return { error: `Failed to create clinic subscription: ${subscriptionError.message}` }
  }

  // ── Step 1b: Upsert the owner's own profile row ─────────────────────────
  //    Uses upsert so that if a DB trigger already created a skeleton row
  //    for this auth user, we update it instead of crashing on a duplicate key.
  const { error: ownerProfileError } = await supabaseAdmin
    .from('profiles')
    .upsert(
      {
        id: owner_id,
        clinic_id: clinicId,
        role: 'admin',
        full_name: owner_name,
      },
      { onConflict: 'id' }
    )

  if (ownerProfileError) {
    console.error('[registerClinicWorkflow] Owner profile upsert error:', ownerProfileError)
    return { error: `Failed to create owner profile: ${ownerProfileError.message}` }
  }

  // ── Step 2: Create auth users + profile rows for each staff member ────────
  for (const member of staff) {
    // 2a. Generate a valid email address from the staff name + clinic name.
    //     The form may pass a raw name (e.g. "sara") which Supabase rejects as
    //     invalid email format, so we build one deterministically.
    const safeStaffName = member.full_name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const safeClinicName = clinic.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    const generatedEmail = `${safeStaffName}@${safeClinicName}.opedox.com`

    // 2b. Create the auth user (auto-confirms email to skip verification)
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: generatedEmail,
        password: member.password,
        email_confirm: true,
      })

    if (authError || !authData.user) {
      console.error(
        `[registerClinicWorkflow] Auth create error for ${generatedEmail}:`,
        authError
      )
      return {
        error: `Failed to create account for ${member.full_name}: ${authError?.message ?? 'Unknown error'}`,
      }
    }

    // 2c. Upsert profile row linking auth user to clinic + role
    const finalName = member.role === 'doctor' ? formatDoctorName(member.full_name) : member.full_name;

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert(
        {
          id: authData.user.id,
          clinic_id: clinicId,
          role: member.role,
          full_name: finalName,
          credentials: member.credentials,
        },
        { onConflict: 'id' }
      )

    if (profileError) {
      console.error(
        `[registerClinicWorkflow] Profile upsert error for ${generatedEmail}:`,
        profileError
      )
      return {
        error: `Failed to create profile for ${member.full_name}: ${profileError.message}`,
      }
    }
  }

  return { clinicId }
}
