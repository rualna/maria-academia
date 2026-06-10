import { supabaseAdmin } from './supabase-admin'
import { buildRevisionList } from './spaced-repetition'
import { getLearningAdaptations, type LearningAdaptations } from './learning-profiles'

// ============================================================
// TEMAS DISPONIBLES POR SEMANA (restricción temática de María)
// ============================================================
export const TOPICS_BY_WEEK: Record<number, string[]> = {
  1: [
    'greetings and goodbyes',
    'personal introductions (name)',
    'alphabet and spelling',
    'numbers 0-10',
    'verb BE (I am, my name is)',
    'possessives: my, your, his, her',
    'subject pronouns',
  ],
  2: [
    // semana 1 acumulada +
    'classroom objects (pen, book, bag, desk, phone)',
    'demonstratives: this, that, these, those',
    'articles: a, an, the',
    'plurals (regular and irregular)',
    'verb BE: negation and yes/no questions',
    'wh-questions: what, where, who, how',
    'countries and nationalities',
    'ages and numbers 11-30',
  ],
  3: [
    // semanas 1+2 acumuladas +
    'telling time',
    'daily routines',
    'transportation',
    'jobs and occupations',
    'food and drinks',
    'sports and hobbies',
    'can / can\'t for abilities',
    'simple present tense',
    'adverbs of frequency: always, usually, sometimes, never',
    'time expressions: at, in, on, around',
  ],
  4: [
    // semanas 1+2+3 acumuladas +
    'going to (future plans)',
    'invitations and suggestions',
    'body parts and health',
    'places in a city',
    'prepositions of place: next to, between, behind, in front of',
    'there is / there are',
    'basic directions: go straight, turn left/right',
    'would like to',
  ],
}

// ============================================================
// FRASES DE SPEAKING — MES 1 A1 (30 frases reales)
// ============================================================
export const SPEAKING_PHRASES_MONTH1 = [
  // Semana 1 — básicas
  { id: 1, en: 'Hello! My name is ___.', es: 'Hola, me llamo ___.', week: 1, level: 'basic' },
  { id: 2, en: "What's your name?", es: '¿Cómo te llamás?', week: 1, level: 'basic' },
  { id: 3, en: 'Nice to meet you!', es: 'Mucho gusto.', week: 1, level: 'basic' },
  { id: 4, en: 'How do you spell your name?', es: '¿Cómo se deletrea tu nombre?', week: 1, level: 'basic' },
  { id: 5, en: 'Goodbye! See you tomorrow.', es: '¡Adiós! Hasta mañana.', week: 1, level: 'basic' },
  { id: 6, en: "I'm from Costa Rica. Where are you from?", es: 'Soy de Costa Rica. ¿De dónde sos?', week: 1, level: 'basic' },
  { id: 7, en: "I'm ___ years old. How old are you?", es: 'Tengo ___ años. ¿Cuántos tenés?', week: 1, level: 'basic' },
  // Semana 2 — elemental
  { id: 8, en: 'This is my book. That is your pen.', es: 'Este es mi libro. Ese es tu bolígrafo.', week: 2, level: 'elemental' },
  { id: 9, en: "What is this? It's a phone.", es: '¿Qué es esto? Es un teléfono.', week: 2, level: 'elemental' },
  { id: 10, en: 'She is Costa Rican. He is American.', es: 'Ella es costarricense. Él es americano.', week: 2, level: 'elemental' },
  { id: 11, en: 'Are you a student? Yes, I am. / No, I\'m not.', es: '¿Eres estudiante? Sí. / No.', week: 2, level: 'elemental' },
  { id: 12, en: 'These are my books. Those are her bags.', es: 'Estos son mis libros. Esas son sus bolsas.', week: 2, level: 'elemental' },
  { id: 13, en: "Where are you from? I'm from Mexico City.", es: '¿De dónde eres? Soy de Ciudad de México.', week: 2, level: 'elemental' },
  // Semana 3 — intermedio
  { id: 14, en: 'I wake up at 6 AM every day.', es: 'Me despierto a las 6 AM todos los días.', week: 3, level: 'intermediate' },
  { id: 15, en: "She works in a hospital. She's a doctor.", es: 'Ella trabaja en un hospital. Ella es doctora.', week: 3, level: 'intermediate' },
  { id: 16, en: 'I usually have coffee and rice for breakfast.', es: 'Normalmente desayuno café y arroz.', week: 3, level: 'intermediate' },
  { id: 17, en: "I can swim but I can't play the guitar.", es: 'Puedo nadar pero no sé tocar guitarra.', week: 3, level: 'intermediate' },
  { id: 18, en: 'I go to work by bus. It takes 30 minutes.', es: 'Voy al trabajo en bus. Tarda 30 minutos.', week: 3, level: 'intermediate' },
  { id: 19, en: 'Do you like soccer? I love it! I play on weekends.', es: '¿Te gusta el fútbol? ¡Me encanta! Juego los fines de semana.', week: 3, level: 'intermediate' },
  { id: 20, en: 'She always reads before bed. He never watches TV.', es: 'Ella siempre lee antes de dormir. Él nunca ve televisión.', week: 3, level: 'intermediate' },
  // Semana 4 — producción
  { id: 21, en: "I'm going to visit my family this weekend.", es: 'Voy a visitar a mi familia este fin de semana.', week: 4, level: 'production' },
  { id: 22, en: 'Would you like to have lunch together?', es: '¿Te gustaría almorzar juntos?', week: 4, level: 'production' },
  { id: 23, en: 'My head hurts. I need to go to the pharmacy.', es: 'Me duele la cabeza. Necesito ir a la farmacia.', week: 4, level: 'production' },
  { id: 24, en: 'Excuse me, where is the hospital? Go straight and turn left.', es: 'Disculpe, ¿dónde está el hospital? Siga recto y doble a la izquierda.', week: 4, level: 'production' },
  { id: 25, en: 'There is a park next to my house. I go there on Sundays.', es: 'Hay un parque al lado de mi casa. Voy ahí los domingos.', week: 4, level: 'production' },
  { id: 26, en: "I'm not going to work tomorrow. I'm going to rest.", es: 'Mañana no voy a trabajar. Voy a descansar.', week: 4, level: 'production' },
  { id: 27, en: "This is my friend Ana. She's a teacher from San José.", es: 'Esta es mi amiga Ana. Es profesora de San José.', week: 4, level: 'production' },
  { id: 28, en: 'I usually wake up early, but on Sundays I sleep until 9.', es: 'Normalmente me levanto temprano, pero los domingos duermo hasta las 9.', week: 4, level: 'production' },
  { id: 29, en: "Can you help me? I'm looking for the bus station.", es: '¿Me podés ayudar? Estoy buscando la terminal de buses.', week: 4, level: 'production' },
  { id: 30, en: "I'm going to study English every day. I want to speak fluently.", es: 'Voy a estudiar inglés todos los días. Quiero hablar con fluidez.', week: 4, level: 'production' },
]

