'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

// ─── Forgot Password ──────────────────────────────────────────────────────────

export interface ForgotPasswordResult {
  error?: string
  success?: boolean
}

export async function forgotPasswordAction(
  email: string
): Promise<ForgotPasswordResult> {
  if (!email?.trim()) {
    return { error: 'Please enter your email address.' }
  }

  const supabase = await createClient()

  // Derive the absolute origin so the redirectTo URL is valid for any
  // environment (local, staging, production).
  const headersList = await headers()
  const origin =
    headersList.get('x-forwarded-proto') &&
    headersList.get('x-forwarded-host')
      ? `${headersList.get('x-forwarded-proto')}://${headersList.get('x-forwarded-host')}`
      : `https://${headersList.get('host') ?? 'localhost:3000'}`

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${origin}/update-password`,
  })

  if (error) {
    console.error('[forgotPasswordAction] Supabase error:', error)
    return { error: error.message }
  }

  return { success: true }
}

// ─── Update Password ──────────────────────────────────────────────────────────

export interface UpdatePasswordResult {
  error?: string
}

export async function updatePasswordAction(
  password: string
): Promise<UpdatePasswordResult> {
  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    console.error('[updatePasswordAction] Supabase error:', error)
    return { error: error.message }
  }

  // Proxy (proxy.ts) handles role-based isolation from /dashboard/doctor onward.
  redirect('/dashboard/doctor')
}
