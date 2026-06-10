import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'
import { TOPICS_BY_WEEK } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 50 — DAILY MISSIONS
// 55 — DAILY ADAPTIVE OBJECTIVES
// Misión diaria personalizada según semana, debilidades y stamina
// ============================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)

  // Verificar si ya tiene misión del día
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabaseAdmin
    .from('student_events')
    .select('event_data')
    .eq('student_id', student_id)
    .eq('event_type', 'daily_mission')
    .gte('created_at', `${today}T00:00:00`)
    .limit(1)
    .single()

  if (existing?.event_data) {
    return Response.json({ success: true, mission: existing.event_data, cached: true })
  }

  // 55 — Generar objetivos adaptativos del día según contexto real
  const hasUrgentReview = ctx.urgent_review && ctx.urgent_review.length > 0
  const hasWeakTopics = ctx.weak_topics && ctx.weak_topics.length > 0
  const lowSpeakingScore = ctx.speaking_score_avg < 65

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Generás la misión diaria personalizada para un estudiante de AcademIA.

Contexto del estudiante:
- Nombre: ${ctx.student_name}
- Nivel: ${ctx.current_level} semana ${ctx.current_week}
- Score promedio speaking: ${ctx.speaking_score_avg}/10
- Racha: ${ctx.streak_days} días
- Temas débiles: ${ctx.weak_topics?.join(', ') || 'ninguno'}
- Revisión urgente: ${ctx.urgent_review?.join(', ') || 'ninguna'}
- Temas disponibles semana ${ctx.current_week}: ${(TOPICS_BY_WEEK[ctx.current_week] || []).slice(0, 3).join(', ')}

Reglas para la misión:
- Si tiene revisión urgente → priorizar repaso de ese tema
- Si tiene score de speaking < 65 → incluir práctica de speaking obligatoria
- Si tiene racha > 7 días → felicitarlo y darle un desafío extra opcional
- La misión debe ser completable en 20-30 minutos
- Máximo 3 objetivos por día
- En español, directo, sin rodeos

Devolvé JSON exacto:
{
  "title": "título de la misión del día (max 8 palabras)",
  "emoji": "un emoji que represente la misión",
  "duration_minutes": 20-30,
  "objectives": [
    { "id": "obj1", "task": "descripción del objetivo", "type": "speaking|grammar|review|vocabulary", "xp": 10-30 }
  ],
  "maria_tip": "consejo personalizado de María para hoy (max 40 palabras, en español)",
  "streak_message": "mensaje especial si racha > 7 días, null si no",
  "focus_topic": "el tema principal de hoy"
}
`,
      },
      { role: 'user', content: 'Generá la misión de hoy.' },
    ],
  })

  const mission = JSON.parse(completion.choices[0].message.content || '{}')
  mission.date = today
  mission.week = ctx.current_week
  mission.level = ctx.current_level

  // Guardar misión del día
  await supabaseAdmin.from('student_events').insert([{
    student_id,
    event_type: 'daily_mission',
    level: ctx.current_level,
    module_name: 'Daily Mission',
    lesson_id: null,
    skill: 'mission',
    score: null,
    event_data: mission,
  }])

  return Response.json({ success: true, mission, cached: false })
}

// POST — marcar objetivo de la misión como completado
export async function POST(request: Request) {
  const { student_id, objective_id, xp_earned } = await request.json()

  if (!student_id || !objective_id) {
    return Response.json({ success: false, error: 'student_id and objective_id required' }, { status: 400 })
  }

  // Dar XP al estudiante
  if (xp_earned > 0) {
    await supabaseAdmin.rpc('add_student_rewards', {
      p_student_id: student_id,
      p_xp: xp_earned,
      p_chokis: 0,
    }).catch(() => null)
  }

  return Response.json({ success: true, xp_earned })
}
