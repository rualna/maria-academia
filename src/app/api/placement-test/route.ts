import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 37 — LEVEL PLACEMENT LOGIC
// Test de ubicación inicial para nuevos estudiantes
// ============================================================

// 15 preguntas que cubren A1 → B2
export const PLACEMENT_QUESTIONS = [
  // A1 — básico
  { id: 'p1',  level: 'A1', question: 'Complete: "My name ___ María."',           options: ['is','are','am','be'],                     correct: 'is' },
  { id: 'p2',  level: 'A1', question: 'What is the plural of "box"?',             options: ['boxs','boxes','boxies','box'],              correct: 'boxes' },
  { id: 'p3',  level: 'A1', question: 'Choose the correct greeting for 9pm:',     options: ['Good morning','Good afternoon','Good evening','Good night'], correct: 'Good evening' },
  { id: 'p4',  level: 'A1', question: '"She ___ a teacher." Choose the verb:',    options: ['am','is','are','be'],                     correct: 'is' },
  { id: 'p5',  level: 'A1', question: 'I ___ swim but I ___ fly.',                options: ['can/can\'t','can\'t/can','am/am not','do/don\'t'], correct: 'can/can\'t' },
  // A2 — elemental
  { id: 'p6',  level: 'A2', question: '"Yesterday I ___ to the store."',           options: ['go','went','gone','going'],               correct: 'went' },
  { id: 'p7',  level: 'A2', question: 'Which is correct?',                         options: ['She is more tall than me','She is taller than me','She is most tall','She taller than me'], correct: 'She is taller than me' },
  { id: 'p8',  level: 'A2', question: '"How often do you exercise?" — ___',        options: ['Yes I do','I exercise usually','I usually exercise 3 times a week','I am exercise'], correct: 'I usually exercise 3 times a week' },
  { id: 'p9',  level: 'A2', question: 'Choose the correct question:',              options: ['Where you are from?','Where are you from?','Where from are you?','From where are you?'], correct: 'Where are you from?' },
  { id: 'p10', level: 'A2', question: '"I ___ going to visit my family tomorrow."',options: ['am','is','are','be'],                     correct: 'am' },
  // B1 — intermedio
  { id: 'p11', level: 'B1', question: '"I have ___ lived here for 5 years."',      options: ['never','already','yet','ever'],           correct: 'already' },
  { id: 'p12', level: 'B1', question: 'If I ___ more money, I would travel.',      options: ['have','had','has','having'],              correct: 'had' },
  { id: 'p13', level: 'B1', question: 'She asked me ___ I was okay.',              options: ['that','if','what','which'],               correct: 'if' },
  // B2 — avanzado
  { id: 'p14', level: 'B2', question: '"By the time he arrived, we ___ already eaten."', options: ['have','had','has','having'],         correct: 'had' },
  { id: 'p15', level: 'B2', question: 'Choose the most natural phrasing:',         options: ['Despite of the rain, we went out','Despite the rain, we went out','Although of the rain, we went out','In spite the rain, we went out'], correct: 'Despite the rain, we went out' },
]

// GET — devuelve las preguntas sin las respuestas correctas
export async function GET() {
  const questions = PLACEMENT_QUESTIONS.map(({ correct: _correct, ...q }) => q)
  return Response.json({ success: true, questions })
}

// POST — evalúa respuestas y asigna nivel
export async function POST(request: Request) {
  try {
    const { student_id, answers } = await request.json()
    // answers: [{ id: 'p1', answer: 'is' }, ...]

    if (!student_id || !answers) {
      return Response.json({ success: false, error: 'student_id and answers required' }, { status: 400 })
    }

    // Calcular score por nivel
    const scores: Record<string, { correct: number; total: number }> = {
      A1: { correct: 0, total: 0 },
      A2: { correct: 0, total: 0 },
      B1: { correct: 0, total: 0 },
      B2: { correct: 0, total: 0 },
    }

    for (const q of PLACEMENT_QUESTIONS) {
      const given = answers.find((a: any) => a.id === q.id)?.answer
      scores[q.level].total++
      if (given?.toLowerCase().trim() === q.correct.toLowerCase().trim()) {
        scores[q.level].correct++
      }
    }

    // Determinar nivel recomendado
    const a1Pct = scores.A1.correct / scores.A1.total
    const a2Pct = scores.A2.correct / scores.A2.total
    const b1Pct = scores.B1.correct / scores.B1.total
    const b2Pct = scores.B2.correct / scores.B2.total

    let recommendedLevel = 'A1'
    if (a1Pct >= 0.8 && a2Pct >= 0.8 && b1Pct >= 0.8 && b2Pct >= 0.6) recommendedLevel = 'B2'
    else if (a1Pct >= 0.8 && a2Pct >= 0.8 && b1Pct >= 0.6) recommendedLevel = 'B1'
    else if (a1Pct >= 0.8 && a2Pct >= 0.6) recommendedLevel = 'A2'
    else recommendedLevel = 'A1'

    // Actualizar nivel del estudiante en DB
    await supabaseAdmin
      .from('students')
      .update({ current_level: recommendedLevel })
      .eq('id', student_id)

    // Guardar resultado del test
    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'placement_test',
      level: recommendedLevel,
      module_name: 'Placement Test',
      lesson_id: null,
      skill: 'placement',
      score: Math.round(a1Pct * 100),
      event_data: { scores, recommended_level: recommendedLevel },
    }])

    const messages: Record<string, string> = {
      A1: 'Comenzás desde cero — perfecto. En AcademIA vas a construir una base sólida desde el día 1.',
      A2: '¡Ya tenés base! Entrás en A2, donde empezás a hablar sin depender del español.',
      B1: 'Muy bien. Ya podés tener conversaciones básicas. En B1 las vas a llevar al siguiente nivel.',
      B2: '¡Impresionante! Entrás directo a B2 — hablar fluido, natural y sin traducir.',
    }

    return Response.json({
      success: true,
      recommended_level: recommendedLevel,
      scores,
      maria_message: messages[recommendedLevel],
    })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
