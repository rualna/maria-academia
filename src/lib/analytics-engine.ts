import { supabaseAdmin } from './supabase-admin'

// ============================================================
// 121 — ERROR CLUSTERING
// 122 — LEARNING ANALYTICS
// 123 — SPEAKING ANALYTICS
// 124 — RETENTION ANALYTICS
// 125 — COHORT TRACKING
// 126 — PROGRESS FORECASTING
// ============================================================
// ESTO ES LA VENTAJA DIFÍCIL DE COPIAR.
// Cada estudiante que pasa por AcademIA genera datos que hacen
// a María más inteligente para el siguiente estudiante.
// ============================================================

// ── 121 — ERROR CLUSTERING ──
// Agrupa errores de TODOS los estudiantes para encontrar patrones LATAM
export async function clusterErrors(): Promise<{
  top_errors_latam: Array<{ error_type: string; frequency: number; affected_students: number }>
  insights: string[]
}> {
  const { data: attempts } = await supabaseAdmin
    .from('student_exercise_attempts')
    .select('exercise_id, stuck_flag, final_score, student_id')
    .eq('stuck_flag', true)

  if (!attempts || attempts.length === 0) {
    return { top_errors_latam: [], insights: ['Sin suficientes datos aún'] }
  }

  // Agrupar por exercise_id para encontrar dónde se traban más
  const exerciseMap: Record<string, { count: number; students: Set<string> }> = {}
  for (const a of attempts) {
    if (!exerciseMap[a.exercise_id]) {
      exerciseMap[a.exercise_id] = { count: 0, students: new Set() }
    }
    exerciseMap[a.exercise_id].count++
    exerciseMap[a.exercise_id].students.add(a.student_id)
  }

  const topErrors = Object.entries(exerciseMap)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .map(([exercise_id, data]) => ({
      error_type: exercise_id,
      frequency: data.count,
      affected_students: data.students.size,
    }))

  const insights = []
  if (topErrors[0]?.affected_students > 5) {
    insights.push(`El ejercicio "${topErrors[0].error_type}" causa dificultad en ${topErrors[0].affected_students} estudiantes — considerar rediseñar`)
  }
  insights.push(`Total de puntos de bloqueo detectados: ${topErrors.length}`)
  insights.push('Datos de error clustering exclusivos de hispanohablantes aprendiendo inglés en LATAM')

  return { top_errors_latam: topErrors, insights }
}

// ── 122 — LEARNING ANALYTICS ──
export async function getLearningAnalytics(studentId?: string): Promise<any> {
  const query = supabaseAdmin
    .from('student_speaking_attempts')
    .select('score, created_at, student_id')
    .order('created_at', { ascending: true })

  if (studentId) query.eq('student_id', studentId)

  const { data: speaking } = await query.limit(100)
  if (!speaking || speaking.length === 0) return { message: 'Sin datos suficientes' }

  // Curva de aprendizaje — ¿mejora el score con el tiempo?
  const firstHalf = speaking.slice(0, Math.floor(speaking.length / 2))
  const secondHalf = speaking.slice(Math.floor(speaking.length / 2))
  const firstAvg = firstHalf.reduce((s, a) => s + (a.score || 0), 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((s, a) => s + (a.score || 0), 0) / secondHalf.length
  const improvement = Math.round((secondAvg - firstAvg) * 10) / 10

  return {
    total_attempts: speaking.length,
    overall_avg: Math.round(speaking.reduce((s, a) => s + (a.score || 0), 0) / speaking.length * 10) / 10,
    learning_curve: improvement > 0 ? 'ascending' : improvement < -0.5 ? 'declining' : 'stable',
    improvement_points: improvement,
    first_half_avg: Math.round(firstAvg * 10) / 10,
    second_half_avg: Math.round(secondAvg * 10) / 10,
    insight: improvement > 1
      ? 'Mejora significativa — el método está funcionando'
      : improvement > 0
      ? 'Mejora gradual — progreso constante'
      : 'Sin mejora detectada — revisar estrategia pedagógica',
  }
}

// ── 123 — SPEAKING ANALYTICS ──
export async function getSpeakingAnalytics(studentId: string): Promise<any> {
  const { data } = await supabaseAdmin
    .from('student_speaking_attempts')
    .select('score, transcript, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!data || data.length === 0) return { message: 'Sin intentos de speaking' }

  const scores = data.map(d => d.score || 0)
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
  const trend = scores.length >= 4
    ? scores.slice(0, 2).reduce((a, b) => a + b) / 2 > scores.slice(-2).reduce((a, b) => a + b) / 2
      ? 'improving' : 'declining'
    : 'insufficient_data'

  // Análisis de longitud de respuestas
  const avgWords = data
    .filter(d => d.transcript)
    .map(d => d.transcript.split(' ').length)
    .reduce((a, b) => a + b, 0) / data.length

  return {
    total_attempts: data.length,
    avg_score: avg,
    best_score: Math.max(...scores),
    worst_score: Math.min(...scores),
    score_trend: trend,
    avg_words_per_attempt: Math.round(avgWords),
    speaking_stamina: avgWords > 30 ? 'strong' : avgWords > 15 ? 'developing' : 'weak',
    scores_timeline: scores.reverse(), // cronológico
  }
}

// ── 124 — RETENTION ANALYTICS ──
export async function getRetentionAnalytics(): Promise<any> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: allStudents } = await supabaseAdmin
    .from('students')
    .select('id, created_at, streak_days')

  const { data: activeRecent } = await supabaseAdmin
    .from('student_events')
    .select('student_id')
    .gte('created_at', sevenDaysAgo)

  const activeIds = new Set(activeRecent?.map(e => e.student_id) || [])
  const total = allStudents?.length || 0
  const active7d = activeIds.size
  const retention7d = total > 0 ? Math.round((active7d / total) * 100) : 0

  return {
    total_students: total,
    active_last_7_days: active7d,
    retention_rate_7d: `${retention7d}%`,
    avg_streak: allStudents
      ? Math.round(allStudents.reduce((s, st) => s + (st.streak_days || 0), 0) / total)
      : 0,
    insight: retention7d >= 70
      ? 'Retención excelente — el producto engancha'
      : retention7d >= 50
      ? 'Retención aceptable — hay margen de mejora'
      : 'Retención baja — activar recovery flows urgente',
  }
}

