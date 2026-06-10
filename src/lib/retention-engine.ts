import { supabaseAdmin } from './supabase-admin'

// ============================================================
// 71 — MOTIVATION SCORE
// 72 — FRUSTRATION DETECTION
// 73 — BURNOUT DETECTION
// 74 — DROPOUT PREDICTION
// 75 — RECOVERY FLOWS
// ============================================================

export type RetentionProfile = {
  motivation_score: number      // 0-100
  frustration_level: number     // 0-100
  burnout_risk: number          // 0-100
  dropout_risk: number          // 0-100
  status: 'healthy' | 'at_risk' | 'frustrated' | 'burning_out' | 'about_to_drop'
  recovery_action: string | null
  maria_tone: 'energetic' | 'supportive' | 'gentle' | 'urgent' | 'celebratory'
}

export async function analyzeRetention(studentId: string): Promise<RetentionProfile> {
  // Obtener datos de comportamiento
  const [eventsRes, speakingRes, sessionsRes] = await Promise.all([
    supabaseAdmin
      .from('student_events')
      .select('event_type, created_at, event_data')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(30),
    supabaseAdmin
      .from('student_speaking_attempts')
      .select('score, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabaseAdmin
      .from('student_exercise_attempts')
      .select('final_score, abandoned, stuck_flag, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const events = eventsRes.data || []
  const speaking = speakingRes.data || []
  const exercises = sessionsRes.data || []

  const now = new Date()

  // ── 71 — MOTIVATION SCORE ──
  const daysSinceLastActivity = events.length > 0
    ? Math.floor((now.getTime() - new Date(events[0].created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 999

  const recentSpeakingAvg = speaking.length > 0
    ? speaking.slice(0, 5).reduce((s, a) => s + (a.score || 0), 0) / Math.min(speaking.length, 5)
    : 0

  const activityFrequency = events.filter(e => {
    const daysAgo = (now.getTime() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return daysAgo <= 7
  }).length

  let motivation_score = 50
  if (recentSpeakingAvg >= 8)   motivation_score += 20
  if (recentSpeakingAvg >= 6)   motivation_score += 10
  if (activityFrequency >= 5)   motivation_score += 20
  if (activityFrequency >= 3)   motivation_score += 10
  if (daysSinceLastActivity <= 1) motivation_score += 10
  if (daysSinceLastActivity >= 3) motivation_score -= 20
  if (daysSinceLastActivity >= 7) motivation_score -= 30
  motivation_score = Math.max(0, Math.min(100, motivation_score))

  // ── 72 — FRUSTRATION DETECTION ──
  const abandonedCount = exercises.filter(e => e.abandoned).length
  const stuckCount = exercises.filter(e => e.stuck_flag).length
  const lowScoreCount = exercises.filter(e => (e.final_score || 0) < 50).length
  const recentLowSpeaking = speaking.slice(0, 3).filter(s => (s.score || 0) < 5).length

  let frustration_level = 0
  if (abandonedCount >= 2) frustration_level += 25
  if (stuckCount >= 2)     frustration_level += 20
  if (lowScoreCount >= 3)  frustration_level += 20
  if (recentLowSpeaking >= 2) frustration_level += 25
  if (daysSinceLastActivity >= 3 && motivation_score < 40) frustration_level += 10
  frustration_level = Math.min(100, frustration_level)

  // ── 73 — BURNOUT DETECTION ──
  // Burnout = alta actividad antes + caída repentina
  const last30Events = events.length
  const last7Events = events.filter(e => {
    const d = (now.getTime() - new Date(e.created_at).getTime()) / (1000 * 60 * 60 * 24)
    return d <= 7
  }).length

  const burnout_risk = last30Events > 15 && last7Events < 3
    ? Math.min(100, 40 + (frustration_level * 0.4))
    : frustration_level > 60 ? 30 : 0

  // ── 74 — DROPOUT PREDICTION ──
  let dropout_risk = 0
  if (daysSinceLastActivity >= 7)  dropout_risk += 30
  if (daysSinceLastActivity >= 14) dropout_risk += 30
  if (daysSinceLastActivity >= 21) dropout_risk += 20
  if (motivation_score < 30)       dropout_risk += 20
  if (burnout_risk > 50)           dropout_risk += 10
  dropout_risk = Math.min(100, dropout_risk)

  // ── 75 — RECOVERY FLOWS ──
  let status: RetentionProfile['status'] = 'healthy'
  let recovery_action: string | null = null
  let maria_tone: RetentionProfile['maria_tone'] = 'energetic'

  if (dropout_risk >= 60) {
    status = 'about_to_drop'
    recovery_action = 'send_urgent_reactivation' // → 80 anti-guilt
    maria_tone = 'gentle'
  } else if (burnout_risk >= 50) {
    status = 'burning_out'
    recovery_action = 'suggest_break_and_lighter_session'
    maria_tone = 'supportive'
  } else if (frustration_level >= 60) {
    status = 'frustrated'
    recovery_action = 'activate_easier_exercises_and_encouragement'
    maria_tone = 'supportive'
  } else if (motivation_score < 40) {
    status = 'at_risk'
    recovery_action = 'send_personalized_nudge' // → 79
    maria_tone = 'gentle'
  } else if (motivation_score >= 70) {
    maria_tone = 'celebratory'
  }

  // Guardar perfil en DB
  await supabaseAdmin.from('student_behavioral_profile').upsert({
    student_id: studentId,
    motivation_score,
    frustration_level,
    burnout_risk,
    dropout_risk,
    last_analyzed: now.toISOString(),
    updated_at: now.toISOString(),
  }, { onConflict: 'student_id' })

  return {
    motivation_score,
    frustration_level,
    burnout_risk,
    dropout_risk,
    status,
    recovery_action,
    maria_tone,
  }
}

// GET el perfil de retención (para que María lo use)
export async function getRetentionProfile(studentId: string) {
  const { data } = await supabaseAdmin
    .from('student_behavioral_profile')
    .select('*')
    .eq('student_id', studentId)
    .single()

  if (!data) return analyzeRetention(studentId)
  return data
}
