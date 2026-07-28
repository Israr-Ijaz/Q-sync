'use client';

import { useState, useRef, useId, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { createClient } from '@/utils/supabase/client';

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = 'doctor' | 'receptionist';

interface FormState {
  email: string;
  password: string;
  loading: boolean;
  error: string | null;
}

// ─── SVG: Obsidian Hex Grid ───────────────────────────────────────────────────
function HexGrid() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hex" x="0" y="0" width="60" height="69.28" patternUnits="userSpaceOnUse">
          <polygon
            points="30,2 56,17 56,47 30,62 4,47 4,17"
            fill="none"
            stroke="rgba(0,204,204,0.055)"
            strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

// ─── SVG: Caduceus ────────────────────────────────────────────────────────────
function Caduceus({ glowing }: { glowing: boolean }) {
  return (
    <svg
      viewBox="0 0 56 76"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="cStaff" x1="28" y1="4" x2="28" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="cSnake" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f766e" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="cWing" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#0891b2" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id="cOrb" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#e0fdf4" />
          <stop offset="60%" stopColor="#2dd4bf" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.4" />
        </radialGradient>
        {glowing && (
          <filter id="cGlow">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Staff */}
      <line
        x1="28" y1="10" x2="28" y2="74"
        stroke="url(#cStaff)"
        strokeWidth="3"
        strokeLinecap="round"
        filter={glowing ? 'url(#cGlow)' : undefined}
      />

      {/* Left wing */}
      <path
        d="M28 16 C18 10, 6 14, 8 24 C10 32, 22 30, 28 28"
        stroke="url(#cWing)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right wing */}
      <path
        d="M28 16 C38 10, 50 14, 48 24 C46 32, 34 30, 28 28"
        stroke="url(#cWing)"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Snake left */}
      <path
        d="M28 28 C18 31, 12 40, 20 46 C28 52, 18 58, 22 66 C24 71, 28 73, 28 73"
        stroke="url(#cSnake)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        filter={glowing ? 'url(#cGlow)' : undefined}
      />
      {/* Snake right */}
      <path
        d="M28 28 C38 31, 44 40, 36 46 C28 52, 38 58, 34 66 C32 71, 28 73, 28 73"
        stroke="url(#cSnake)"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        filter={glowing ? 'url(#cGlow)' : undefined}
      />

      {/* Top orb */}
      <circle cx="28" cy="8" r="5.5" fill="url(#cOrb)" filter={glowing ? 'url(#cGlow)' : undefined} />
    </svg>
  );
}

// ─── Recessed Dark Input ──────────────────────────────────────────────────────
function ObsidianInput({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  autoComplete,
  icon,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  autoComplete: string;
  icon: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: focused ? '#00cccc' : '#4a6a6a' }}
      >
        {label}
      </label>

      <div className="relative">
        {/* Cyan glow ring — only when focused */}
        <AnimatePresence>
          {focused && (
            <motion.div
              key="glow"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-none absolute inset-0 rounded-xl"
              style={{
                boxShadow: '0 0 0 1.5px #00cccc55, 0 0 18px #00cccc22, 0 0 40px #00cccc0a',
              }}
            />
          )}
        </AnimatePresence>

        {/* Icon */}
        <span
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300"
          style={{ color: focused ? '#00cccc' : '#2a4a4a' }}
        >
          {icon}
        </span>

        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: 'rgba(4,8,10,0.85)',
            border: focused
              ? '1px solid rgba(0,204,204,0.35)'
              : '1px solid rgba(0,204,204,0.08)',
            boxShadow: [
              'inset 0 2px 10px rgba(0,0,0,0.6)',
              'inset 0 1px 3px rgba(0,0,0,0.8)',
              'inset 0 -1px 0 rgba(0,204,204,0.04)',
            ].join(', '),
            color: '#cce8e8',
            caretColor: '#00cccc',
          }}
        />
      </div>
    </div>
  );
}

