'use client'

import { useState, useTransition } from 'react'
import {
  User,
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Stethoscope,
  ClipboardList,
  ShieldCheck,
  Eye,
  EyeOff,
  UserPlus,
  Copy,
} from 'lucide-react'
import { resetStaffPasswordAction, createStaffAction } from '@/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { StaffMember } from '../page'

// ---------------------------------------------------------------------------
// Role badge
// ---------------------------------------------------------------------------
const ROLE_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  doctor: {
    label: 'Doctor',
    icon: Stethoscope,
    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  receptionist: {
    label: 'Receptionist',
    icon: ClipboardList,
    className: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
}

function RoleBadge({ role }: { role: string | null }) {
  const cfg = ROLE_CONFIG[role ?? ''] ?? {
    label: role ?? 'Unknown',
    icon: User,
    className: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  }
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        cfg.className
      )}
    >
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Shared modal shell
// ---------------------------------------------------------------------------
function ModalShell({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-slate-900 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_32px_64px_rgba(0,0,0,0.6)] p-6 sm:p-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600"
          aria-label="Close modal"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Password Reset Modal
// ---------------------------------------------------------------------------
interface PasswordModalProps { staff: StaffMember; onClose: () => void }

function PasswordResetModal({ staff, onClose }: PasswordModalProps) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('idle')
    startTransition(async () => {
      const result = await resetStaffPasswordAction({ staffUid: staff.id, newPassword: password })
      if (result.error) { setErrorMsg(result.error); setStatus('error') }
      else setStatus('success')
    })
  }

  return (
    <ModalShell onClose={onClose}>
      <div className="mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <KeyRound className="h-5 w-5 text-amber-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold text-white">Reset Password</h2>
        <p className="mt-1 text-sm text-slate-400">
          Set a new password for{' '}
          <span className="font-medium text-slate-200">{staff.full_name ?? 'this staff member'}</span>.
        </p>
      </div>

      {status === 'success' ? (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="h-7 w-7 text-emerald-400" />
          </div>
          <div>
            <p className="font-semibold text-white">Password updated!</p>
            <p className="mt-1 text-sm text-slate-400">
              {staff.full_name ?? 'Staff member'} can now log in with the new password.
            </p>
          </div>
          <Button id="modal-done-btn" onClick={onClose} className="mt-2 h-10 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white hover:brightness-110 transition-all">Done</Button>
        </div>
      ) : (
        <form id="reset-password-form" onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="new-password" className="block text-xs font-medium text-slate-400">New Password</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setStatus('idle') }}
                placeholder="Min. 6 characters"
                disabled={isPending}
                required
                minLength={6}
                className="h-11 pl-10 pr-10 border-white/[0.08] bg-white/[0.04] text-slate-100 placeholder:text-slate-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all duration-200"
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          {status === 'error' && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />{errorMsg}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <Button id="modal-cancel-btn" type="button" onClick={onClose} disabled={isPending} className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-medium text-slate-300 hover:bg-white/[0.07] hover:text-white transition-all">Cancel</Button>
            <Button
              id="modal-confirm-btn"
              type="submit"
              disabled={isPending || !password}
              className={cn(
                'group relative flex h-10 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white',
                'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_16px_rgba(245,158,11,0.3)]',
                'transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
              {isPending ? 'Updating…' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  )
}

// ---------------------------------------------------------------------------
// Add Staff Modal
// ---------------------------------------------------------------------------
interface AddStaffModalProps {
  onClose: () => void
  onCreated: (member: StaffMember) => void
}

function AddStaffModal({ onClose, onCreated }: AddStaffModalProps) {
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor')
  const [credentials, setCredentials] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedPassword, setCopiedPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('idle')
    startTransition(async () => {
      const result = await createStaffAction({ fullName, password, role, credentials })
      if (result.error) { setErrorMsg(result.error); setStatus('error') }
      else {
        setGeneratedEmail(result.generatedEmail ?? '')
        setStatus('success')
        // Optimistically update the roster list
        onCreated({
          id: result.staffId ?? crypto.randomUUID(),
          full_name: role === 'doctor' ? `Dr. ${fullName}` : fullName,
          role,
          credentials,
        })
      }
    })
  }

  function copyToClipboard(text: string, kind: 'email' | 'password') {
    navigator.clipboard.writeText(text).then(() => {
      if (kind === 'email') {
        setCopiedEmail(true)
        setTimeout(() => setCopiedEmail(false), 2000)
      } else {
        setCopiedPassword(true)
        setTimeout(() => setCopiedPassword(false), 2000)
      }
    })
  }

  const inputBase = 'h-11 border-white/[0.08] bg-white/[0.04] text-slate-100 placeholder:text-slate-600 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all duration-200'

  return (
    <ModalShell onClose={onClose}>
      <div className="mb-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <UserPlus className="h-5 w-5 text-emerald-400" strokeWidth={1.75} />
        </div>
        <h2 className="text-lg font-semibold text-white">Add Staff Member</h2>
        <p className="mt-1 text-sm text-slate-400">
          Create a new login account for a doctor or receptionist in your clinic.
        </p>
      </div>

      {status === 'success' ? (
        <div className="space-y-5">
          {/* Success header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Account created!</p>
              <p className="text-xs text-slate-400">
                Share these credentials with {fullName} — they cannot be recovered later.
              </p>
            </div>
          </div>

          {/* Credentials card */}
          <div className="rounded-xl border border-white/[0.07] bg-slate-800/60 divide-y divide-white/[0.06]">
            {/* Email row */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Login Email</p>
                <p className="text-sm font-mono font-medium text-slate-100 truncate" id="generated-email-display">
                  {generatedEmail}
                </p>
              </div>
              <button
                id="copy-email-btn"
                type="button"
                onClick={() => copyToClipboard(generatedEmail, 'email')}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  copiedEmail
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                )}
                aria-label="Copy email to clipboard"
              >
                {copiedEmail ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
            </div>

            {/* Password row */}
            <div className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">Password</p>
                <p className="text-sm font-mono font-medium text-slate-100" id="generated-password-display">
                  {password}
                </p>
              </div>
              <button
                id="copy-password-btn"
                type="button"
                onClick={() => copyToClipboard(password, 'password')}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200',
                  copiedPassword
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                    : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]'
                )}
                aria-label="Copy password to clipboard"
              >
                {copiedPassword ? (
                  <><CheckCircle2 className="h-3.5 w-3.5" /> Copied!</>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /> Copy</>
                )}
              </button>
            </div>
          </div>

          {/* Warning note */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-3.5 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <p className="text-[11px] leading-relaxed text-amber-400/90">
              <span className="font-semibold">Important:</span> This is the only time the password is visible.
              Copy both credentials and securely hand them to the staff member before closing.
            </p>
          </div>

          <Button
            id="add-staff-done-btn"
            onClick={onClose}
            className="h-10 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            I've Copied the Credentials — Close
          </Button>
        </div>
      ) : (
        <form id="add-staff-form" onSubmit={handleSubmit} className="space-y-4">
          {/* Role selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-400">Role</label>
            <div className="grid grid-cols-2 gap-2">
              {(['doctor', 'receptionist'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    'flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition-all',
                    role === r
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                      : 'border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.07] hover:text-slate-200'
                  )}
                >
                  {r === 'doctor' ? <Stethoscope className="h-4 w-4" /> : <ClipboardList className="h-4 w-4" />}
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Full Name */}
          <div className="space-y-1.5">
            <label htmlFor="staff-fullname" className="block text-xs font-medium text-slate-400">Full Name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <Input id="staff-fullname" type="text" value={fullName} onChange={e => { setFullName(e.target.value); setStatus('idle') }} placeholder={role === 'doctor' ? 'e.g. Ahmad Raza (Dr. will be auto-added)' : 'e.g. Sara Khan'} disabled={isPending} required className={cn(inputBase, 'pl-10')} />
            </div>
          </div>

          {/* Credentials / Specialization */}
          <div className="space-y-1.5">
            <label htmlFor="staff-credentials" className="block text-xs font-medium text-slate-400">
              {role === 'doctor' ? 'Qualifications / Specialization' : 'Role / Department'}
              <span className="ml-1 text-slate-600">(optional)</span>
            </label>
            <Input id="staff-credentials" type="text" value={credentials} onChange={e => setCredentials(e.target.value)} placeholder={role === 'doctor' ? 'e.g. MBBS, FCPS — Cardiology' : 'e.g. Front Desk'} disabled={isPending} className={cn(inputBase, 'px-4')} />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="staff-password" className="block text-xs font-medium text-slate-400">Initial Password</label>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <Input
                id="staff-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setStatus('idle') }}
                placeholder="Min. 6 characters"
                disabled={isPending}
                required
                minLength={6}
                className={cn(inputBase, 'pl-10 pr-10')}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" aria-label={showPassword ? 'Hide' : 'Show'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {status === 'error' && (
            <div role="alert" className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />{errorMsg}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="button" onClick={onClose} disabled={isPending} className="h-10 flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-medium text-slate-300 hover:bg-white/[0.07] hover:text-white transition-all">Cancel</Button>
            <Button
              id="add-staff-submit-btn"
              type="submit"
              disabled={isPending || !fullName || !password}
              className={cn(
                'group relative flex h-10 flex-1 items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white',
                'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_16px_rgba(16,185,129,0.3)]',
                'transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60'
              )}
            >
              <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {isPending ? 'Creating…' : 'Create Account'}
            </Button>
          </div>
        </form>
      )}
    </ModalShell>
  )
}

