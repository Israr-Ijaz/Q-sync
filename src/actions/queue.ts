'use server'

import { createClient } from '@/utils/supabase/server'

export async function updateTokenStatusAction(
  tokenId: string,
  status: 'in_consultation' | 'completed'
) {
  const supabase = await createClient()
  const now = new Date().toISOString()
  
  const updates: Record<string, any> = { status }
  
  if (status === 'in_consultation') {
    updates.started_at = now
  } else if (status === 'completed') {
    updates.completed_at = now
  }

  const { error } = await supabase
    .from('tokens')
    .update(updates)
    .eq('id', tokenId)

  if (error) {
    console.error('[updateTokenStatusAction] Error:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function getDoctorAverageConsultationTime(doctorId: string) {
  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const { data, error } = await supabase
    .from('tokens')
    .select('started_at, completed_at')
    .eq('doctor_id', doctorId)
    .eq('status', 'completed')
    .not('started_at', 'is', null)
    .not('completed_at', 'is', null)
    .gte('completed_at', todayStart.toISOString())
    .lt('completed_at', todayEnd.toISOString())
    .order('completed_at', { ascending: false })
    .limit(3)

  if (error || !data || data.length < 3) {
    return { averageMinutes: 10 }
  }

  let totalMinutes = 0
  for (const token of data) {
    const start = new Date(token.started_at)
    const end = new Date(token.completed_at)
    const durationMs = end.getTime() - start.getTime()
    totalMinutes += durationMs / (1000 * 60)
  }

  const averageMinutes = Math.round(totalMinutes / data.length)
  
  // Ensure we don't return 0 or negative
  return { averageMinutes: Math.max(1, averageMinutes) }
}
