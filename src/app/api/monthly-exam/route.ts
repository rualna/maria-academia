import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// POST /api/monthly-exam — Inicia o evalúa el examen mensual
// ============================================================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_id, section, payload } = body
    // section: 'speaking' | 'grammar' | 'writing' | 'final_score'

    if (!student_id || !section) {
      return Response.json({ success: false, error: 'student_id and section required' }, { status: 400 })
    }

    const ctx = await buildMariaContext(student_id)

    if (section === 'speaking') {
      return await evaluateSpeaking(student_id, payload.transcript, ctx)
    }

    if (section === 'grammar') {
      return await evaluateGrammar(student_id, payload.answers, ctx)
    }

    if (section === 'writing') {
      return await evaluateWriting(student_id, payload.sentences, ctx)
    }

    if (section === 'final_score') {
      return await computeFinalScore(student_id, payload, ctx)
    }

    return Response.json({ success: false, error: 'Invalid section' }, { status: 400 })

  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

// ============================================================
// GET /api/monthly-exam — Estado del examen del estudiante
// ============================================================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')
  const month = parseInt(searchParams.get('month') || '1')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from('student_monthly_exams')
    .select('*')
    .eq('student_id', student_id)
    .eq('month', month)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single()

  const attemptCount = data?.attempt_number || 0
  const mode = attemptCount === 0 ? 'normal' : attemptCount === 1 ? 'review_mode' : 'rescue_plan'

  return Response.json({
    success: true,
    exam: data,
    attempt_number: attemptCount + 1,
    mode,
    can_retry: attemptCount < 3,
    needs_human: attemptCount >= 3,
  })
}

// ============================================================
// SECCIÓN 1: SPEAKING (35%) — conversación libre 3-4 min
// ============================================================
async function evaluateSpeaking(studentId: string, transcript: string, ctx: any) {
  if (!transcript || transcript.trim().split(' ').length < 10) {
    return Response.json({ success: false, error: 'Transcript too short' }, { status: 400 })
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Eres María evaluando la sección de speaking del examen mensual de AcademIA.
El estudiante está en nivel ${ctx.current_level}, mes ${ctx.current_month}, semana ${ctx.current_week}.

Evalúa el transcript con estos criterios para A1:
- Precisión gramatical (35%): ¿Usó correctamente Verb BE, Simple Present, Can, Going to, Demonstratives?
- Fluidez (35%): ¿Logró expresar ideas completas? ¿Hay coherencia en el discurso?
- Vocabulario (30%): ¿Usó vocabulario del mes 1? (saludos, objetos, rutinas, trabajo, comida, lugares, cuerpo, planes)

Reglas:
- NO penalices temas que NO ha estudiado aún
- SÍ penaliza errores en temas que YA estudió
- Sé honesta pero alentadora
- El mínimo para pasar speaking es 65/100

Devuelve JSON exacto:
{
  "score": 0-100,
  "precision_score": 0-100,
  "fluency_score": 0-100,
  "vocabulary_score": 0-100,
  "passed": true/false,
  "strengths": "qué hizo bien (en español)",
  "weaknesses": "qué necesita mejorar (en español)",
  "maria_feedback": "feedback completo de María al estudiante, cálido y directo (en español, max 80 palabras)",
  "corrected_sample": "una frase corregida del transcript si había error, en inglés"
}
`,
      },
      { role: 'user', content: `Transcript del estudiante: "${transcript}"` },
    ],
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')

  return Response.json({
    success: true,
    section: 'speaking',
    score: result.score,
    passed: result.score >= 65,
    details: result,
  })
}

// ============================================================
// SECCIÓN 2: GRAMÁTICA (25%) — respuestas del quiz
// ============================================================
async function evaluateGrammar(studentId: string, answers: any[], ctx: any) {
  // answers: [{ question_id, answer, correct_answer }]
  if (!answers || answers.length === 0) {
    return Response.json({ success: false, error: 'No answers provided' }, { status: 400 })
  }

  const correct = answers.filter(a => a.answer?.toLowerCase().trim() === a.correct_answer?.toLowerCase().trim())
  const score = Math.round((correct.length / answers.length) * 100)
  const wrong = answers.filter(a => a.answer?.toLowerCase().trim() !== a.correct_answer?.toLowerCase().trim())

  return Response.json({
    success: true,
    section: 'grammar',
    score,
    passed: score >= 70,
    total: answers.length,
    correct: correct.length,
    wrong_items: wrong.map(w => ({ question_id: w.question_id, given: w.answer, expected: w.correct_answer })),
  })
}

// ============================================================
// SECCIÓN 3: WRITING (15%) — 5 oraciones libres
// ============================================================
async function evaluateWriting(studentId: string, sentences: string[], ctx: any) {
  if (!sentences || sentences.length === 0) {
    return Response.json({ success: false, error: 'No sentences provided' }, { status: 400 })
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Evalúa 5 oraciones escritas por un estudiante de inglés nivel A1 mes 1.
Los temas del mes son: presentación personal, objetos, nacionalidades, rutina diaria, comida, trabajo, planes futuros, salud, lugares, direcciones.

Criterios (NO es perfección ortográfica):
- ¿La oración es comprensible? (50%)
- ¿Usa estructura básica correcta para A1? (50%)
- Acepta errores menores de ortografía si el mensaje es claro
- Requiere al menos 4 de 5 oraciones válidas para pasar

Devuelve JSON:
{
  "score": 0-100,
  "passed": true/false,
  "valid_sentences": número,
  "sentence_results": [
    { "sentence": "...", "valid": true/false, "comment": "breve comentario en español" }
  ],
  "general_feedback": "feedback general en español max 50 palabras"
}
`,
      },
      { role: 'user', content: `Oraciones del estudiante:\n${sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}` },
    ],
  })

  const result = JSON.parse(completion.choices[0].message.content || '{}')

  return Response.json({
    success: true,
    section: 'writing',
    score: result.score,
    passed: result.score >= 60,
    details: result,
  })
}

