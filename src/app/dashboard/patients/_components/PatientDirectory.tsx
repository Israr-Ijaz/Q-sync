'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Phone, Droplets, ChevronRight, FolderHeart, Search, X } from 'lucide-react';

// ─── Patient Row Card ─────────────────────────────────────────────────────────
function PatientRow({ patient }: { patient: Record<string, string | null> }) {
  const name = patient.name ?? patient.full_name ?? patient.patient_name ?? 'Unknown';
  const phone = patient.phone ?? patient.patient_phone ?? null;
  const bloodGroup = patient.blood_group ?? null;

  return (
    <Link
      href={`/dashboard/patients/${patient.id}`}
      className="group flex items-center justify-between gap-4 rounded-2xl border border-slate-800/60 bg-slate-900/50 px-5 py-4 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/20 hover:bg-slate-900/80 hover:shadow-[0_0_12px_rgba(16,185,129,0.06)]"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 ring-1 ring-emerald-500/15">
          <User className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-200">{name}</p>
          <div className="mt-0.5 flex items-center gap-3">
            {phone && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Phone className="h-2.5 w-2.5" strokeWidth={1.75} />
                {phone}
              </span>
            )}
            {bloodGroup && (
              <span className="flex items-center gap-1 text-[10px] text-slate-600">
                <Droplets className="h-2.5 w-2.5" strokeWidth={1.75} />
                {bloodGroup}
              </span>
            )}
          </div>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-700 transition-colors group-hover:text-emerald-500" strokeWidth={2} />
    </Link>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyPatients({ hasSearch }: { hasSearch?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-800/50 bg-slate-900/40 py-20 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-800/40">
        <FolderHeart className="h-7 w-7 text-slate-600" strokeWidth={1.5} />
      </span>
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-slate-400">
          {hasSearch ? 'No patients found' : 'No patients registered yet'}
        </p>
        <p className="text-xs text-slate-600 max-w-[250px] mx-auto">
          {hasSearch 
            ? 'We couldn\'t find any patients matching your search criteria.'
            : 'Patients will appear here once they join the queue via the QR link.'}
        </p>
      </div>
    </div>
  );
}

// ─── Main Directory Component ──────────────────────────────────────────────────
export default function PatientDirectory({ initialPatients }: { initialPatients: Record<string, string | null>[] }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = initialPatients.filter(patient => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    const name = (patient.name ?? patient.full_name ?? patient.patient_name ?? 'Unknown').toLowerCase();
    const phone = (patient.phone ?? patient.patient_phone ?? '').toLowerCase();
    
    return name.includes(query) || phone.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search patients by name or phone..."
          className="w-full bg-slate-900/60 border border-slate-800/80 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/30 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* List */}
      {filteredPatients.length === 0 ? (
        <EmptyPatients hasSearch={searchQuery.trim().length > 0} />
      ) : (
        <div className="flex flex-col gap-2">
          {filteredPatients.map((p, i) => (
            <PatientRow key={p.id ?? i} patient={p} />
          ))}
        </div>
      )}
    </div>
  );
}
