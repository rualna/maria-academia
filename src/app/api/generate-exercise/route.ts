import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 56 — DYNAMIC EXERCISE GENERATION
// 57 — TOPIC BALANCING
// Genera ejercicios personalizados según debilidades detectadas
// y balancea los temas para no sobre-practicar uno solo
// ============================================================

export async function POST(request: Request) {
  const { student_id, exercise_type, topic_override } = await request.json()
  // exercise_type: 'fill_blank' | 'multiple_choice' | 'speaking_prompt' | 'translation'

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)

  // 57 — TOPIC BALANCING: calcular qué temas se han practicado más
  const { data: recentExercises } = await supabaseAdmin
    .from('student_exercise_attempts')
    .select('exercise_id, lesson_id, final_score')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Contar prácticas por lección
  const practiceCount: Record<string, number> = {}
  for (const ex of (recentExercises || [])) {
    practiceCount[ex.lesson_id] = (practiceCount[ex.lesson_id] || 0) + 1
  }

  // Identificar temas con pocas prácticas (balance)
  const availableTopics = Object.keys(practiceCount)
  const underPracticedTopics = availableTopics
    .filter(t => practiceCount[t] < 3)
    .slice(0, 3)

  // Determinar el foco del ejercicio
  const focusTopic = topic_override ||
    (ctx.urgent_review?.length > 0 ? ctx.urgent_review[0] : null) ||
    (ctx.weak_topics?.length > 0 ? ctx.weak_topics[0] : null) ||
    (underPracticedTopics.length > 0 ? underPracticedTopics[0] : null) ||
    `week_${ctx.current_week}_general`

  const type = exercise_type || pickExerciseType(ctx.speaking_score_avg)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Generás ejercicios de inglés para AcademIA.
Estudiante: nivel ${ctx.current_level}, semana ${ctx.current_week}
Tema foco: ${focusTopic}
Tipo de ejercicio: ${type}
Score de speaking actual: ${ctx.speaking_score_avg}/10

REGLAS:
- Solo usá gramática y vocabulario de la semana ${ctx.current_week} y anteriores
- Contexto latinoamericano (nombres, lugares, comida de LATAM)
- Si tipo es speaking_prompt → dá una situación realista para practicar
- Si tipo es fill_blank → exactamente 1 espacio en blanco por oración
- Si tipo es multiple_choice → 4 opciones, solo 1 correcta
- Nivel de dificultad: adaptado al score actual (score bajo → más fácil)

Devolvé JSON:
{
  "exercise_id": "ex_${Date.now()}",
  "type": "${type}",
  "topic": "${focusTopic}",
  "level": "${ctx.current_level}",
  "week": ${ctx.current_week},
  "instructions": "instrucción en español",
  "content": "el ejercicio en inglés",
  "expected_answer": "la respuesta correcta",
  "hint": "pista opcional en español",
  "xp_reward": 15,
  "maria_intro": "María presenta el ejercicio en español (max 20 palabras)"
}
`,
      },
      { role: 'user', content: `Generá un ejercicio de tipo ${type} sobre ${focusTopic}.` },
    ],
  })

  const exercise = JSON.parse(completion.choices[0].message.content || '{}')
  exercise.topic_balance_info = {
    focus_reason: ctx.urgent_review?.length > 0 ? 'urgent_review' :
                  ctx.weak_topics?.length > 0 ? 'weak_topic' :
                  underPracticedTopics.length > 0 ? 'balance' : 'general',
    under_practiced: underPracticedTopics,
  }

  return Response.json({ success: true, exercise })
}

// 57 — elegir tipo de ejercicio según el score del estudiante
function pickExerciseType(speakingScore: number): string {
  if (speakingScore < 50) return 'fill_blank'      // primero gramática básica
  if (speakingScore < 65) return 'multiple_choice'  // comprensión
  if (speakingScore < 80) return 'translation'      // producción escrita
  return 'speaking_prompt'                           // producción oral
}
