'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { verifyOtpAndSetupClinic } from '@/actions/registerClinic'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Shield,
  MapPin,
  MessageCircle,
  Users,
  Plus,
  Trash2,
  CheckCircle2,
  ArrowRight,
  Stethoscope,
  Eye,
  EyeOff,
  Building2,
  CreditCard,
  Phone,
  Mail,
  Lock,
  User,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
  ShieldCheck,
} from 'lucide-react'

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'

/* ─── Types ──────────────────────────────────────────────────── */

interface Doctor {
  id: string
  name: string
  speciality: string
  password: string
}

interface GeneratedCredential {
  role: string
  name: string
  email: string
  password: string
}

interface FormData {
  // Step 1 – Owner
  ownerName: string
  ownerPhone: string
  ownerEmail: string
  ownerPassword: string
  // Step 2 – Clinic
  clinicName: string
  clinicAddress: string
  consultationFee: string
  whatsappNumber: string
  bankName: string
  bankIban: string
  easypaisaNumber: string
  // Step 3 – Doctors only
  doctors: Doctor[]
}

const initialForm: FormData = {
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  ownerPassword: '',
  clinicName: '',
  clinicAddress: '',
  consultationFee: '',
  whatsappNumber: '',
  bankName: '',
  bankIban: '',
  easypaisaNumber: '',
  doctors: [{ id: '1', name: '', speciality: '', password: '' }],
}

const steps = [
  { number: 1, label: 'Owner' },
  { number: 2, label: 'Clinic' },
  { number: 3, label: 'Staff' },
  { number: 4, label: 'Verify' },
  { number: 5, label: 'Done' },
]

/* ─── Animation Variants ─────────────────────────────────────── */

const formVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  }),
}

const vfInitial = { opacity: 0, scale: 0.95, y: 20 } as const
const vfAnimate = {
  opacity: 1,
  scale: 1,
  y: 0,
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
} as const
const vfExit = {
  opacity: 0,
  scale: 0.95,
  y: -20,
  transition: { duration: 0.35 },
} as const

/* ─── Reusable Input Component ───────────────────────────────── */

