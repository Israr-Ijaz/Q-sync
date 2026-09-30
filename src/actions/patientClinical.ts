'use server'

import { createClient } from '@/utils/supabase/server'

export interface PatientClinicalPayload {
  allergies?: string | null
  chronic_conditions?: string | null
}

/**
 * Save allergies / chronic_conditions to the `patients` table.
 *
 * Strategy: we receive `tokenId` (always available on the component).
 * From the token we read `patient_phone` + `clinic_id`, then look up the
 * matching patient row and update by its UUID — exactly `.eq('id', patientId)`.
 *
 * This keeps the component interface minimal: no extra props needed.
 */
export async function savePatientClinicalAction(
  tokenId: string,
  payload: PatientClinicalPayload,
): Promise<{ error?: string }> {
  if (!tokenId) return { error: 'tokenId is required.' }

  const patch: Record<string, string | null> = {}
  if (payload.allergies !== undefined) patch.allergies = payload.allergies ?? null
  if (payload.chronic_conditions !== undefined) patch.chronic_conditions = payload.chronic_conditions ?? null

  if (Object.keys(patch).length === 0) return {}

  const supabase = await createClient()

  // ── 1. Resolve patient_phone + clinic_id from the token row ──────────────
  const { data: token, error: tokenError } = await supabase
    .from('tokens')
    .select('patient_phone, clinic_id')
    .eq('id', tokenId)
    .maybeSingle()

  if (tokenError || !token) {
    console.error('[savePatientClinicalAction] Failed to resolve token:', tokenId, tokenError?.message)
    return { error: tokenError?.message ?? 'Token not found.' }
  }

  const { patient_phone: phone, clinic_id: clinicId } = token as {
    patient_phone: string | null
    clinic_id: string | null
  }

  if (!phone || !clinicId) {
    console.error('[savePatientClinicalAction] Token is missing patient_phone or clinic_id:', { tokenId, phone, clinicId })
    return { error: 'Token is missing patient_phone or clinic_id. Cannot identify patient row.' }
  }

  // ── 2. Resolve patient UUID ───────────────────────────────────────────────
  const { data: patient, error: patientLookupError } = await supabase
    .from('patients')
    .select('id')
    .eq('phone', phone)
    .eq('clinic_id', clinicId)
    .maybeSingle()

  if (patientLookupError) {
    console.error('[savePatientClinicalAction] Patient lookup failed:', patientLookupError.message)
    return { error: patientLookupError.message }
  }

  if (!patient) {
    // Patient row doesn't exist yet — insert it so we can update it
    console.warn('[savePatientClinicalAction] No patient row found for phone:', phone, '— creating one.')
    const { data: newPatient, error: insertError } = await supabase
      .from('patients')
      .insert({ phone, clinic_id: clinicId, ...patch })
      .select('id')
      .single()

    if (insertError || !newPatient) {
      console.error('[savePatientClinicalAction] Patient insert failed:', insertError?.message)
      return { error: insertError?.message ?? 'Failed to create patient row.' }
    }

    return {}
  }

  // ── 3. Update patient by UUID — `.eq('id', patientId)` ───────────────────
  const patientId = (patient as { id: string }).id
  const { error: updateError } = await supabase
    .from('patients')
    .update(patch)
    .eq('id', patientId)

  if (updateError) {
    console.error('[savePatientClinicalAction] Update failed for patient', patientId, ':', updateError.message)
    return { error: updateError.message }
  }

  return {}
}

/**
 * Load allergies / chronic_conditions for the patient linked to a token.
 * Returns empty strings (never throws) so the component can render safely.
 */
export async function getPatientClinicalAction(
  tokenId: string,
): Promise<{ data?: PatientClinicalPayload; error?: string }> {
  if (!tokenId) return { data: {} }

  const supabase = await createClient()

  // ── 1. Resolve phone + clinic_id from token ───────────────────────────────
  const { data: token, error: tokenError } = await supabase
    .from('tokens')
    .select('patient_phone, clinic_id')
    .eq('id', tokenId)
    .maybeSingle()

  if (tokenError || !token) {
    console.error('[getPatientClinicalAction] Failed to resolve token:', tokenId, tokenError?.message)
    return { data: {} }
  }

  const { patient_phone: phone, clinic_id: clinicId } = token as {
    patient_phone: string | null
    clinic_id: string | null
  }

  if (!phone || !clinicId) {
    return { data: {} }
  }

  // ── 2. Fetch patient row ──────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('patients')
    .select('allergies, chronic_conditions')
    .eq('phone', phone)
    .eq('clinic_id', clinicId)
    .maybeSingle()

  if (error) {
    console.error('[getPatientClinicalAction] Query failed:', error.message)
    return { data: {} }
  }

  return {
    data: {
      allergies: (data as Record<string, string | null> | null)?.allergies ?? null,
      chronic_conditions: (data as Record<string, string | null> | null)?.chronic_conditions ?? null,
    },
  }
}
