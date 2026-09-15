import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import StaffRoster from './_components/StaffRoster'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface StaffMember {
  id: string
  full_name: string | null
  role: string | null
  credentials: string | null
}

// ---------------------------------------------------------------------------
// Page — Server Component
// ---------------------------------------------------------------------------
export default async function StaffPage() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, clinic_id, id')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch all staff in this clinic (exclude the admin themselves)
  const { data: staff } = await supabase
    .from('profiles')
    .select('id, full_name, role, credentials')
    .eq('clinic_id', profile.clinic_id)
    .neq('id', user.id)
    .order('role', { ascending: true })

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">

      {/* ── Header ── */}
      <div>
        <h1 className="text-3xl font-bold text-white">Staff Roster</h1>
        <p className="text-slate-400 mt-1.5 text-sm">
          Manage your clinic&apos;s staff accounts. Use &ldquo;Update Password&rdquo; to reset credentials for any team member.
        </p>
      </div>

      <StaffRoster staff={(staff as StaffMember[]) ?? []} />
    </div>
  )
}
