// ============================================================
// 82 — BEHAVIORAL SEGMENTATION
// 83 — LEARNING PERSONALITY PROFILES
// 84 — EMOTIONAL TONE ADAPTATION
// ============================================================

export type PersonalityType = 'explorer' | 'achiever' | 'social' | 'independent'

export type StudentSegment = {
  personality: PersonalityType
  description: string
  strengths: string[]
  risks: string[]
  maria_strategy: string
  recommended_session_length: number // minutos
  preferred_feedback_style: string
}

// ── 83 — LEARNING PERSONALITY PROFILES ──
export const PERSONALITY_PROFILES: Record<PersonalityType, StudentSegment> = {
  explorer: {
    personality: 'explorer',
    description: 'Le gusta explorar, hacer preguntas, salirse del guión',
    strengths: ['Curioso', 'Motivado por el descubrimiento', 'No le da miedo equivocarse'],
    risks: ['Se distrae fácil', 'Puede saltar temas sin dominarlos'],
    maria_strategy: 'Darle mini-descubrimientos dentro de la estructura. Conectar cada lección con algo del mundo real.',
    recommended_session_length: 20,
    preferred_feedback_style: 'encouragement_first',
  },
  achiever: {
    personality: 'achiever',
    description: 'Motivado por scores, badges y metas claras',
    strengths: ['Consistente', 'Orientado a metas', 'No abandona fácil'],
    risks: ['Se frustró mucho con scores bajos', 'Perfeccionismo puede paralizar'],
    maria_strategy: 'Mostrar progreso constantemente. Celebrar cada avance. Dar metas numéricas claras.',
    recommended_session_length: 30,
    preferred_feedback_style: 'score_focused',
  },
  social: {
    personality: 'social',
    description: 'Aprende mejor conversando y con contexto real',
    strengths: ['Fluidez oral natural', 'Motivado por comunicación real'],
    risks: ['Puede descuidar gramática', 'Necesita interacción para no aburrirse'],
    maria_strategy: 'Priorizar conversación y role-plays. Cada lección con contexto social real.',
    recommended_session_length: 25,
    preferred_feedback_style: 'conversation_style',
  },
  independent: {
    personality: 'independent',
    description: 'Aprende a su ritmo, prefiere autonomía',
    strengths: ['Autodisciplina', 'Profundo en los temas que le interesan'],
    risks: ['Puede saltarse ejercicios obligatorios', 'Menos receptivo a correcciones'],
    maria_strategy: 'Darle control percibido. Explicar el por qué de cada regla. No micromanejar.',
    recommended_session_length: 35,
    preferred_feedback_style: 'analytical',
  },
}

// ── 82 — BEHAVIORAL SEGMENTATION ──
// Determina el perfil basado en comportamiento observado
export function segmentStudent(behaviorData: {
  avg_session_minutes: number
  questions_per_session: number
  speaking_vs_grammar_ratio: number  // >1 = habla más, <1 = hace más gramática
  abandon_rate: number               // 0-1
  badge_engagement: boolean
  study_consistency_score: number    // 0-1
}): PersonalityType {
  const { questions_per_session, speaking_vs_grammar_ratio, badge_engagement, study_consistency_score, abandon_rate } = behaviorData

  if (badge_engagement && study_consistency_score > 0.7) return 'achiever'
  if (questions_per_session > 5 && speaking_vs_grammar_ratio < 0.8) return 'explorer'
  if (speaking_vs_grammar_ratio > 1.3) return 'social'
  if (abandon_rate < 0.1 && !badge_engagement) return 'independent'
  return 'explorer' // default
}

// ── 84 — EMOTIONAL TONE ADAPTATION ──
// Ajusta cómo habla María según el estado emocional detectado
export type EmotionalTone = {
  greeting: string
  correction_prefix: string
  encouragement: string
  session_close: string
}

export const EMOTIONAL_TONES: Record<string, EmotionalTone> = {
  energetic: {
    greeting: '¡Hola! Qué bueno verte por acá. ¿Listo para practicar?',
    correction_prefix: 'Casi perfecto — una cosa:',
    encouragement: '¡Vas muy bien! Seguí así.',
    session_close: '¡Excelente sesión! Te esperamos mañana.',
  },
  supportive: {
    greeting: 'Hola, me alegra que estés aquí. Vamos a tu ritmo hoy.',
    correction_prefix: 'Entiendo lo que querés decir. La forma correcta es:',
    encouragement: 'Esto está mejorando, de verdad.',
    session_close: 'Buen trabajo hoy. Cada sesión cuenta.',
  },
  gentle: {
    greeting: 'Hola, qué bueno que apareciste. Sin presión hoy.',
    correction_prefix: 'Solo un ajuste pequeño:',
    encouragement: 'Bien. Seguís progresando aunque no lo notes.',
    session_close: 'Eso fue suficiente por hoy. Nos vemos cuando quieras.',
  },
  urgent: {
    greeting: 'Hola — llevas un tiempo sin practicar. Entremos directo.',
    correction_prefix: 'Importante corregir esto:',
    encouragement: 'Bien, volviste al ritmo.',
    session_close: 'Mañana seguimos. No pierdas el ritmo ahora que volviste.',
  },
  celebratory: {
    greeting: '¡Hola campeón/a! Tu progreso está siendo increíble.',
    correction_prefix: 'Pequeño detalle para que quede perfecto:',
    encouragement: '¡Eso estuvo excelente! Así se habla inglés.',
    session_close: '¡Otra sesión increíble! Tu racha sigue subiendo.',
  },
}

export function getToneForStudent(mariaToне: string): EmotionalTone {
  return EMOTIONAL_TONES[mariaToне] || EMOTIONAL_TONES.supportive
}
