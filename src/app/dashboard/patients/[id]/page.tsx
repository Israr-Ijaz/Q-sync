import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import PatientProfileClient from './_components/PatientProfileClient';

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * RSC page — performs role-based access control and fetches all data server-side.
 * Redirects receptionists back to their dashboard.
 */
export default async function PatientProfilePage({ params }: Props) {
  const { id: patientId } = await params;
  const supabase = await createClient();

  // ── 1. Auth + Role check ──────────────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? null;

  // Block receptionists
  if (role === 'receptionist') {
    redirect('/dashboard');
  }

  // ── 2. Fetch patient data ─────────────────────────────────────────────────
  const { data: patient, error: patientError } = await supabase
    .from('patients')
    .select('*')
    .eq('id', patientId)
    .single();

  if (patientError || !patient) {
    // Patient not found — redirect to patients list
    redirect('/dashboard/patients');
  }

  // ── 3. Fetch visit history ────────────────────────────────────────────────
  const { data: visits } = await supabase
    .from('tokens')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  return (
    <PatientProfileClient
      patient={patient as Record<string, string | null>}
      visits={(visits ?? []) as Record<string, string | null>[]}
      userRole={role}
    />
  );
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return {
    title: `Patient Profile — Opedox`,
    description: `Medical history and visit records for patient ${id}`,
  };
}
