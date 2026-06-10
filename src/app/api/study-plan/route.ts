import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'
import { buildRevisionList } from '@/lib/spaced-repetition'
import { getSkillTreeStatus } from '@/lib/skill-tree'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 63 — STUDY RECOMMENDATIONS
// 64 — PROGRESS REPORTS
// 65 — AI STUDY PLANNER
// Un solo endpoint que lo entrega todo
// ============================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')
  const type = searchParams.get('type') || 'full'
  // type: 'recommendations' | 'report' | 'planner' | 'full'

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)

  // Datos para el reporte
  const [speakingData, lessonData, revisionList] = await Promise.all([
    supabaseAdmin
      .from('student_speaking_attempts')
      .select('score, created_at, transcript')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabaseAdmin
      .from('student_lesson_progress')
      .select('*')
      .eq('student_id', student_id),
    buildRevisionList(student_id, supabaseAdmin),
  ])

  const attempts = speakingData.data || []
  const lessons = lessonData.data || []
  const completedLessons = lessons.filter((l: any) => l.completed)
  const skillTree = getSkillTreeStatus(completedLessons.map((l: any) => l.lesson_id))

  // ── 64 — PROGRESS REPORT ──
  const weeklyScores = attempts.slice(0, 7).map((a: any) => a.score || 0)
  const weeklyAvg = weeklyScores.length > 0
    ? Math.round(weeklyScores.reduce((a: number, b: number) => a + b, 0) / weeklyScores.length)
    : 0

  const report = {
    period: 'last_7_days',
    speaking_sessions: weeklyScores.length,
    speaking_avg: weeklyAvg,
    speaking_best: weeklyScores.length > 0 ? Math.max(...weeklyScores) : 0,
    lessons_completed: completedLessons.length,
    lessons_total: skillTree.length,
    completion_pct: Math.round(completedLessons.length / skillTree.length * 100),
    streak_days: ctx.streak_days,
    weak_topics: ctx.weak_topics,
    revision_pending: revisionList.length,
    urgent_review: revisionList.filter(r => r.priority === 'urgent').length,
    xp_total: ctx.xp,
    chokis_total: ctx.chokis,
  }

  if (type === 'report') {
    return Response.json({ success: true, report })
  }

  // ── 63 + 65 — RECOMMENDATIONS + AI STUDY PLANNER ──
  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Sos el planificador de estudios de AcademIA. Analizás el progreso del estudiante y generás:
1. Recomendaciones específicas de qué hacer HOY
2. Plan de estudio para los próximos 7 días

Datos del estudiante:
- Nombre: ${ctx.student_name}
- Nivel: ${ctx.current_level} Semana ${ctx.current_week}
- Score speaking promedio (últimos 7 días): ${weeklyAvg}/10
- Lecciones completadas: ${completedLessons.length}/${skillTree.length}
- Temas débiles: ${ctx.weak_topics?.join(', ') || 'ninguno'}
- Lecciones con revisión urgente: ${revisionList.filter(r => r.priority === 'urgent').length}
- Racha: ${ctx.streak_days} días
- XP total: ${ctx.xp}

Generá JSON con:
{
  "recommendations": [
    {
      "priority": "high|medium|low",
      "action": "qué hacer exactamente",
      "reason": "por qué (datos reales)",
      "time_minutes": número,
      "type": "speaking|grammar|review|vocabulary"
    }
  ],
  "weekly_plan": [
    {
      "day": "Día 1",
      "focus": "tema principal",
      "tasks": ["tarea 1", "tarea 2"],
      "duration_minutes": número,
      "speaking_goal": "meta de speaking del día"
    }
  ],
  "maria_assessment": "evaluación honesta del progreso en 2-3 oraciones (en español)",
  "next_milestone": "qué desbloquea cuando complete lo pendiente",
  "projected_level_up": "cuándo aproximadamente pasaría al siguiente nivel si mantiene el ritmo actual"
}
`,
      },
      { role: 'user', content: 'Generá el plan de estudio personalizado.' },
    ],
  })

  const plan = JSON.parse(completion.choices[0].message.content || '{}')

  return Response.json({
    success: true,
    report,           // 64 — Progress report
    recommendations: plan.recommendations,  // 63 — Study recommendations
    weekly_plan: plan.weekly_plan,          // 65 — AI study planner
    maria_assessment: plan.maria_assessment,
    next_milestone: plan.next_milestone,
    projected_level_up: plan.projected_level_up,
  })
}