function FormInput({
  label,
  icon: Icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  id,
  inputRef,
  onKeyDown,
}: {
  label: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  type?: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  id?: string
  inputRef?: React.RefObject<HTMLInputElement | null>
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  const [showPw, setShowPw] = useState(false)
  const isPassword = type === 'password'

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="flex items-center gap-2 text-xs font-medium tracking-wide text-subtle">
        <Icon size={13} className="text-mint/70" />
        {label}
      </label>
      <div className="group relative">
        <input
          id={id}
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={isPassword ? (showPw ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="w-full rounded-xl border border-line bg-panel px-4 py-3 text-sm text-foreground placeholder:text-subtle/50 transition-all duration-200 outline-none focus:border-mint/50 focus:ring-1 focus:ring-mint/20 focus:shadow-[0_0_20px_var(--mint-glow)]"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-subtle/60 hover:text-mint transition-colors"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  )
}

/* ─── Stepper ────────────────────────────────────────────────── */

function Stepper({ currentStep }: { currentStep: number }) {
  // Only show the first 4 steps in the stepper (Done is not shown)
  const visibleSteps = steps.slice(0, 4)
  return (
    <div className="flex items-center gap-3">
      {visibleSteps.map((step, i) => {
        const isActive = currentStep === step.number
        const isComplete = currentStep > step.number
        return (
          <div key={step.number} className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <motion.div
                className={`flex size-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${isActive
                    ? 'bg-mint text-background shadow-[0_0_20px_var(--mint-glow)]'
                    : isComplete
                      ? 'bg-mint/20 text-mint'
                      : 'border border-line bg-panel text-subtle'
                  }`}
                animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {isComplete ? <CheckCircle2 size={14} /> : step.number}
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors duration-300 ${isActive ? 'text-foreground' : 'text-subtle/60'
                  }`}
              >
                {step.label}
              </span>
            </div>
            {i < visibleSteps.length - 1 && (
              <div className="relative h-px w-8 bg-line overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-mint"
                  initial={{ width: '0%' }}
                  animate={{ width: isComplete ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Right-Panel Visuals ────────────────────────────────────── */

function VisualStep1({ skipInitial }: { skipInitial?: boolean }) {
  return (
    <motion.div
      key="visual-1"
      initial={skipInitial ? false : vfInitial}
      animate={vfAnimate}
      exit={vfExit}
      className="flex flex-col items-center text-center"
    >
      {/* Glowing shield */}
      <div className="relative mb-10">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-mint/10 blur-[60px]" />
        <motion.div
          className="flex size-32 items-center justify-center rounded-3xl border border-mint/20 bg-background/40 shadow-[0_0_50px_var(--mint-glow),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
          animate={{
            boxShadow: [
              '0 0 50px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
              '0 0 80px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              '0 0 50px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Shield size={48} className="text-mint" strokeWidth={1.5} />
        </motion.div>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
        Bank-level security for your clinic.
      </h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-subtle">
        Your master account controls access for all staff.
      </p>
      <ul className="mt-6 space-y-2.5 text-left text-sm text-gray-400">
        {[
          'End-to-end encrypted credentials',
          'Role-based access for every team member',
          'Audit logs for full accountability',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="shrink-0 text-mint/70" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function VisualStep2({ skipInitial }: { skipInitial?: boolean }) {
  return (
    <motion.div
      key="visual-2"
      initial={skipInitial ? false : vfInitial}
      animate={vfAnimate}
      exit={vfExit}
      className="flex flex-col items-center text-center"
    >
      {/* Map pin + WhatsApp graphic */}
      <div className="relative mb-10 flex items-center gap-6">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-mint/8 blur-[50px]" />
        <motion.div
          className="flex size-20 items-center justify-center rounded-2xl border border-line bg-background/40 backdrop-blur-xl shadow-[0_0_30px_var(--mint-glow)]"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <MapPin size={32} className="text-mint" strokeWidth={1.5} />
        </motion.div>
        {/* Connector line */}
        <div className="relative h-px w-12 bg-gradient-to-r from-mint/60 to-mint/20">
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 size-2 rounded-full bg-mint shadow-[0_0_8px_var(--mint)]"
            animate={{ x: [0, 48, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <motion.div
          className="flex size-20 items-center justify-center rounded-2xl border border-mint/30 bg-background/40 backdrop-blur-xl shadow-[0_0_40px_rgba(37,211,102,0.15)]"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <MessageCircle size={32} className="text-[#25d366]" strokeWidth={1.5} />
        </motion.div>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
        Plug into the digital health grid.
      </h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-subtle">
        We route patients and prescriptions seamlessly.
      </p>
      <ul className="mt-6 space-y-2.5 text-left text-sm text-gray-400">
        {[
          'WhatsApp-integrated patient comms',
          'Auto-generated booking links',
          'Smart payment reconciliation',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="shrink-0 text-mint/70" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function VisualStep3({ skipInitial }: { skipInitial?: boolean }) {
  const avatars = [
    { label: 'Admin', color: 'bg-mint', icon: Shield },
    { label: 'Doctor', color: 'bg-sky-500', icon: Stethoscope },
    { label: 'Receptionist', color: 'bg-violet-500', icon: User },
  ]

  return (
    <motion.div
      key="visual-3"
      initial={skipInitial ? false : vfInitial}
      animate={vfAnimate}
      exit={vfExit}
      className="flex flex-col items-center text-center"
    >
      <div className="relative mb-10 flex items-center gap-5">
        <div className="absolute inset-0 -z-10 scale-[2] rounded-full bg-mint/8 blur-[60px]" />
        {avatars.map((av, i) => (
          <div key={av.label} className="flex flex-col items-center gap-2">
            <motion.div
              className={`flex size-16 items-center justify-center rounded-2xl ${av.color}/15 border border-line backdrop-blur-xl shadow-[0_0_25px_rgba(16,185,129,0.1)]`}
              animate={{
                scale: [1, 1.08, 1],
                boxShadow: [
                  '0 0 25px rgba(16,185,129,0.1)',
                  '0 0 40px rgba(16,185,129,0.2)',
                  '0 0 25px rgba(16,185,129,0.1)',
                ],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.3,
              }}
            >
              <av.icon size={24} className={`text-${av.color.replace('bg-', '')}`} strokeWidth={1.5} />
            </motion.div>
            <span className="text-[10px] font-medium text-subtle">{av.label}</span>
            {i < avatars.length - 1 && (
              <motion.div
                className="absolute top-8 h-px w-5 bg-mint/30"
                style={{ left: `calc(${(i + 1) * 33}% - 10px)` }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
              />
            )}
          </div>
        ))}
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
        Total synchronization.
      </h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-subtle">
        Dedicated, secure access for every role.
      </p>
      <ul className="mt-6 space-y-2.5 text-left text-sm text-gray-400">
        {[
          'One-click doctor & receptionist setup',
          'Custom portals per role',
          'Instantly revoke or rotate access',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="shrink-0 text-mint/70" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function VisualStep4({ skipInitial }: { skipInitial?: boolean }) {
  return (
    <motion.div
      key="visual-4"
      initial={skipInitial ? false : vfInitial}
      animate={vfAnimate}
      exit={vfExit}
      className="flex flex-col items-center text-center"
    >
      <div className="relative mb-10">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-mint/10 blur-[60px]" />
        <motion.div
          className="flex size-32 items-center justify-center rounded-3xl border border-mint/20 bg-background/40 shadow-[0_0_50px_var(--mint-glow),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl"
          animate={{
            boxShadow: [
              '0 0 50px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
              '0 0 80px rgba(16,185,129,0.25), inset 0 1px 0 rgba(255,255,255,0.1)',
              '0 0 50px rgba(16,185,129,0.15), inset 0 1px 0 rgba(255,255,255,0.06)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ShieldCheck size={48} className="text-mint" strokeWidth={1.5} />
        </motion.div>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
        Verify your identity.
      </h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-subtle">
        We sent an 8-digit verification code to your email.
      </p>
      <ul className="mt-6 space-y-2.5 text-left text-sm text-gray-400">
        {[
          'Code expires in 10 minutes',
          'Check spam if not in inbox',
          'One-time use for maximum security',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="shrink-0 text-mint/70" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function VisualStep5({ skipInitial }: { skipInitial?: boolean }) {
  return (
    <motion.div
      key="visual-5"
      initial={skipInitial ? false : vfInitial}
      animate={vfAnimate}
      exit={vfExit}
      className="flex flex-col items-center text-center"
    >
      {/* Confetti particles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: Math.random() * 6 + 3,
              height: Math.random() * 6 + 3,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              backgroundColor: ['#10b981', '#34d399', '#6ee7b7', '#a78bfa', '#60a5fa', '#fbbf24'][
                Math.floor(Math.random() * 6)
              ],
            }}
            animate={{
              y: [0, -30, 10, -20, 0],
              x: [0, 15, -10, 5, 0],
              opacity: [0, 1, 0.8, 1, 0],
              scale: [0, 1.2, 0.8, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <div className="relative mb-8">
        <div className="absolute inset-0 -z-10 scale-150 rounded-full bg-mint/15 blur-[60px]" />
        <motion.div
          className="flex size-24 items-center justify-center rounded-3xl border border-mint/20 bg-background/40 backdrop-blur-xl shadow-[0_0_50px_var(--mint-glow)]"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Stethoscope size={40} className="text-mint" strokeWidth={1.5} />
        </motion.div>
      </div>
      <h3 className="text-2xl font-semibold tracking-tight text-foreground">
        Welcome to the future of healthcare.
      </h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-subtle">
        Your clinic is live. Start transforming patient care today.
      </p>
      <ul className="mt-6 space-y-2.5 text-left text-sm text-gray-400">
        {[
          'Dashboard ready — explore analytics',
          'Invite more staff anytime',
          'Priority onboarding support',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2.5">
            <CheckCircle2 size={14} className="shrink-0 text-mint/70" />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

/* ─── Credential Copy Button ─────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex size-7 shrink-0 items-center justify-center rounded-md text-subtle/60 hover:bg-mint/10 hover:text-mint transition-all duration-200"
      title="Copy to clipboard"
    >
      {copied ? <Check size={13} className="text-mint" /> : <Copy size={13} />}
    </button>
  )
}

/* ─── Main Page ──────────────────────────────────────────────── */

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [form, setForm] = useState<FormData>(initialForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [registrationError, setRegistrationError] = useState('')
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredential[]>([])
  const supabase = useRef(createClient()).current
  const hasMounted = useRef(false)

  // Step 1 field refs for Enter-key navigation
  const refPhone = useRef<HTMLInputElement | null>(null)
  const refEmail = useRef<HTMLInputElement | null>(null)
  const refPassword = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    hasMounted.current = true
  }, [])

  const goTo = useCallback(
    (next: number) => {
      setDirection(next > step ? 1 : -1)
      setStep(next)
    },
    [step],
  )

  // ── Derive slug from clinic name ──────────────────────────────────────────
  const slug = form.clinicName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')

  // ── Step 3 → 4: Owner signUp only (no server action yet) ─────────────────
  const handleLaunch = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const sanitizedEmail = form.ownerEmail.trim().toLowerCase()

      const { data: ownerAuth, error: ownerError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: form.ownerPassword,
        options: { data: { full_name: form.ownerName, role: 'admin' } },
      })

      if (ownerError || !ownerAuth.user) {
        alert(ownerError?.message ?? 'Failed to create owner account.')
        setIsSubmitting(false)
        return
      }

      // Success — advance to OTP verification (Step 4)
      setIsSubmitting(false)
      goTo(4)
    } catch (err) {
      console.error('[handleLaunch] Unexpected error:', err)
      alert('An unexpected error occurred. Please try again.')
      setIsSubmitting(false)
    }
  }, [form, supabase, goTo])

  // ── Step 4: OTP Verification + full clinic seeding (single server action) ─────
  // codeOverride: lets the onChange handler pass the fresh paste value directly,
  // bypassing the stale React state closure that causes the length check to fail.
  const handleVerifyOtp = useCallback(async (codeOverride?: string) => {
    const sanitized = (codeOverride ?? otpCode).replace(/\D/g, '')
    if (sanitized.length !== 8) {
      setOtpError('Please enter the full 8-digit code.')
      return
    }

    setIsVerifying(true)
    setOtpError('')
    setRegistrationError('')

    try {
      const safeClinic = form.clinicName.toLowerCase().replace(/[^a-z0-9]/g, '')

      const result = await verifyOtpAndSetupClinic({
        email: form.ownerEmail.trim().toLowerCase(),
        otp: sanitized,
        owner_name: form.ownerName,
        clinic: {
          name: form.clinicName,
          slug,
          address: form.clinicAddress,
          consultation_fee: Number(form.consultationFee),
          whatsapp_number: form.whatsappNumber,
          bank_name: form.bankName,
          bank_iban: form.bankIban,
          easypaisa_number: form.easypaisaNumber,
        },
        staff: form.doctors
          .filter((doc) => doc.name.trim() !== '')
          .map((doc) => ({
            full_name: doc.name,
            password: doc.password,
            credentials: doc.speciality,
          })),
      })

      if ('error' in result) {
        console.error('[handleVerifyOtp] Server action failed:', result.error)
        // OTP is already consumed — do not allow retry with same code.
        // Show error and instruct user to restart.
        setRegistrationError(result.error)
        setOtpCode('')  // clear the input so they can't accidentally re-submit
        setIsVerifying(false)
        return
      }

      // Build generated credentials list from the server's response
      setGeneratedCredentials(
        result.generatedStaff.map((s) => ({
          role: 'Doctor',
          name: s.name,
          email: s.email,
          password: s.password,
        }))
      )

      setIsVerifying(false)
      goTo(5)
    } catch (err) {
      console.error('[handleVerifyOtp] Unexpected client-side error:', err)
      setRegistrationError('An unexpected error occurred. Please restart the signup flow.')
      setOtpCode('')
      setIsVerifying(false)
    }
  }, [form, slug, otpCode, goTo])

  // ── Restart: OTP is consumed and auth user deleted on DB failure ────────────
  // We can just re-run handleLaunch to recreate the auth user and send a new OTP.
  const handleRestartSignup = useCallback(async () => {
    setRegistrationError('')
    setOtpError('')
    setOtpCode('')
    await handleLaunch()
  }, [handleLaunch])

  const updateField = useCallback(
    <K extends keyof FormData>(key: K, value: FormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    [],
  )

  const updateDoctor = useCallback(
    (id: string, field: keyof Doctor, value: string) => {
      setForm((prev) => ({
        ...prev,
        doctors: prev.doctors.map((d) => (d.id === id ? { ...d, [field]: value } : d)),
      }))
    },
    [],
  )

  const addDoctor = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      doctors: [
        ...prev.doctors,
        { id: Date.now().toString(), name: '', speciality: '', password: '' },
      ],
    }))
  }, [])

  const removeDoctor = useCallback((id: string) => {
    setForm((prev) => ({
      ...prev,
      doctors: prev.doctors.filter((d) => d.id !== id),
    }))
  }, [])

  /* ─── Render ─────────────────────────────────────────────── */

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* ════════════════════════ RIGHT PANEL (Visual) ════════════════════════ */}
      {/* Mobile: fixed 30vh header | Desktop: 50% sticky right */}
      <div className="relative flex h-[30vh] w-full shrink-0 items-center justify-center overflow-hidden lg:sticky lg:top-0 lg:h-dvh lg:w-1/2 lg:order-2">
        {/* Ambient gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-panel-strong to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.08),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.05),transparent_60%)]" />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Crossfade content */}
        <div className="relative z-10 flex flex-col items-center justify-center px-8">
          <AnimatePresence mode="wait">
            {step === 1 && <VisualStep1 skipInitial={!hasMounted.current} />}
            {step === 2 && <VisualStep2 />}
            {step === 3 && <VisualStep3 />}
            {step === 4 && <VisualStep4 />}
            {step === 5 && <VisualStep5 />}
          </AnimatePresence>
        </div>
      </div>

      {/* ════════════════════════ LEFT PANEL (Form Workspace) ════════════════ */}
      <div className="relative flex w-full flex-1 flex-col overflow-y-auto bg-background lg:w-1/2 lg:order-1">
        <div className="flex flex-1 flex-col px-6 py-10 sm:px-12 lg:px-16 xl:px-24 lg:py-16">
          {/* Logo */}
          <a
            href="/"
            className="mb-10 flex items-center gap-2.5 text-sm font-semibold tracking-tight text-foreground"
          >
            <span className="flex size-8 items-center justify-center rounded-lg border border-line bg-panel text-mint shadow-[0_0_22px_var(--mint-glow)]">
              <Stethoscope size={17} strokeWidth={2.2} />
            </span>
            <span className="text-[17px]">opedox</span>
          </a>

          {/* Stepper (hidden on success) */}
          {step < 5 && (
            <div className="mb-10">
              <Stepper currentStep={step} />
            </div>
          )}

          {/* Animated form steps */}
          <AnimatePresence mode="wait" custom={direction}>
            {/* ──────── Step 1: Account Owner ──────── */}
            {step === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1"
              >
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  Create your master account
                </h1>
                <p className="mt-2 text-sm text-subtle">
                  This owner account has full administrative control.
                </p>

                <div className="mt-8 space-y-5">
                  <FormInput
                    id="signup-name"
                    label="Full Name"
                    icon={User}
                    placeholder="Dr. Ahmed Khan"
                    value={form.ownerName}
                    onChange={(v) => updateField('ownerName', v)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); refPhone.current?.focus() } }}
                  />
                  <FormInput
                    id="signup-phone"
                    inputRef={refPhone}
                    label="Admin Phone"
                    icon={Phone}
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={form.ownerPhone}
                    onChange={(v) => updateField('ownerPhone', v)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); refEmail.current?.focus() } }}
                  />
                  <FormInput
                    id="signup-email"
                    inputRef={refEmail}
                    label="Admin Email"
                    icon={Mail}
                    type="email"
                    placeholder="admin@clinic.com"
                    value={form.ownerEmail}
                    onChange={(v) => updateField('ownerEmail', v)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); refPassword.current?.focus() } }}
                  />
                  <FormInput
                    id="signup-password"
                    inputRef={refPassword}
                    label="Master Password"
                    icon={Lock}
                    type="password"
                    placeholder="Min. 8 characters"
                    value={form.ownerPassword}
                    onChange={(v) => updateField('ownerPassword', v)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); goTo(2) } }}
                  />
                </div>

                <button
                  onClick={() => goTo(2)}
                  className="group mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-panel-strong border border-line px-6 py-3.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-mint/30 hover:shadow-[0_0_25px_var(--mint-glow)] active:scale-[0.98]"
                >
                  Continue to Clinic Setup
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </button>
              </motion.div>
            )}

            {/* ──────── Step 2: Clinic & Integrations ──────── */}
            {step === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1"
              >
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  Set up your clinic
                </h1>
                <p className="mt-2 text-sm text-subtle">
                  Core details and digital integrations.
                </p>

                <div className="mt-8 space-y-5">
                  <FormInput
                    label="Clinic Name"
                    icon={Building2}
                    placeholder="City Care Hospital"
                    value={form.clinicName}
                    onChange={(v) => updateField('clinicName', v)}
                  />
                  <FormInput
                    label="Physical Address"
                    icon={MapPin}
                    placeholder="42-B Main Boulevard, Lahore"
                    value={form.clinicAddress}
                    onChange={(v) => updateField('clinicAddress', v)}
                  />
                  <FormInput
                    label="Consultation Fee"
                    icon={CreditCard}
                    placeholder="PKR 2,000"
                    value={form.consultationFee}
                    onChange={(v) => updateField('consultationFee', v)}
                  />
                  <FormInput
                    label="WhatsApp API Number"
                    icon={MessageCircle}
                    type="tel"
                    placeholder="+92 300 1234567"
                    value={form.whatsappNumber}
                    onChange={(v) => updateField('whatsappNumber', v)}
                  />
                  <FormInput
                    label="Bank Name"
                    icon={Building2}
                    placeholder="Meezan Bank"
                    value={form.bankName}
                    onChange={(v) => updateField('bankName', v)}
                  />
                  <FormInput
                    label="Bank IBAN"
                    icon={CreditCard}
                    placeholder="PK36SCBL0000001123456702"
                    value={form.bankIban}
                    onChange={(v) => updateField('bankIban', v)}
                  />
                  <FormInput
                    label="Easypaisa Number"
                    icon={Phone}
                    type="tel"
                    placeholder="0300-1234567"
                    value={form.easypaisaNumber}
                    onChange={(v) => updateField('easypaisaNumber', v)}
                  />
                </div>

                <div className="mt-10 flex gap-3">
                  <button
                    onClick={() => goTo(1)}
                    className="rounded-xl border border-line bg-panel px-5 py-3.5 text-sm font-medium text-subtle transition-colors hover:text-foreground hover:border-line/80"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => goTo(3)}
                    className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-panel-strong border border-line px-6 py-3.5 text-sm font-medium text-foreground transition-all duration-200 hover:border-mint/30 hover:shadow-[0_0_25px_var(--mint-glow)] active:scale-[0.98]"
                  >
                    Continue to Staff Setup
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ──────── Step 3: Staff Roster (No email inputs) ──────── */}
            {step === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex-1"
              >
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  Add your team
                </h1>
                <p className="mt-2 text-sm text-subtle">
                  Set up accounts for each role. Login emails are auto-generated for your staff.
                </p>



                {/* Doctor Cards */}
                <AnimatePresence initial={false}>
                  {form.doctors.map((doc, idx) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl border border-line bg-panel/50 p-5 sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
                              <Stethoscope size={18} />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">
                                Doctor {idx + 1}
                              </h3>
                              <p className="text-[11px] text-subtle">Full clinical access</p>
                            </div>
                          </div>
                          {form.doctors.length > 1 && (
                            <button
                              onClick={() => removeDoctor(doc.id)}
                              className="flex size-8 items-center justify-center rounded-lg text-subtle hover:bg-red-500/10 hover:text-red-400 transition-colors"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                        <div className="space-y-4">
                          <FormInput
                            label="Full Name"
                            icon={User}
                            placeholder="Dr. Fatima Noor"
                            value={doc.name}
                            onChange={(v) => updateDoctor(doc.id, 'name', v)}
                          />
                          <FormInput
                            label="Medical Speciality"
                            icon={Stethoscope}
                            placeholder="General Physician"
                            value={doc.speciality}
                            onChange={(v) => updateDoctor(doc.id, 'speciality', v)}
                          />
                          <FormInput
                            label="Password"
                            icon={Lock}
                            type="password"
                            placeholder="Min. 8 characters"
                            value={doc.password}
                            onChange={(v) => updateDoctor(doc.id, 'password', v)}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Add Doctor Ghost Button */}
                <button
                  onClick={addDoctor}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-line py-3 text-xs font-medium text-subtle transition-all hover:border-mint/30 hover:text-mint hover:bg-mint/5"
                >
                  <Plus size={14} />
                  Add Another Doctor
                </button>

                <div className="mt-10 flex gap-3">
                  <button
                    onClick={() => goTo(2)}
                    className="rounded-xl border border-line bg-panel px-5 py-3.5 text-sm font-medium text-subtle transition-colors hover:text-foreground hover:border-line/80"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleLaunch}
                    disabled={isSubmitting}
                    className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-mint px-6 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_30px_var(--mint-glow)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Launching…
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Launch Opedox Clinic
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ──────── Step 4: OTP Verification ──────── */}
            {step === 4 && (
              <motion.div
                key="step-4"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-1 flex-col"
              >
                <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
                  Verify your email
                </h1>
                <p className="mt-2 text-sm text-subtle">
                  We sent an 8-digit code to{' '}
                  <span className="font-medium text-mint">{form.ownerEmail.trim().toLowerCase()}</span>.
                  Check your inbox (and spam).
                </p>

                <div className="mt-10 space-y-6">
                  {/* OTP Input */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs font-medium tracking-wide text-subtle">
                      <KeyRound size={13} className="text-mint/70" />
                      Verification Code
                    </label>
                    <div className="group relative flex justify-center">
                      <InputOTP
                        maxLength={8}
                        value={otpCode}
                        onChange={(value) => {
                          // Aggressively strip all non-numeric chars (handles paste with spaces/dashes)
                          const sanitized = value.replace(/\D/g, '').slice(0, 8);
                          setOtpCode(sanitized);
                          setOtpError('');
                          if (sanitized.length === 8 && !isVerifying) {
                            // Pass the fresh value directly — do NOT rely on React state here.
                            // State update (setOtpCode) is async; by the time setTimeout fires,
                            // the old closure value would still be stale.
                            setTimeout(() => handleVerifyOtp(sanitized), 0);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && otpCode.replace(/\D/g, '').length === 8) {
                            e.preventDefault();
                            handleVerifyOtp(otpCode);
                          }
                        }}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                          <InputOTPSlot index={1} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                          <InputOTPSlot index={2} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                          <InputOTPSlot index={3} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                        </InputOTPGroup>
                        <InputOTPSeparator className="text-mint/40" />
                        <InputOTPGroup>
                          <InputOTPSlot index={4} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                          <InputOTPSlot index={5} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                          <InputOTPSlot index={6} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                          <InputOTPSlot index={7} className="w-12 h-14 text-xl border-mint/20 text-foreground" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    {otpError && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-red-400 mt-1"
                      >
                        {otpError}
                      </motion.p>
                    )}
                  </div>

                  {/* Registration error — OTP is consumed, restart required */}
                  {registrationError && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3.5 space-y-3"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-red-400">Clinic setup failed</p>
                        <p className="text-xs text-red-300/80 leading-relaxed font-mono break-words">{registrationError}</p>
                      </div>
                      <p className="text-[11px] text-red-400/70 leading-relaxed">
                        The previous verification code was consumed.
                        Click below to request a fresh code and try again.
                      </p>
                      <button
                        onClick={handleRestartSignup}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Requesting...' : 'Request New Code'}
                      </button>
                    </motion.div>
                  )}

                  {/* Info hint */}
                  {!registrationError && (
                    <div className="rounded-xl border border-mint/10 bg-mint/5 px-4 py-3">
                      <p className="text-xs text-subtle leading-relaxed">
                        <span className="font-medium text-mint">Tip:</span> The code expires in 10 minutes. If you don&apos;t see the email, check your spam folder.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-10 flex gap-3">
                  <button
                    onClick={() => handleVerifyOtp()}
                    disabled={isVerifying || otpCode.length !== 8}
                    className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-mint px-6 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_30px_var(--mint-glow)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isVerifying ? (
                      <>
                        <svg
                          className="animate-spin h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Verifying…
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        Verify &amp; Complete Setup
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ──────── Step 5: Success & Credentials ──────── */}
            {step === 5 && (
              <motion.div
                key="step-5"
                custom={direction}
                variants={formVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-1 flex-col items-center justify-center text-center"
              >
                <motion.div
                  className="mb-6 flex size-20 items-center justify-center rounded-full bg-mint/15"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                >
                  <CheckCircle2 size={40} className="text-mint" />
                </motion.div>

                <motion.h1
                  className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  Clinic Registered Successfully!
                </motion.h1>
                <motion.p
                  className="mt-2 text-sm text-subtle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Your workspace is ready. Save the staff credentials below.
                </motion.p>

                {/* Staff Credentials Card */}
                <motion.div
                  className="mt-8 w-full max-w-md rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent p-6 text-left backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55 }}
                >
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                      <KeyRound size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Staff Credentials</h3>
                      <p className="text-[11px] text-amber-400/80">
                        Screenshot or copy — these won&apos;t be shown again
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {generatedCredentials.map((cred, idx) => (
                      <motion.div
                        key={idx}
                        className="rounded-xl border border-line bg-panel/60 p-4"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + idx * 0.1 }}
                      >
                        <div className="mb-2 flex items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${cred.role === 'Doctor'
                                ? 'bg-sky-500/15 text-sky-400'
                                : 'bg-violet-500/15 text-violet-400'
                              }`}
                          >
                            {cred.role}
                          </span>
                          <span className="text-xs font-medium text-foreground">{cred.name}</span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <Mail size={11} className="shrink-0 text-subtle/50" />
                            <span className="flex-1 truncate text-xs font-mono text-mint">
                              {cred.email}
                            </span>
                            <CopyButton text={cred.email} />
                          </div>
                          <div className="flex items-center gap-2">
                            <Lock size={11} className="shrink-0 text-subtle/50" />
                            <span className="flex-1 truncate text-xs font-mono text-foreground/80">
                              {cred.password}
                            </span>
                            <CopyButton text={cred.password} />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Summary Card */}
                <motion.div
                  className="mt-4 w-full max-w-md rounded-2xl border border-line bg-panel/60 p-6 text-left backdrop-blur-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-subtle">
                        Clinic Name
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {form.clinicName || 'City Care Hospital'}
                      </p>
                    </div>
                    <div className="h-px bg-line" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-subtle">
                        Admin
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        {form.ownerName || 'Dr. Ahmed Khan'}
                      </p>
                    </div>
                    <div className="h-px bg-line" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-subtle">
                        Clinic URL
                      </p>
                      <div className="mt-1 flex items-center gap-2 rounded-lg border border-mint/20 bg-mint/5 px-3 py-2">
                        <span className="text-sm font-mono text-mint">
                          opedox.com/
                          {(form.clinicName || 'city-care')
                            .toLowerCase()
                            .replace(/\s+/g, '-')
                            .replace(/[^a-z0-9-]/g, '')}
                        </span>
                        <ExternalLink size={13} className="ml-auto text-mint/60" />
                      </div>
                    </div>
                    <div className="h-px bg-line" />
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.15em] text-subtle">
                        Team Size
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground">
                        1 Admin · {form.doctors.length} Doctor{form.doctors.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.button
                  onClick={() => router.push('/dashboard/admin')}
                  className="group mt-8 flex items-center gap-2 rounded-xl bg-mint px-8 py-3.5 text-sm font-semibold text-background transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_30px_var(--mint-glow)] active:scale-[0.98]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.85 }}
                >
                  Go to Admin Dashboard
                  <ArrowRight
                    size={16}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <p className="mt-auto pt-8 text-[11px] text-subtle/50">
            © {new Date().getFullYear()} Opedox. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
