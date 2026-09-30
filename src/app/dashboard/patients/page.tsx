import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import {
  User,
  Phone,
  Droplets,
  ChevronRight,
  FolderHeart,
} from 'lucide-react';
import PatientDirectory from './_components/PatientDirectory';

export const metadata = {
  title: 'Patients — Opedox',
  description: 'Browse and manage all registered patients at your clinic.',
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PatientsPage() {
  const supabase = await createClient();

  // Auth + role guard
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, clinic_id')
    .eq('id', user.id)
    .maybeSingle();

  const role = profile?.role ?? null;
  const clinicId = profile?.clinic_id ?? null;

  if (role === 'receptionist') {
    redirect('/dashboard');
  }

  // Fetch patients for this clinic
  let query = supabase.from('patients').select('*').order('created_at', { ascending: false });

  if (clinicId) {
    query = query.eq('clinic_id', clinicId) as typeof query;
  }

  const { data: patients } = await query;

  const list = (patients ?? []) as Record<string, string | null>[];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-2xl font-bold tracking-tight text-transparent">
            Patients
          </h1>
          <p className="mt-0.5 text-xs text-slate-600">
            {list.length} registered patient{list.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* List */}
      <PatientDirectory initialPatients={list} />
    </div>
  );
}