// ============================================================
// SCORE FINAL — calcula resultado global y guarda en DB
// ============================================================
async function computeFinalScore(studentId: string, scores: any, ctx: any) {
  // scores: { speaking, grammar, listening, writing }
  const { speaking = 0, grammar = 0, listening = 0, writing = 0 } = scores

  const globalScore = Math.round(
    speaking * 0.35 +
    grammar * 0.25 +
    listening * 0.25 +
    writing * 0.15
  )

  const speakingPassed = speaking >= 65
  const globalPassed = globalScore >= 70
  const passed = speakingPassed && globalPassed

  // Buscar intento anterior
  const { data: lastExam } = await supabaseAdmin
    .from('student_monthly_exams')
    .select('attempt_number')
    .eq('student_id', studentId)
    .eq('month', ctx.current_month)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .single()

  const attemptNumber = (lastExam?.attempt_number || 0) + 1
  const mode = attemptNumber === 1 ? 'normal' : attemptNumber === 2 ? 'review_mode' : 'rescue_plan'

  // Guardar examen
  await supabaseAdmin.from('student_monthly_exams').insert([{
    student_id: studentId,
    month: ctx.current_month,
    attempt_number: attemptNumber,
    speaking_score: speaking,
    grammar_score: grammar,
    listening_score: listening,
    writing_score: writing,
    global_score: globalScore,
    passed,
    mode,
  }])

  // Si aprobó → dar recompensas
  if (passed) {
    await supabaseAdmin.rpc('add_student_rewards', {
      p_student_id: studentId,
      p_xp: attemptNumber === 1 && globalScore >= 90 ? 300 : 200,
      p_chokis: 50,
    }).then(undefined, () => null) // si no existe la función no rompe
  }

  // Generar mensaje de María
  let mariaMessage = ''

  if (passed && globalScore >= 90) {
    mariaMessage = `¡Increíble, ${ctx.student_name}! ${globalScore}/100 en el examen del mes 1. Eso es dominio real. Desbloqueaste el mes 2 y ganaste un badge especial. ¡Seguimos!`
  } else if (passed) {
    mariaMessage = `¡Lo lograste, ${ctx.student_name}! ${globalScore}/100. Aprobaste el mes 1. El mes 2 ya está desbloqueado. Hay cosas por mejorar, pero el progreso es real.`
  } else if (!speakingPassed) {
    mariaMessage = `Tu score global fue ${globalScore}, pero el speaking fue ${speaking}/100 y el mínimo es 65. El speaking es el core — sin eso no podemos avanzar. Vamos a reforzar 3 días y lo intentamos de nuevo. Podés.`
  } else {
    mariaMessage = `Score global: ${globalScore}/100. Necesitás 70 para pasar. Estás cerca. Voy a armar un plan de refuerzo de 3 días enfocado en lo que más te costó. No es un fracaso — es un diagnóstico.`
  }

  return Response.json({
    success: true,
    section: 'final',
    global_score: globalScore,
    speaking_score: speaking,
    grammar_score: grammar,
    listening_score: listening,
    writing_score: writing,
    passed,
    speaking_passed: speakingPassed,
    attempt_number: attemptNumber,
    mode: passed ? 'passed' : mode,
    next_action: passed
      ? 'unlock_month_2'
      : attemptNumber >= 3
      ? 'human_teacher_flag'
      : attemptNumber === 2
      ? 'rescue_plan'
      : 'review_mode_3_days',
    maria_message: mariaMessage,
    rewards: passed ? { xp: globalScore >= 90 ? 300 : 200, chokis: 50 } : null,
  })
}
