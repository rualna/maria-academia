import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 51 — WEEKLY MISSIONS
// Meta de la semana completa — más grande que la diaria
// Se genera una vez por semana, el lunes (o día de inicio)
// ============================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)

  // Buscar misión de la semana actual
  const { data: existing } = await supabaseAdmin
    .from('student_events')
    .select('event_data')
    .eq('student_id', student_id)
    .eq('event_type', 'weekly_mission')
    .contains('event_data', { week: ctx.current_week })
    .limit(1)
    .single()

  if (existing?.event_data) {
    return Response.json({ success: true, mission: existing.event_data, cached: true })
  }

  const weekGoals: Record<number, string> = {
    1: 'Presentarte en inglés con fluidez y sostener 2 minutos de conversación',
    2: 'Describir objetos y personas usando This/That y nacionalidades',
    3: 'Hablar de tu rutina diaria en 5 oraciones y decir qué podés y no podés hacer',
    4: 'Hablar de planes futuros, dar una dirección simple y describir un lugar',
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Generás la misión semanal de AcademIA para semana ${ctx.current_week}.

Estudiante: ${ctx.student_name} | Nivel: ${ctx.current_level} | Score speaking: ${ctx.speaking_score_avg}/10

Meta de la semana ${ctx.current_week}: ${weekGoals[ctx.current_week] || 'Completar todos los objetivos de la semana'}

La misión semanal tiene:
- 1 meta principal de speaking (la más importante)
- 2-3 metas de gramática/vocabulario
- 1 meta de bonus (opcional, extra XP)
- XP total al completar: 200-300 puntos

Devolvé JSON:
{
  "title": "título de la semana",
  "week": ${ctx.current_week},
  "main_speaking_goal": "descripción de la meta de speaking",
  "goals": [
    { "id": "w1g1", "task": "descripción", "type": "speaking|grammar|vocabulary", "xp": 50, "required": true }
  ],
  "bonus_goal": { "task": "desafío extra opcional", "xp": 50 },
  "total_xp": número,
  "completion_reward": { "xp": 200, "chokis": 20, "badge": "nombre del badge de la semana" },
  "maria_message": "mensaje motivador de María para la semana (max 50 palabras)"
}
`,
      },
      { role: 'user', content: 'Generá la misión de esta semana.' },
    ],
  })

  const mission = JSON.parse(completion.choices[0].message.content || '{}')

  await supabaseAdmin.from('student_events').insert([{
    student_id,
    event_type: 'weekly_mission',
    level: ctx.current_level,
    module_name: 'Weekly Mission',
    lesson_id: null,
    skill: 'mission',
    score: null,
    event_data: mission,
  }])

  return Response.json({ success: true, mission, cached: false })
}