// ─── Register Disabled Modal ──────────────────────────────────────────────────
function RegisterModal({ onClose }: { onClose: () => void }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.94, y: 16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.94, y: 10, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(8,16,20,0.98) 0%, rgba(4,12,16,0.95) 100%)',
          border: '1px solid rgba(0,204,204,0.15)',
          boxShadow: '0 0 0 1px rgba(0,204,204,0.08), 0 32px 80px rgba(0,0,0,0.9), 0 0 60px rgba(0,204,204,0.05)',
        }}
      >
        {/* Top cyan accent bar */}
        <div
          className="h-[2px] w-full"
          style={{ background: 'linear-gradient(90deg, transparent, #00cccc88, transparent)' }}
        />

        <div className="flex flex-col gap-4 p-7">
          {/* Icon */}
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'rgba(0,204,204,0.1)', border: '1px solid rgba(0,204,204,0.2)' }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5 text-cyan-400" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-white">Public Registration Disabled</h3>
            <p className="text-xs leading-relaxed" style={{ color: '#7a9a9a' }}>
              Self-registration is not available. For clinic licensing and multi-tenant
              onboarding, please contact our implementation team:
            </p>
            <a
              href="mailto:info@qsync.com"
              className="mt-1 inline-block text-xs font-semibold transition-colors duration-150"
              style={{ color: '#00cccc' }}
            >
              info@qsync.com
            </a>
          </div>

          <button
            onClick={onClose}
            className="mt-2 w-full rounded-xl py-2.5 text-xs font-semibold transition-all duration-200"
            style={{
              background: 'rgba(0,204,204,0.08)',
              border: '1px solid rgba(0,204,204,0.15)',
              color: '#00cccc',
            }}
          >
            Understood
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();
  const uid = useId();
  const supabase = useRef(createClient()).current;

  const [form, setForm] = useState<FormState>({
    email: '',
    password: '',
    loading: false,
    error: null,
  });
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [caduceusGlowing, setCaduceusGlowing] = useState(false);

  // Pulsing caduceus glow on mount
  useEffect(() => {
    const id = setInterval(() => setCaduceusGlowing((v) => !v), 2200);
    return () => clearInterval(id);
  }, []);

  // Card tilt on mouse move
  const cardRef = useRef<HTMLDivElement>(null);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const cardShadow = useTransform(
    [rotateX, rotateY],
    ([rx, ry]: number[]) =>
      `0 ${30 + ry * 1.5}px ${80 + Math.abs(rx) * 2}px rgba(0,0,0,0.85), 0 0 60px rgba(0,204,204,0.06)`,
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    rotateY.set(((e.clientX - cx) / rect.width) * 6);
    rotateX.set(-((e.clientY - cy) / rect.height) * 5);
  };
  const handleMouseLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const set = (field: 'email' | 'password') => (v: string) =>
    setForm((prev) => ({ ...prev, [field]: v, error: null }));

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setForm((prev) => ({ ...prev, error: 'Both fields are required.' }));
      return;
    }

    setForm((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // ── Real Supabase auth ─────────────────────────────────────────────────
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });

      if (authError || !authData.user) {
        setForm((prev) => ({
          ...prev,
          loading: false,
          error: authError?.message ?? 'Authentication failed. Please try again.',
        }));
        return;
      }

      // ── Fetch role from profiles table ─────────────────────────────────────
      // Assumes a `profiles` table with columns: id (FK → auth.users), role (text)
      // Replace with your actual table/column names as needed.
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', authData.user.id)
        .maybeSingle();

      // Gracefully handle missing profile — fall back to receptionist
      if (profileError) {
        console.warn('[Login] Could not fetch role, defaulting to receptionist:', profileError.message);
      }

      const role = (profile?.role as Role | undefined) ?? 'receptionist';

      // ── Role-based redirect ────────────────────────────────────────────────
      router.push(role === 'doctor' ? '/dashboard/doctor' : '/dashboard/receptionist');

    } catch (err) {
      console.error('[Login] Unexpected error:', err);
      setForm((prev) => ({
        ...prev,
        loading: false,
        error: 'An unexpected error occurred. Please try again.',
      }));
    }
  };

  return (
    <>
      {/* ── Register disabled modal ── */}
      <AnimatePresence>
        {showRegisterModal && (
          <RegisterModal onClose={() => setShowRegisterModal(false)} />
        )}
      </AnimatePresence>

      <div
        className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-4 py-12"
        style={{ background: '#081014' }}
      >
        {/* ── Obsidian hex grid ── */}
        <HexGrid />

        {/* ── Nebula gradient blobs ── */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Top-left deep teal nebula */}
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.55, 0.35] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-48 -left-48 h-[700px] w-[700px] rounded-full blur-[160px]"
            style={{ background: 'radial-gradient(circle, #004d4d 0%, transparent 65%)' }}
          />
          {/* Bottom-right midnight blue */}
          <motion.div
            animate={{ scale: [1, 1.12, 1], opacity: [0.25, 0.4, 0.25] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
            className="absolute -bottom-56 -right-48 h-[650px] w-[650px] rounded-full blur-[150px]"
            style={{ background: 'radial-gradient(circle, #002a3a 0%, transparent 65%)' }}
          />
          {/* Center faint cyan veil */}
          <div
            className="absolute top-1/2 left-1/2 h-[400px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]"
            style={{ background: 'radial-gradient(ellipse, #00cccc09 0%, transparent 70%)' }}
          />
        </div>

        {/* ── Top specular edge gleam ── */}
        <motion.div
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #00cccc66, transparent)' }}
        />
        <motion.div
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{ background: 'linear-gradient(to right, transparent, #00cccc44, transparent)' }}
        />

        {/* ═══════════════ OBSIDIAN GLASS CARD ═══════════════ */}
        <motion.div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ rotateX, rotateY, boxShadow: cardShadow, transformStyle: 'preserve-3d' }}
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-[420px]"
        >
          <div
            className="relative overflow-hidden rounded-[2rem]"
            style={{
              background:
                'linear-gradient(155deg, rgba(10,18,24,0.92) 0%, rgba(6,12,16,0.85) 40%, rgba(8,16,22,0.9) 100%)',
              backdropFilter: 'blur(60px) saturate(160%)',
              WebkitBackdropFilter: 'blur(60px) saturate(160%)',
              border: '1px solid rgba(0,204,204,0.12)',
              boxShadow: [
                '0 0 0 1px rgba(0,204,204,0.07)',
                'inset 0 1px 0 rgba(0,204,204,0.12)',   // top specular
                'inset 0 -1px 0 rgba(0,204,204,0.04)',  // bottom edge
                'inset 1px 0 0 rgba(255,255,255,0.03)',  // left edge
              ].join(', '),
            }}
          >
            {/* Polished top-left highlight — refracted specular */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-px -left-px h-48 w-48 rounded-tl-[2rem]"
              style={{
                background:
                  'radial-gradient(ellipse at top left, rgba(0,204,204,0.12) 0%, transparent 65%)',
              }}
            />
            {/* Diagonal glass sheen */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'linear-gradient(118deg, rgba(0,204,204,0.06) 0%, transparent 35%, transparent 65%, rgba(0,204,204,0.03) 100%)',
              }}
            />
            {/* Top surface reflection */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-36"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)',
              }}
            />

            {/* ─── Content ─── */}
            <div className="relative z-10 flex flex-col gap-8 px-9 py-10">

              {/* ── Caduceus + Title ── */}
              <motion.div
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col items-center gap-5"
              >
                {/* Icon tile */}
                <div className="relative">
                  {/* Pulsing halo */}
                  <motion.div
                    animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.06, 1] }}
                    transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-[1.4rem] blur-xl"
                    style={{ background: 'radial-gradient(circle, #00cccc44 0%, transparent 70%)' }}
                  />
                  <div
                    className="relative flex h-[88px] w-[72px] items-center justify-center rounded-[1.4rem] p-3"
                    style={{
                      background:
                        'linear-gradient(155deg, rgba(0,50,50,0.9) 0%, rgba(0,30,36,0.95) 100%)',
                      border: '1px solid rgba(0,204,204,0.22)',
                      boxShadow: [
                        'inset 0 1px 0 rgba(0,204,204,0.2)',
                        'inset 0 -1px 0 rgba(0,0,0,0.5)',
                        '0 8px 24px rgba(0,0,0,0.6)',
                        '0 0 20px rgba(0,204,204,0.08)',
                      ].join(', '),
                    }}
                  >
                    <Caduceus glowing={caduceusGlowing} />
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2 text-center">
                  <motion.h1
                    animate={{
                      textShadow: caduceusGlowing
                        ? '0 0 20px rgba(0,204,204,0.4), 0 0 40px rgba(0,204,204,0.15)'
                        : '0 0 10px rgba(0,204,204,0.15)',
                    }}
                    transition={{ duration: 2.2, ease: 'easeInOut' }}
                    className="text-[1.35rem] font-bold tracking-tight"
                    style={{ color: '#00cccc' }}
                  >
                    Clinic Portal Entrance
                  </motion.h1>
                  <p className="text-[12px] font-medium leading-relaxed" style={{ color: '#4a7a7a' }}>
                    Verified access for authorized medical personnel only.
                  </p>
                </div>

                {/* Divider */}
                <div
                  className="h-px w-full"
                  style={{
                    background:
                      'linear-gradient(to right, transparent, rgba(0,204,204,0.2), transparent)',
                  }}
                />
              </motion.div>

              {/* ── Form ── */}
              <motion.form
                id={`${uid}-form`}
                onSubmit={handleSubmit}
                noValidate
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col gap-5"
              >
                {/* Staff ID */}
                <ObsidianInput
                  id={`${uid}-email`}
                  label="Staff ID"
                  type="email"
                  placeholder="doctor@clinic.med"
                  value={form.email}
                  onChange={set('email')}
                  disabled={form.loading}
                  autoComplete="email"
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path d="M10 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3.465 14.493a1.23 1.23 0 0 0 .41 1.412A9.957 9.957 0 0 0 10 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 0 0-13.074.003Z" />
                    </svg>
                  }
                />

                {/* Access Code */}
                <ObsidianInput
                  id={`${uid}-password`}
                  label="Access Code"
                  type="password"
                  placeholder="••••••••••••"
                  value={form.password}
                  onChange={set('password')}
                  disabled={form.loading}
                  autoComplete="current-password"
                  icon={
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                    </svg>
                  }
                />

                {/* Inline error */}
                <AnimatePresence>
                  {form.error && (
                    <motion.div
                      key="err"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.22 }}
                      role="alert"
                      className="flex items-start gap-2.5 overflow-hidden rounded-xl px-4 py-3 text-xs font-medium"
                      style={{
                        background: 'rgba(127,0,0,0.2)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#fca5a5',
                      }}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" aria-hidden="true">
                        <path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                      </svg>
                      {form.error}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Enter Secure Portal button ── */}
                <motion.button
                  id="login-enter-portal-btn"
                  type="submit"
                  disabled={form.loading}
                  whileTap={{ scale: 0.975 }}
                  className="group relative mt-1 w-full overflow-hidden rounded-xl py-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  style={{
                    background:
                      'linear-gradient(135deg, #007a7a 0%, #008fa0 50%, #00b4cc 100%)',
                    boxShadow: [
                      '0 0 0 1px rgba(0,204,204,0.3)',
                      '0 4px 16px rgba(0,150,160,0.35)',
                      '0 12px 40px rgba(0,180,204,0.2)',
                      '0 24px 60px rgba(0,0,0,0.4)',
                      'inset 0 1px 0 rgba(255,255,255,0.15)',
                    ].join(', '),
                  }}
                >
                  {/* Glossy top-half sheen */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-xl"
                    style={{
                      background:
                        'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 100%)',
                    }}
                  />
                  {/* Hover shimmer sweep */}
                  <motion.span
                    aria-hidden="true"
                    animate={{ x: ['-120%', '120%'] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.5 }}
                    className="pointer-events-none absolute inset-0"
                    style={{
                      background:
                        'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.22) 50%, transparent 65%)',
                    }}
                  />

                  <span className="relative flex items-center justify-center gap-2.5">
                    <AnimatePresence mode="wait">
                      {form.loading ? (
                        <motion.span
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2.5"
                        >
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.85, repeat: Infinity, ease: 'linear' }}
                            className="block h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                          />
                          Verifying Access&hellip;
                        </motion.span>
                      ) : (
                        <motion.span
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-2.5"
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                          </svg>
                          Enter Secure Portal
                          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true">
                            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                          </svg>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </motion.button>
              </motion.form>

              {/* ── Fine print ── */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.52, duration: 0.5 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="flex items-center gap-5 text-xs">
                  <a
                    href="#"
                    onClick={(e) => e.preventDefault()}
                    className="font-medium transition-colors duration-150 hover:text-cyan-300"
                    style={{ color: '#0891b2' }}
                  >
                    Forgot Credentials?
                  </a>
                  <span style={{ color: '#00cccc22' }}>·</span>
                  <button
                    type="button"
                    onClick={() => setShowRegisterModal(true)}
                    className="font-medium transition-colors duration-150 hover:text-cyan-300"
                    style={{ color: '#0891b2' }}
                  >
                    Request Demo / Register a Clinic
                  </button>
                </div>

                {/* Encrypted badge */}
                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[11px]"
                  style={{
                    background: 'rgba(0,50,50,0.4)',
                    border: '1px solid rgba(0,204,204,0.1)',
                    color: '#2a6a6a',
                  }}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0" style={{ color: '#00cccc66' }} aria-hidden="true">
                    <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 0 1 .678 0 11.947 11.947 0 0 0 7.078 2.749.5.5 0 0 1 .479.425c.069.52.104 1.05.104 1.589 0 5.162-3.26 9.563-7.834 11.256a.48.48 0 0 1-.332 0C5.26 16.563 2 12.162 2 7c0-.539.035-1.07.104-1.589a.5.5 0 0 1 .48-.425 11.947 11.947 0 0 0 7.077-2.749Zm4.196 5.954a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  <span>E2E Encrypted &middot; TLS 1.3 &middot; All sessions are audited</span>
                </div>
              </motion.div>

            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