// ============================================================
// CALCULAR SEMANA ACTUAL DEL ESTUDIANTE
// ============================================================
export async function getCurrentWeek(studentId: string): Promise<number> {
  const { data: lessons } = await supabaseAdmin
    .from('student_lesson_progress')
    .select('*')
    .eq('student_id', studentId)

  if (!lessons || lessons.length === 0) return 1

  const weekDone = (week: number) =>
    lessons
      .filter((l: any) => l.week === week)
      .every((l: any) => l.video_completion_pct >= 80 && l.exercise_score >= 80)

  if (!weekDone(1)) return 1
  if (!weekDone(2)) return 2
  if (!weekDone(3)) return 3
  return 4
}

// ============================================================
// OBTENER FRASES DE SPEAKING PARA LA SEMANA ACTUAL
// ============================================================
export function getPhrasesForWeek(currentWeek: number, count: number = 4): string[] {
  // Incluye frases de la semana actual + 1 de repaso de semana anterior
  const currentPhrases = SPEAKING_PHRASES_MONTH1.filter(p => p.week === currentWeek)
  const reviewPhrases = currentWeek > 1
    ? SPEAKING_PHRASES_MONTH1.filter(p => p.week === currentWeek - 1)
    : []

  const shuffled = [...currentPhrases].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, count - 1)

  if (reviewPhrases.length > 0) {
    const review = reviewPhrases[Math.floor(Math.random() * reviewPhrases.length)]
    selected.push(review)
  }

  return selected.map(p => p.en)
}

// ============================================================
// CONSTRUIR CONTEXTO COMPLETO DE MARÍA
// ============================================================
export async function buildMariaContext(studentId: string) {
  const [studentRes, eventsRes, speakingRes, lessonProgressRes, exerciseRes] =
    await Promise.all([
      supabaseAdmin.from('students').select('*').eq('id', studentId).single(),
      supabaseAdmin
        .from('student_events')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('student_speaking_attempts')
        .select('score, created_at')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })
        .limit(10),
      supabaseAdmin
        .from('student_lesson_progress')
        .select('*')
        .eq('student_id', studentId),
      supabaseAdmin
        .from('student_exercise_attempts')
        .select('*')
        .eq('student_id', studentId)
        .eq('stuck_flag', true)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

  const student = studentRes.data
  const recentEvents = eventsRes.data || []
  const speakingAttempts = speakingRes.data || []
  const lessonProgress = lessonProgressRes.data || []
  const stuckExercises = exerciseRes.data || []

  const currentWeek = await getCurrentWeek(studentId)

  const avgSpeakingScore =
    speakingAttempts.length > 0
      ? Math.round(
          speakingAttempts.reduce((sum: number, a: any) => sum + (a.score || 0), 0) /
            speakingAttempts.length
        )
      : 0

  const weakTopics = stuckExercises.map((e: any) => e.exercise_id).filter(Boolean)

  // 48+49 — Revision engine: qué necesita repasar hoy
  const revisionList = await buildRevisionList(studentId, supabaseAdmin)
  const urgentReview = revisionList.filter(r => r.priority === 'urgent').map(r => r.lesson_id)

  // Perfiles de aprendizaje — silencioso, nunca se menciona al estudiante
  const learningAdaptations = await getLearningAdaptations(studentId)
  const completedLessons = lessonProgress
    .filter((l: any) => l.completed)
    .map((l: any) => l.lesson_id)

  return {
    student_name: student?.full_name || 'Estudiante',
    current_level: student?.current_level || 'A1',
    current_sublevel: 'A1.1',
    current_week: currentWeek,
    current_month: 1,
    maria_language_ratio: '85% español / 15% inglés',
    available_topics: TOPICS_BY_WEEK[currentWeek] || TOPICS_BY_WEEK[1],
    lessons_completed: completedLessons,
    speaking_score_avg: avgSpeakingScore,
    streak_days: student?.streak_days || 0,
    xp: student?.xp || 0,
    chokis: student?.chokis || 0,
    weak_topics: weakTopics,
    urgent_review: urgentReview,
    learning_adaptations: learningAdaptations,
    recent_activity: recentEvents.map((e: any) =>
      e.event_data?.user_message ? `"${e.event_data.user_message}"` : e.event_type
    ),
  }
}
