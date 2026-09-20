'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { AlertTriangle, LogOut, Mail, Stethoscope } from 'lucide-react'

export default function SetupIncompletePage() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut()
    router.push('/signup')
  }, [supabase, router])

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4">
      {/* Ambient glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed left-1/2 top-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-500/5 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 right-0 h-[350px] w-[450px] rounded-full bg-rose-500/5 blur-[100px]"
      />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-8 rounded-3xl border border-white/[0.07] bg-slate-900/60 px-8 py-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/10">
            <Stethoscope className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
          </div>
          <span className="bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-sm font-semibold tracking-tight text-transparent">
            Opedox
          </span>
        </div>

        {/* Warning icon */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-amber-500/15 blur-2xl" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
            <AlertTriangle className="h-9 w-9 text-amber-400" strokeWidth={1.5} />
          </div>
        </div>

        {/* Copy */}
        <div className="space-y-3">
          <h1 className="bg-gradient-to-r from-slate-100 via-white to-slate-300 bg-clip-text text-2xl font-semibold tracking-tight text-transparent">
            Setup Incomplete
          </h1>
          <p className="text-sm leading-relaxed text-slate-400">
            Your account was created, but your clinic setup didn&apos;t finish.
            This can happen if the process was interrupted or if there was a
            server error during registration.
          </p>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

        {/* Actions */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={handleSignOut}
            className="group flex w-full items-center justify-center gap-2.5 rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-semibold text-slate-950 transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" strokeWidth={2} />
            Sign Out &amp; Sign Up Again
          </button>

          <a
            href="https://wa.me/923000000000?text=My%20Opedox%20signup%20didn%27t%20complete.%20Can%20you%20help%3F"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-slate-700/50 bg-slate-800/50 px-6 py-3 text-sm font-medium text-slate-400 transition-all duration-200 hover:border-slate-600/70 hover:bg-slate-700/60 hover:text-slate-200"
          >
            <Mail className="h-4 w-4" strokeWidth={1.75} />
            Contact Support
          </a>
        </div>

        {/* Subtle footer */}
        <p className="text-[11px] leading-relaxed text-slate-600">
          If this keeps happening, contact us with your email address and
          we&apos;ll set up your clinic manually.
        </p>
      </div>
    </div>
  )
}
