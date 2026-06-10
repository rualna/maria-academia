import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 151 — REALTIME CONVERSATION MODE
// 152 — AI ROLEPLAYS
// 153 — BUSINESS SIMULATIONS
// 154 — TRAVEL SIMULATIONS
// 155 — INTERVIEW SIMULATIONS
// ============================================================
// NOTA: Realtime voice (151) → OpenAI Realtime API
// Activar cuando: primeros estudiantes lleguen a B1
// Costo: ~$0.06/min — solo para evaluaciones trimestrales
// ============================================================

// ============================================================
// EXÁMENES FINALES POR NIVEL — conversación real con María
// Cada nivel tiene su examen final como roleplay conversacional
// ============================================================
export const LEVEL_FINAL_EXAMS: Record<string, any> = {
  A1: {
    id: 'exam_a1',
    title: 'Examen Final A1 — Preséntate al mundo',
    level: 'A1',
    type: 'level_exam',
    is_final_exam: true,
    duration_minutes: 8,
    min_score_to_pass: 65,
    context: 'María va a tener una conversación natural contigo sobre quién sos. No sabe cuándo empieza el examen — es intencional.',
    maria_role: 'María — tutora evaluadora (modo conversación natural)',
    student_goal: 'Presentarte, hablar de tu país, edad, trabajo o estudios, rutina básica y un plan futuro',
    vocabulary_focus: ['verb BE', 'simple present', 'can/can\'t', 'going to', 'basic vocabulary week 1-4'],
    evaluation_criteria: [
      'Puede presentarse sin pausas largas (>5 seg)',
      'Usa Verb BE correctamente en contexto',
      'Puede decir su rutina en 3+ oraciones',
      'Menciona al menos 1 plan futuro con going to',
      'Se entiende sin necesidad de repetir',
    ],
    starter: "Hey! I'm so glad you made it. How are you doing today?",
  },
  A2: {
    id: 'exam_a2',
    title: 'Examen Final A2 — Hablá de tu vida',
    level: 'A2',
    type: 'level_exam',
    is_final_exam: true,
    duration_minutes: 12,
    min_score_to_pass: 65,
    context: 'Conversación sobre trabajo, familia, gustos y experiencias pasadas.',
    maria_role: 'María — tutora evaluadora (conversación natural)',
    student_goal: 'Hablar de trabajo/estudios, familia, gustos y contar algo del pasado',
    vocabulary_focus: ['simple past', 'comparatives', 'frequency adverbs', 'like/love/hate + gerund'],
    evaluation_criteria: [
      'Usa simple past correctamente en al menos 3 oraciones',
      'Puede hablar de preferencias y dar razones',
      'Describe a una persona o lugar',
      'Sostiene 12 min sin bloqueo total',
    ],
    starter: "It's great to see you again! Tell me, what have you been up to lately?",
  },
  B1: {
    id: 'exam_b1',
    title: 'Examen Final B1 — Conversación real',
    level: 'B1',
    type: 'level_exam',
    is_final_exam: true,
    duration_minutes: 18,
    min_score_to_pass: 68,
    context: 'Conversación sobre problemas, opiniones y experiencias. María te hace preguntas abiertas.',
    maria_role: 'María — tutora evaluadora',
    student_goal: 'Expresar opiniones, contar experiencias pasadas y hablar de planes y sueños',
    vocabulary_focus: ['present perfect', 'conditional', 'modals', 'discourse connectors'],
    evaluation_criteria: [
      'Improvisa respuestas sin preparación previa',
      'Usa conectores (however, although, because) naturalmente',
      'Puede dar su opinión y defenderla',
      'Sostiene 18 min sin pausas de más de 8 seg',
    ],
    starter: "Let's have a real conversation today. What's something that's been on your mind lately?",
  },
  B2: {
    id: 'exam_b2',
    title: 'Examen Final B2 — Hablás con fluidez',
    level: 'B2',
    type: 'level_exam',
    is_final_exam: true,
    duration_minutes: 24,
    min_score_to_pass: 70,
    context: 'Conversación sobre temas complejos. María puede estar en desacuerdo.',
    maria_role: 'María — tutora evaluadora (puede debatir)',
    student_goal: 'Sostener una conversación fluida sobre temas complejos y defender posturas',
    vocabulary_focus: ['advanced connectors', 'hedging language', 'passive voice', 'complex clauses'],
    evaluation_criteria: [
      'Habla de forma natural sin traducir mentalmente',
      'Puede debatir y contraargumentar',
      'Usa vocabulario variado apropiado al tema',
      'Pronunciación consistentemente comprensible',
    ],
    starter: "I want to hear your thoughts on something. Do you think technology is making us better or worse at communicating?",
  },
  C1: {
    id: 'exam_c1',
    title: 'Examen Final C1 — Dominio del idioma',
    level: 'C1',
    type: 'level_exam',
    is_final_exam: true,
    duration_minutes: 30,
    min_score_to_pass: 75,
    context: 'La tapa del perol. Conversación profesional sobre temas complejos. 100% en inglés.',
    maria_role: 'María — par intelectual, no tutora',
    student_goal: 'Demostrar fluidez total — pensás en inglés, no traducís',
    vocabulary_focus: ['C1 vocabulary range', 'idiomatic expressions', 'register adaptation'],
    evaluation_criteria: [
      'Habla 30 min continuos sin bloqueo',
      'Parafrasea cuando no recuerda una palabra',
      'Adapta el registro (formal/informal) según el contexto',
      'Puede liderar la conversación, no solo responder',
    ],
    starter: "Hey! It's been quite a journey. Tell me — what's different about you now compared to when you started?",
  },
}