// ---------------------------------------------------------------------------
// Staff card row
// ---------------------------------------------------------------------------
function StaffCard({ member, onReset }: { member: StaffMember; onReset: (m: StaffMember) => void }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 transition-colors hover:bg-white/[0.04]">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-800 ring-1 ring-white/10">
        <User className="h-5 w-5 text-slate-400" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{member.full_name ?? 'Unnamed Staff'}</p>
        {member.credentials && <p className="truncate text-xs text-slate-500 mt-0.5">{member.credentials}</p>}
      </div>
      <div className="shrink-0 hidden sm:block">
        <RoleBadge role={member.role} />
      </div>
      <button
        id={`update-password-btn-${member.id}`}
        onClick={() => onReset(member)}
        className={cn(
          'shrink-0 flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5',
          'text-xs font-medium text-amber-400',
          'transition-all duration-200 hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/50'
        )}
        aria-label={`Update password for ${member.full_name ?? 'staff member'}`}
      >
        <KeyRound className="h-3.5 w-3.5" />
        <span>Update Password</span>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function StaffRoster({ staff: initialStaff }: { staff: StaffMember[] }) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff)
  const [targetMember, setTargetMember] = useState<StaffMember | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  function handleCreated(member: StaffMember) {
    setStaff(prev => [...prev, member])
  }

  const doctors = staff.filter(s => s.role === 'doctor')
  const others = staff.filter(s => s.role !== 'doctor')

  function renderSection(title: string, members: StaffMember[]) {
    if (members.length === 0) return null
    return (
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-600">{title}</h2>
        <div className="space-y-2">
          {members.map(m => <StaffCard key={m.id} member={m} onReset={setTargetMember} />)}
        </div>
      </section>
    )
  }

  return (
    <>
      {/* ── Add Doctor CTA ── */}
      <div className="flex justify-end">
        <button
          id="add-staff-btn"
          onClick={() => setShowAddModal(true)}
          className={cn(
            'group relative flex items-center gap-2.5 overflow-hidden',
            'rounded-xl px-5 py-2.5 text-sm font-semibold text-white',
            'bg-gradient-to-r from-emerald-500 to-teal-500',
            'shadow-[0_0_20px_rgba(16,185,129,0.35)]',
            'transition-all duration-300',
            'hover:shadow-[0_0_32px_rgba(16,185,129,0.5)] hover:brightness-110 hover:-translate-y-px',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'
          )}
        >
          <span aria-hidden="true" className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
          <UserPlus className="relative h-4 w-4" />
          <span className="relative">Add Staff Member</span>
        </button>
      </div>

      {/* ── Roster card ── */}
      {staff.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.07] bg-slate-900/50 p-12 text-center">
          <User className="mx-auto mb-4 h-10 w-10 text-slate-600" strokeWidth={1.5} />
          <p className="text-sm font-medium text-slate-400">No staff members yet.</p>
          <p className="mt-1 text-xs text-slate-600">Click &ldquo;Add Staff Member&rdquo; above to create the first account.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-slate-900/50 p-6 space-y-6">
          {renderSection('Doctors', doctors)}
          {renderSection('Support Staff', others)}
        </div>
      )}

      {/* ── Modals ── */}
      {targetMember && (
        <PasswordResetModal staff={targetMember} onClose={() => setTargetMember(null)} />
      )}
      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleCreated}
        />
      )}
    </>
  )
}
