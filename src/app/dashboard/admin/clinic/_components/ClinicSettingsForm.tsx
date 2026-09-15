'use client'

import { useState, useTransition } from 'react'
import { Building2, MapPin, Save, Loader2, CheckCircle2, AlertCircle, Banknote } from 'lucide-react'
import { updateClinicSettingsAction } from '@/actions/admin'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  initialName: string
  initialAddress: string
  initialFee: number | null
}

export default function ClinicSettingsForm({ initialName, initialAddress, initialFee }: Props) {
  const [name, setName] = useState(initialName)
  const [address, setAddress] = useState(initialAddress)
  const [fee, setFee] = useState<string>(initialFee != null ? String(initialFee) : '')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('idle')

    const parsedFee = fee.trim() === '' ? null : Number(fee)
    if (fee.trim() !== '' && (isNaN(parsedFee!) || parsedFee! < 0)) {
      setErrorMsg('Consultation fee must be a valid positive number.')
      setStatus('error')
      return
    }

    startTransition(async () => {
      const result = await updateClinicSettingsAction({
        name,
        address,
        consultationFee: parsedFee,
      })
      if (result.error) {
        setErrorMsg(result.error)
        setStatus('error')
      } else {
        setStatus('success')
      }
    })
  }

  const inputBase = cn(
    'h-11 pl-10 pr-4',
    'border-white/[0.08] bg-white/[0.04] text-slate-100 placeholder:text-slate-600',
    'focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 transition-all duration-200'
  )

  return (
    <form id="clinic-settings-form" onSubmit={handleSubmit} className="space-y-6">

      {/* Clinic Name */}
      <div className="space-y-1.5">
        <label htmlFor="clinic-name" className="block text-xs font-medium text-slate-400">
          Clinic Name
        </label>
        <div className="relative">
          <Building2
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <Input
            id="clinic-name"
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setStatus('idle') }}
            placeholder="e.g. Al-Shifa Medical Centre"
            disabled={isPending}
            required
            className={inputBase}
          />
        </div>
      </div>

      {/* Primary Address */}
      <div className="space-y-1.5">
        <label htmlFor="clinic-address" className="block text-xs font-medium text-slate-400">
          Primary Address
        </label>
        <div className="relative">
          <MapPin
            className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500"
            aria-hidden="true"
          />
          <textarea
            id="clinic-address"
            value={address}
            onChange={(e) => { setAddress(e.target.value); setStatus('idle') }}
            placeholder="e.g. 12-B, Main Boulevard, Gulberg III, Lahore"
            disabled={isPending}
            rows={3}
            className={cn(
              'w-full rounded-md border pl-10 pr-4 py-2.5 text-sm',
              'border-white/[0.08] bg-white/[0.04] text-slate-100 placeholder:text-slate-600',
              'focus-visible:outline-none focus-visible:border-emerald-500/50 focus-visible:ring-1 focus-visible:ring-emerald-500/20',
              'disabled:cursor-not-allowed disabled:opacity-60 resize-none transition-all duration-200'
            )}
          />
        </div>
      </div>

      {/* Consultation Fee */}
      <div className="space-y-1.5">
        <label htmlFor="clinic-fee" className="block text-xs font-medium text-slate-400">
          Consultation Fee{' '}
          <span className="text-slate-600">(optional — shown on prescriptions)</span>
        </label>
        <div className="relative">
          <Banknote
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden="true"
          />
          <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 text-sm font-medium text-slate-500">
            Rs.
          </span>
          <Input
            id="clinic-fee"
            type="number"
            min="0"
            step="1"
            value={fee}
            onChange={(e) => { setFee(e.target.value); setStatus('idle') }}
            placeholder="e.g. 1500"
            disabled={isPending}
            className={cn(inputBase, 'pl-16')}
          />
        </div>
      </div>

      {/* Feedback messages */}
      {status === 'success' && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-400"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Clinic settings saved successfully.
        </div>
      )}
      {status === 'error' && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Submit */}
      <Button
        id="clinic-settings-save-btn"
        type="submit"
        disabled={isPending}
        className={cn(
          'group relative flex h-11 w-full items-center justify-center gap-2 overflow-hidden',
          'rounded-xl px-6 text-sm font-semibold text-white',
          'bg-gradient-to-r from-emerald-500 to-teal-500',
          'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
          'transition-all duration-300',
          'hover:shadow-[0_0_32px_rgba(16,185,129,0.45)] hover:brightness-110 hover:-translate-y-px',
          'disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:brightness-100'
        )}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-500 group-hover:translate-x-full"
        />
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span>Saving…</span>
          </>
        ) : (
          <>
            <Save className="h-4 w-4" aria-hidden="true" />
            <span>Save Changes</span>
          </>
        )}
      </Button>
    </form>
  )
}
