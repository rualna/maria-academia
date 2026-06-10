import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 53 — QUARTERLY EXAMS (evaluadora de nivel cada 3 meses)
// Estructura completa lista.
// Voz en tiempo real → Bloque 7 (OpenAI Realtime API)
// ============================================================

const LEVEL_PROMISES: Record<string, { promise: string; min_minutes: number; target_sentences: number }> = {
  A1: { promise: '¿Puede sobrevivir en inglés? Presentarse, pedir cosas básicas, entender instrucciones simples.', min_minutes: 6, target_sentences: 20 },
  A2: { promise: '¿Empieza a hablar sin traducir? Rutinas, gustos, trabajo, familia sin depender del español.', min_minutes: 12, target_sentences: 40 },
  B1: { promise: '¿Sostiene conversaciones reales? Problemas, opiniones, experiencias. Improvisa sin preparación.', min_minutes: 18, target_sentences: 60 },
  B2: { promise: '¿Habla fluido y natural? Puede trabajar en inglés, explicar conceptos complejos, debatir.', min_minutes: 24, target_sentences: 80 },
  C1: { promise: '¿Piensa en inglés? Conversación técnica/profesional. Puede liderar reuniones, presentar, negociar.', min_minutes: 30, target_sentences: 100 },
}

// GET — estado del examen trimestral del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)
  const levelData = LEVEL_PROMISES[ctx.current_level] || LEVEL_PROMISES['A1']

  const { data: lastExam } = await supabaseAdmin
    .from('student_events')
    .select('event_data, created_at')
    .eq('student_id', student_id)
    .eq('event_type', 'quarterly_exam')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return Response.json({
    success: true,
    level: ctx.current_level,
    level_promise: levelData.promise,
    requirements: {
      min_speaking_minutes: levelData.min_minutes,
      target_sentences: levelData.target_sentences,
      passing_criteria: 'Habla fluido, usa vocabulario del nivel, sin bloqueos totales',
    },
    last_exam: lastExam?.event_data || null,
    last_exam_date: lastExam?.created_at || null,
    voice_mode_status: 'coming_soon', // → Bloque 7: OpenAI Realtime API
    current_mode: 'text_evaluation',  // modo actual: evaluación por texto
  })
}

// POST — evalúa el examen trimestral (modo texto por ahora)
export async function POST(request: Request) {
  const { student_id, conversation_transcript, speaking_minutes } = await request.json()

  if (!student_id || !conversation_transcript) {
    return Response.json({ success: false, error: 'student_id and transcript required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)
  const levelData = LEVEL_PROMISES[ctx.current_level] || LEVEL_PROMISES['A1']

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Sos María evaluando el examen trimestral de nivel ${ctx.current_level} de AcademIA.

PROMESA DEL NIVEL: ${levelData.promise}
MINUTOS MÍNIMOS REQUERIDOS: ${levelData.min_minutes} minutos
ESTUDIANTE: ${ctx.student_name}

Evaluá si el estudiante cumple la promesa formativa del nivel.

Criterios:
- Fluidez: ¿habla sin bloqueos totales?
- Vocabulario: ¿usa el rango del nivel naturalmente?
- Gramática: ¿las estructuras del nivel son correctas?
- Comunicación: ¿puede sostener una conversación real?

Devolvé JSON:
{
  "passed": true/false,
  "fluency_score": 0-100,
  "vocabulary_score": 0-100,
  "grammar_score": 0-100,
  "communication_score": 0-100,
  "global_score": 0-100,
  "verdict": "PASS | NEEDS_MORE_WORK",
  "strengths": ["punto fuerte 1", "punto fuerte 2"],
  "improvements": ["cosa específica a mejorar 1", "cosa 2", "cosa 3"],
  "maria_message": "mensaje honesto y cálido de María al estudiante (en español, 60-80 palabras)",
  "next_steps": "qué hace ahora si pasó / qué hace si no pasó"
}
`,
      },
      {
        role: 'user',
        content: `Transcript de la conversación:\n${conversation_transcript}\n\nDuración: ${speaking_minutes || 0} minutos`,
      },
    ],
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')

  // Guardar resultado
  await supabaseAdmin.from('student_events').insert([{
    student_id,
    event_type: 'quarterly_exam',
    level: ctx.current_level,
    module_name: 'Quarterly Exam',
    lesson_id: null,
    skill: 'speaking',
    score: result.global_score,
    event_data: { ...result, speaking_minutes, level: ctx.current_level },
  }])

  // Si pasó → dar recompensas
  if (result.passed) {
    await supabaseAdmin.rpc('add_student_rewards', {
      p_student_id: student_id,
      p_xp: 500,
      p_chokis: 100,
    }).then(undefined, () => null)
  }

  return Response.json({ success: true, result })
}
