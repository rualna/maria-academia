import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 54 — FINAL GRADUATION EXAM (evaluadora final 15 meses)
// "La tapa del perol" — conversación de café entre iguales
// Estructura completa lista.
// Voz + avatar → Bloque 7 (ElevenLabs + HeyGen)
// ============================================================

// GET — estado del examen de graduación
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)

  const { data: exam } = await supabaseAdmin
    .from('student_events')
    .select('event_data, created_at')
    .eq('student_id', student_id)
    .eq('event_type', 'graduation_exam')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return Response.json({
    success: true,
    student: {
      name: ctx.student_name,
      level: ctx.current_level,
      streak: ctx.streak_days,
      xp: ctx.xp,
    },
    exam_design: {
      duration_minutes: 45,
      format: 'Conversación libre — como tomarse un café con alguien que te conoce hace 15 meses',
      language: '100% inglés — sin español',
      topics: [
        '¿Qué cambió en vos en estos 15 meses?',
        '¿Qué logros te enorgullecen más?',
        '¿Qué le dirías a alguien que recién empieza?',
        'Defiende una postura sobre un tema que te importa',
        'Feedback a María — ¿qué pudo hacer mejor?',
      ],
      passing_criteria: {
        min_speaking_minutes: 30,
        fluency: 'Menos de 1 pausa >4 seg por minuto',
        vocabulary: 'Rango C1 — parafrasea cuando no recuerda una palabra',
        argumentation: 'Puede defender posturas, dar ejemplos, contraargumentar',
        pronunciation: 'Comprensible para cualquier angloparlante',
      },
    },
    graduation_rewards: {
      certificate: 'Certificado digital CEFR C1 con datos reales',
      xp_bonus: 1000,
      chokis_bonus: 500,
      badge: 'AcademIA Graduate C1',
    },
    voice_avatar_status: 'coming_soon', // → ElevenLabs + HeyGen (Bloque 7)
    last_exam: exam?.event_data || null,
  })
}

// POST — evalúa el examen de graduación
export async function POST(request: Request) {
  const { student_id, conversation_transcript, speaking_minutes, student_feedback_to_maria } = await request.json()

  if (!student_id || !conversation_transcript) {
    return Response.json({ success: false, error: 'student_id and transcript required' }, { status: 400 })
  }

  const ctx = await buildMariaContext(student_id)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Sos María evaluando el examen de graduación de 15 meses de AcademIA.
Este es el momento más importante del programa.
Evaluá con honestidad total — no suavices ni exageres.

Estudiante: ${ctx.student_name}
Duración de conversación: ${speaking_minutes} minutos (mínimo requerido: 30)
XP acumulado: ${ctx.xp}
Racha máxima: ${ctx.streak_days} días

CRITERIOS C1:
- Fluidez: <1 pausa >4 seg por minuto
- Vocabulario: rango C1 con parafraseo
- Gramática: estructuras complejas correctas
- Argumentación: puede debatir y defender
- Pronunciación: comprensible para cualquier angloparlante
- Minutos mínimos: 30

Devolvé JSON:
{
  "graduated": true/false,
  "achieved_level": "C1|B2|B1",
  "fluency_score": 0-100,
  "vocabulary_score": 0-100,
  "grammar_score": 0-100,
  "argumentation_score": 0-100,
  "pronunciation_score": 0-100,
  "global_score": 0-100,
  "speaking_minutes_achieved": número,
  "verdict": "GRADUATED_C1 | SOLID_B2 | NEEDS_MORE_TIME",
  "genuine_maria_reflection": "reflexión genuina de María sobre el recorrido del estudiante (70-100 palabras, en inglés si graduó, en español si no)",
  "certificate_data": {
    "student_name": "${ctx.student_name}",
    "level": "nivel logrado",
    "total_hours_estimate": número,
    "graduation_date": "${new Date().toISOString().split('T')[0]}"
  },
  "what_to_do_if_not_graduated": "plan específico de 3 meses más si no llegó a C1"
}
`,
      },
      {
        role: 'user',
        content: `Transcript: ${conversation_transcript}\n\nFeedback del estudiante a María: ${student_feedback_to_maria || 'No proporcionó feedback'}`,
      },
    ],
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')

  await supabaseAdmin.from('student_events').insert([{
    student_id,
    event_type: 'graduation_exam',
    level: result.achieved_level || ctx.current_level,
    module_name: 'Graduation Exam',
    lesson_id: null,
    skill: 'speaking',
    score: result.global_score,
    event_data: { ...result, student_feedback_to_maria },
  }])

  if (result.graduated) {
    await supabaseAdmin.rpc('add_student_rewards', {
      p_student_id: student_id,
      p_xp: 1000,
      p_chokis: 500,
    }).catch(() => null)

    // Actualizar nivel final
    await supabaseAdmin
      .from('students')
      .update({ current_level: result.achieved_level || 'C1' })
      .eq('id', student_id)
  }

  return Response.json({ success: true, result })
}