// ── 125 — COHORT TRACKING ──
// Rastrea grupos de estudiantes que empezaron en el mismo período
export async function getCohortAnalysis(): Promise<any> {
  const { data: students } = await supabaseAdmin
    .from('students')
    .select('id, created_at, current_level, streak_days')
    .order('created_at', { ascending: true })

  if (!students || students.length === 0) return { cohorts: [] }

  // Agrupar por mes de registro
  const cohorts: Record<string, any[]> = {}
  for (const s of students) {
    const month = s.created_at.substring(0, 7) // YYYY-MM
    if (!cohorts[month]) cohorts[month] = []
    cohorts[month].push(s)
  }

  return {
    cohorts: Object.entries(cohorts).map(([month, members]) => ({
      month,
      size: members.length,
      avg_streak: Math.round(members.reduce((s, m) => s + (m.streak_days || 0), 0) / members.length),
      levels: members.reduce((acc, m) => {
        acc[m.current_level] = (acc[m.current_level] || 0) + 1
        return acc
      }, {} as Record<string, number>),
    })),
    total_cohorts: Object.keys(cohorts).length,
  }
}

// ── 126 — PROGRESS FORECASTING ──
// Predice cuándo el estudiante llegará al siguiente nivel
export async function forecastProgress(studentId: string): Promise<any> {
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('current_level, created_at, streak_days')
    .eq('id', studentId)
    .single()

  const { data: speaking } = await supabaseAdmin
    .from('student_speaking_attempts')
    .select('score, created_at')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (!student) return { error: 'Student not found' }

  const avgScore = speaking && speaking.length > 0
    ? speaking.reduce((s, a) => s + (a.score || 0), 0) / speaking.length
    : 0

  // Días promedio por nivel según score actual
  const daysPerLevel: Record<string, Record<string, number>> = {
    A1: { low: 60, medium: 45, high: 30 },
    A2: { low: 75, medium: 60, high: 45 },
    B1: { low: 90, medium: 75, high: 60 },
    B2: { low: 90, medium: 80, high: 70 },
    C1: { low: 120, medium: 100, high: 90 },
  }

  const scoreCategory = avgScore >= 8 ? 'high' : avgScore >= 6 ? 'medium' : 'low'
  const currentLevelData = daysPerLevel[student.current_level] || daysPerLevel['A1']
  const daysNeeded = currentLevelData[scoreCategory]

  const startDate = new Date(student.created_at)
  const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.max(0, daysNeeded - daysSinceStart)

  const projectedDate = new Date()
  projectedDate.setDate(projectedDate.getDate() + daysRemaining)

  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const currentIndex = levelOrder.indexOf(student.current_level)
  const nextLevel = levelOrder[currentIndex + 1] || 'C2 (graduado)'

  return {
    current_level: student.current_level,
    next_level: nextLevel,
    days_in_current_level: daysSinceStart,
    days_remaining_estimated: daysRemaining,
    projected_level_up_date: projectedDate.toISOString().split('T')[0],
    score_category: scoreCategory,
    avg_speaking_score: Math.round(avgScore * 10) / 10,
    streak_days: student.streak_days || 0,
    acceleration_tip: scoreCategory === 'low'
      ? 'Mejorar score de speaking al 7+ aceleraría el progreso en ~30%'
      : scoreCategory === 'medium'
      ? 'Mantener racha diaria es clave para llegar a la fecha proyectada'
      : '¡Vas adelantado! Seguí así.',
  }
}
