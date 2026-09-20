'use server'

import { createClient } from '../utils/supabase/server';

// ─── Join Queue ────────────────────────────────────────────────────────────────
// Called from the patient QR self-service page.
// doctor_id is resolved from formData first (hidden input — always present in
// the DOM), with the direct `doctorIdArg` as a belt-and-suspenders fallback.
export async function joinQueue(
  formData: FormData,
  slug: string,
  doctorIdArg: string,
) {
  // ── 1. Resolve doctor_id — formData hidden input is the authoritative source ──
  const doctorId = (formData.get('doctor_id') as string | null)?.trim() || doctorIdArg?.trim() || '';

  // ── 2. Extract remaining form fields ─────────────────────────────────────────
  const name  = (formData.get('patientName')  as string | null)?.trim() ?? '';
  const phone = (formData.get('phoneNumber')  as string | null)?.trim() ?? '';

  // ── 3. Payload log — always visible in server console ────────────────────────
  console.log('[joinQueue] TOKEN PAYLOAD:', { slug, doctorId, name, phone });

  // ── 4. Strict guard — stops execution BEFORE any Supabase call ───────────────
  if (!doctorId) {
    console.error('[joinQueue] VALIDATION ERROR: doctor_id is missing or empty.');
    return { error: 'Validation Error: No doctor selected. Please select a doctor before generating a token.' };
  }
  if (!name)  return { error: 'Patient name is required.'         };
  if (!phone) return { error: 'Phone number is required.'          };

  const supabase = await createClient();

  // ── 5. Resolve clinic by slug ─────────────────────────────────────────────────
  const cleanSlug = slug.trim().toLowerCase();
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .select('id')
    .eq('slug', cleanSlug)
    .single();

  if (clinicError || !clinic) {
    console.error('[joinQueue] Clinic lookup failed:', clinicError);
    return { error: 'Clinic not found. Check the URL.' };
  }

  // ── 6. Fetch the doctor's queue_prefix ───────────────────────────────────────
  const { data: doctorProfile } = await supabase
    .from('profiles')
    .select('queue_prefix')
    .eq('id', doctorId)
    .single();

  const prefix = doctorProfile?.queue_prefix ?? 'A';

  // ── 7. Count today's tokens for this doctor (daily reset — midnight-to-midnight) ──
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0, );
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const { count: todayCount } = await supabase
    .from('tokens')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinic.id)
    .eq('doctor_id', doctorId)
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', tomorrowStart.toISOString());

  const nextNumber = (todayCount ?? 0) + 1;

  // ── 8. Build the display token string, e.g. "AL-05" ─────────────────────────
  const tokenDisplay = `${prefix}-${String(nextNumber).padStart(2, '0')}`;

  console.log('[joinQueue] Inserting token:', { clinic_id: clinic.id, doctor_id: doctorId, token_display: tokenDisplay });

  // ── 9. Insert the token ───────────────────────────────────────────────────────
  const { data: token, error: insertError } = await supabase
    .from('tokens')
    .insert([{
      clinic_id:     clinic.id,
      doctor_id:     doctorId,
      patient_name:  name,
      patient_phone: phone,
      status:        'waiting',
      token_number:  nextNumber,
      token_display: tokenDisplay,
    }])
    .select('id')
    .single();

  if (insertError || !token) {
    console.error('[joinQueue] Insert failed:', insertError);
    return { error: `Failed to generate token: ${insertError?.message ?? 'Unknown database error'}` };
  }

  console.log('[joinQueue] Token created successfully:', token.id);
  return { success: true, tokenId: token.id };
}

// ─── Create Walk-in Token (Receptionist) ──────────────────────────────────────
// Called from the Receptionist Dashboard manual-add flow.
// Counts today's DB tokens for the doctor server-side (avoids stale client state)
// and inserts with the correct sequential token_number and formatted token_display.
export async function createWalkInTokenAction(payload: {
  clinicId: string;
  doctorId: string;
  patientName: string;
  patientPhone: string | null;
}): Promise<{
  success?: boolean;
  token?: { id: string; token_number: number; token_display: string; doctor_id: string };
  error?: string;
}> {
  const { clinicId, doctorId, patientName, patientPhone } = payload;

  // ── Validate inputs ────────────────────────────────────────────────────────
  if (!clinicId) return { error: 'clinic_id is required.' };
  if (!doctorId) {
    console.error('[createWalkInTokenAction] VALIDATION ERROR: doctor_id is missing.');
    return { error: 'Validation Error: No doctor selected. Please select a doctor before adding a patient.' };
  }
  if (!patientName?.trim()) return { error: 'Patient name is required.' };

  console.log('[createWalkInTokenAction] PAYLOAD:', { clinicId, doctorId, patientName, patientPhone });

  const supabase = await createClient();

  // ── Fetch the doctor's queue_prefix ────────────────────────────────────────
  const { data: doctorProfile } = await supabase
    .from('profiles')
    .select('queue_prefix')
    .eq('id', doctorId)
    .single();

  const prefix = doctorProfile?.queue_prefix ?? 'A';

  // ── Count today's tokens for this doctor (daily reset — midnight-to-midnight) ──
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const { count: todayCount, error: countError } = await supabase
    .from('tokens')
    .select('id', { count: 'exact', head: true })
    .eq('clinic_id', clinicId)
    .eq('doctor_id', doctorId)
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', tomorrowStart.toISOString());

  if (countError) {
    console.error('[createWalkInTokenAction] Count query failed:', countError);
    return { error: `Failed to read queue: ${countError.message}` };
  }

  const nextNumber   = (todayCount ?? 0) + 1;
  const tokenDisplay = `${prefix}-${String(nextNumber).padStart(2, '0')}`;

  console.log('[createWalkInTokenAction] Inserting:', { clinicId, doctorId, nextNumber, tokenDisplay });

  // ── Insert the token ────────────────────────────────────────────────────────
  const { data: token, error: insertError } = await supabase
    .from('tokens')
    .insert({
      clinic_id:     clinicId,
      doctor_id:     doctorId,
      patient_name:  patientName.trim(),
      patient_phone: patientPhone || null,
      status:        'waiting',
      token_number:  nextNumber,
      token_display: tokenDisplay,
    })
    .select('id, token_number, token_display, doctor_id')
    .single();

  if (insertError || !token) {
    console.error('[createWalkInTokenAction] Insert failed:', insertError);
    return { error: `Failed to create token: ${insertError?.message ?? 'Unknown database error'}` };
  }

  console.log('[createWalkInTokenAction] Token created:', token.id, tokenDisplay);
  return { success: true, token };
}

// ─── Transfer Patient ──────────────────────────────────────────────────────────
// Receptionist Command Center: moves a token to a different doctor's queue.
// The token number, patient name, and patient phone are preserved.
export async function transferPatientAction(
  tokenId: string,
  newDoctorId: string,
): Promise<{ success?: boolean; error?: string }> {
  if (!tokenId || !newDoctorId) {
    return { error: 'Token ID and target doctor are required.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('tokens')
    .update({ doctor_id: newDoctorId })
    .eq('id', tokenId);

  if (error) {
    console.error('[transferPatientAction] Error:', error);
    return { error: error.message };
  }

  return { success: true };
}