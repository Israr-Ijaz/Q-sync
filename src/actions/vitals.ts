'use server'

import { createClient } from '@/utils/supabase/server'

export interface VitalsPayload {
  blood_pressure?: string | null
  temperature?: string | null
  weight?: string | null
  chief_complaint?: string | null
  diagnosis?: string | null
  medications?: string | null
}

export async function saveVitalsAction(
  tokenId: string,
  vitals: VitalsPayload
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const patch: Record<string, string | null> = {}
  if (vitals.blood_pressure !== undefined) patch.blood_pressure = vitals.blood_pressure ?? null
  if (vitals.temperature !== undefined) patch.temperature = vitals.temperature ?? null
  if (vitals.weight !== undefined) patch.weight = vitals.weight ?? null
  if (vitals.chief_complaint !== undefined) patch.chief_complaint = vitals.chief_complaint ?? null
  if (vitals.diagnosis !== undefined) patch.diagnosis = vitals.diagnosis ?? null
  if (vitals.medications !== undefined) patch.medications = vitals.medications ?? null

  if (Object.keys(patch).length === 0) return {}

  const { error } = await supabase
    .from('tokens')
    .update(patch)
    .eq('id', tokenId)

  if (error) {
    console.error('[saveVitalsAction] Error:', error)
    return { error: error.message }
  }

  return {}
}

export async function getVitalsAction(tokenId: string): Promise<{
  data?: VitalsPayload
  error?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tokens')
    .select('blood_pressure, temperature, weight, chief_complaint, diagnosis, medications')
    .eq('id', tokenId)
    .maybeSingle()

  if (error) {
    console.error('[getVitalsAction] Error:', error)
    return { error: error.message }
  }

  return {
    data: {
      blood_pressure: (data as Record<string, string | null> | null)?.blood_pressure ?? null,
      temperature: (data as Record<string, string | null> | null)?.temperature ?? null,
      weight: (data as Record<string, string | null> | null)?.weight ?? null,
      chief_complaint: (data as Record<string, string | null> | null)?.chief_complaint ?? null,
      diagnosis: (data as Record<string, string | null> | null)?.diagnosis ?? null,
      medications: (data as Record<string, string | null> | null)?.medications ?? null,
    },
  }
}