// Escenarios de práctica disponibles por nivel
export const SIMULATION_SCENARIOS = {
  // ── A1 ──
  meet_someone: {
    id: 'meet_someone',
    title: 'Conocer a alguien nuevo',
    level: 'A1',
    type: 'social',
    context: 'Estás en un curso de inglés y conocés a otro estudiante.',
    maria_role: 'Nuevo compañero de clase',
    student_goal: 'Presentarte, preguntar de dónde es, qué estudia y qué le gusta',
    vocabulary_focus: ['name', 'country', 'job/studies', 'hobbies', 'verb BE'],
    duration_minutes: 4,
    starter: "Hi! I don't think we've met. I'm Alex. What's your name?",
  },
  at_the_store: {
    id: 'at_the_store',
    title: 'En la tienda',
    level: 'A1',
    type: 'daily',
    context: 'Estás en una tienda y necesitás ayuda para encontrar algo.',
    maria_role: 'Empleado de la tienda',
    student_goal: 'Preguntar por un producto, el precio y dónde está',
    vocabulary_focus: ['how much', 'where is', 'I need', 'I would like', 'numbers'],
    duration_minutes: 4,
    starter: "Good morning! Can I help you find something?",
  },
  travel_basic: {
    id: 'travel_basic',
    title: 'En el aeropuerto',
    level: 'A1',
    type: 'travel',
    context: 'Estás en el aeropuerto de Miami. Necesitás hacer check-in.',
    maria_role: 'Agente de check-in del aeropuerto',
    student_goal: 'Hacer check-in, preguntar por tu asiento y la puerta de embarque',
    vocabulary_focus: ['check-in', 'boarding pass', 'window/aisle seat', 'gate', 'departure'],
    duration_minutes: 5,
    starter: "Good morning! Welcome to American Airlines. May I see your passport, please?",
  },
  // ── A2 ──
  hotel_checkin: {
    id: 'hotel_checkin',
    title: 'Check-in en el hotel',
    level: 'A2',
    type: 'travel',
    context: 'Llegás a un hotel en Nueva York.',
    maria_role: 'Recepcionista del hotel',
    student_goal: 'Hacer check-in, pedir información del hotel y reportar un problema',
    vocabulary_focus: ['reservation', 'room type', 'amenities', 'WiFi', 'breakfast included'],
    duration_minutes: 7,
    starter: "Good evening! Do you have a reservation with us?",
  },
  talking_about_weekend: {
    id: 'talking_about_weekend',
    title: 'Hablando del fin de semana',
    level: 'A2',
    type: 'social',
    context: 'Un amigo te pregunta cómo estuvo tu fin de semana.',
    maria_role: 'Amigo/a curiosa',
    student_goal: 'Contar qué hiciste el fin de semana usando simple past',
    vocabulary_focus: ['simple past', 'went', 'saw', 'ate', 'had', 'time expressions'],
    duration_minutes: 6,
    starter: "Hey! How was your weekend? Did you do anything fun?",
  },
  // ── B1 ──
  job_interview: {
    id: 'job_interview',
    title: 'Entrevista de trabajo',
    level: 'B1',
    type: 'interview',
    context: 'Tenés una entrevista para un puesto de customer service en una empresa internacional.',
    maria_role: 'Gerente de RRHH de la empresa',
    student_goal: 'Presentarte, hablar de tu experiencia y responder preguntas difíciles',
    vocabulary_focus: ['strengths/weaknesses', 'experience', 'teamwork', 'challenges', 'goals'],
    duration_minutes: 15,
    starter: "Thank you for coming in today. Tell me a little about yourself.",
  },
  business_meeting: {
    id: 'business_meeting',
    title: 'Reunión de negocios',
    level: 'B2',
    type: 'business',
    context: 'Tenés una reunión con un cliente potencial de Estados Unidos.',
    maria_role: 'Cliente potencial de una empresa en California',
    student_goal: 'Presentar tu propuesta, responder objeciones y cerrar la reunión',
    vocabulary_focus: ['proposal', 'budget', 'timeline', 'deliverables', 'follow-up'],
    duration_minutes: 20,
    starter: "Thanks for reaching out. I've reviewed your proposal briefly. Walk me through it.",
  },
  // C1
  negotiation: {
    id: 'negotiation',
    title: 'Negociación de contrato',
    level: 'C1',
    type: 'business',
    context: 'Estás negociando los términos de un contrato con un socio internacional.',
    maria_role: 'Director de una empresa europea',
    student_goal: 'Negociar precio, términos y condiciones del contrato',
    vocabulary_focus: ['terms', 'conditions', 'liability', 'payment terms', 'contract clause'],
    duration_minutes: 25,
    starter: "Let's discuss the contract terms. I have some concerns about the pricing structure.",
  },
}

// GET — escenarios disponibles para el nivel del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')
  const type = searchParams.get('type') // 'travel' | 'business' | 'interview' | null

  let level = 'A1'
  if (student_id) {
    const { data } = await supabaseAdmin.from('students').select('current_level').eq('id', student_id).single()
    level = data?.current_level || 'A1'
  }

  const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
  const currentIndex = levelOrder.indexOf(level)

  const available = Object.values(SIMULATION_SCENARIOS).filter(s => {
    const scenarioIndex = levelOrder.indexOf(s.level)
    const withinRange = scenarioIndex <= currentIndex + 1
    const typeMatch = !type || s.type === type
    return withinRange && typeMatch
  })

  // Examen final del nivel actual
  const finalExam = LEVEL_FINAL_EXAMS[level] || null

  return Response.json({
    success: true,
    student_level: level,
    scenarios: available,
    final_exam: finalExam,
    realtime_voice_status: 'coming_soon',
    note: 'Modo texto activo. El examen final de cada nivel es una conversación real con María.',
  })
}

// POST — iniciar simulación / roleplay (modo texto por ahora)
export async function POST(request: Request) {
  const { student_id, scenario_id, student_message, conversation_history } = await request.json()

  if (!student_id || !scenario_id) {
    return Response.json({ success: false, error: 'student_id and scenario_id required' }, { status: 400 })
  }

  const scenario = SIMULATION_SCENARIOS[scenario_id as keyof typeof SIMULATION_SCENARIOS]
  if (!scenario) {
    return Response.json({ success: false, error: 'Scenario not found' }, { status: 404 })
  }

  const ctx = await buildMariaContext(student_id)

  // Si es el inicio de la simulación
  if (!student_message) {
    return Response.json({
      success: true,
      scenario,
      maria_opens: scenario.starter,
      instructions: `🎭 Estás en: "${scenario.title}"\nMaria juega el rol de: ${scenario.maria_role}\nTu objetivo: ${scenario.student_goal}\nVocabulario clave: ${scenario.vocabulary_focus.join(', ')}`,
    })
  }

  // Continuar la conversación del roleplay
  const messages = [
    {
      role: 'system' as const,
      content: `
Sos María en un roleplay educativo de inglés.
ROL QUE JUGÁS: ${scenario.maria_role}
CONTEXTO: ${scenario.context}
NIVEL DEL ESTUDIANTE: ${ctx.current_level}

REGLAS DEL ROLEPLAY:
1. Respondé SIEMPRE en inglés — estás en personaje
2. Mantené el personaje pero si el estudiante comete un error grave, pausá brevemente y corregí: "[Nota de María: Decí 'X' en lugar de 'Y']" — luego seguí el roleplay
3. Hacé la conversación realista pero adaptada al nivel ${ctx.current_level}
4. Al final de cada turno (cada 3-4 intercambios) dá un mini-score de fluidez del 1-10
5. Usá vocabulario del objetivo: ${scenario.vocabulary_focus.join(', ')}
`,
    },
    ...(conversation_history || []),
    { role: 'user' as const, content: student_message },
  ]

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages,
  })

  const reply = completion.choices[0].message.content

  return Response.json({
    success: true,
    scenario_id,
    maria_reply: reply,
    in_character: true,
    voice_mode: 'text_only', // → cuando activen OpenAI Realtime: 'voice'
  })
}
