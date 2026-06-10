// ============================================================
// 166 — PROPRIETARY SPEAKING SCORE
// 167 — PROPRIETARY MASTERY SYSTEM
// ============================================================
// Este NO es el score de GPT. Es el score de AcademIA.
// Calibrado específicamente para hispanohablantes aprendiendo
// inglés. Mejora con cada estudiante que pasa por el sistema.
//
// La diferencia: GPT da un número.
// AcademIA da un diagnóstico pedagógico real.
// ============================================================

export type AcademiaScore = {
  // Score compuesto propio (0-100)
  academia_score: number

  // Dimensiones específicas para hispanohablantes
  dimensions: {
    grammar_latam: number         // errores típicos de LATAM (ser/estar, artículos, tiempos)
    fluency_natural: number       // fluidez natural, no memorizada
    pronunciation_clarity: number // claridad para angloparlantes, no perfección
    vocabulary_range: number      // rango vocab para el nivel actual
    communication_success: number // ¿se entendió el mensaje? — lo más importante
  }

  // Diagnóstico pedagógico
  latam_error_flags: string[]     // errores específicos de hispanohablantes detectados
  mastery_indicators: string[]    // qué demuestra dominio
  next_focus: string              // qué trabajar en la próxima sesión

  // Metadata
  gpt_score: number               // score original de GPT (referencia)
  academia_adjustment: number     // ajuste que hizo AcademIA sobre GPT
  calibration_version: string     // versión del algoritmo de calibración
}

// Errores típicos de hispanohablantes que sobre-penalizan otros evaluadores
const LATAM_COMMON_ERRORS = [
  { pattern: 'is/are confusion',          over_penalty: true,  weight: 0.8  },
  { pattern: 'missing third person -s',   over_penalty: true,  weight: 0.85 },
  { pattern: 'ser vs estar',             over_penalty: false, weight: 1.0  },
  { pattern: 'false cognates',           over_penalty: false, weight: 0.9  },
  { pattern: 'word order (SOV)',         over_penalty: true,  weight: 0.75 },
  { pattern: 'double negation',         over_penalty: true,  weight: 0.8  },
  { pattern: 'gender agreement',        over_penalty: true,  weight: 0.7  }, // no existe en inglés
  { pattern: 'th sound substitution',   over_penalty: true,  weight: 0.85 },
  { pattern: 'b/v confusion',           over_penalty: true,  weight: 0.8  },
]

// ── 166 — PROPRIETARY SPEAKING SCORE ──
// Toma el score de GPT y lo ajusta con calibración LATAM
export function calculateAcademiaScore(params: {
  gpt_score: number
  gpt_feedback: {
    grammar: string
    fluency: string
    pronunciation: string
    feedback: string
    corrected_version: string
  }
  transcript: string
  student_level: string
  student_history: { avg_score: number; total_attempts: number }
}): AcademiaScore {
  const { gpt_score, gpt_feedback, transcript, student_level, student_history } = params

  let adjusted_score = gpt_score

  // 1. Ajuste por errores LATAM sobre-penalizados
  const latam_errors: string[] = []
  const text = (gpt_feedback.grammar + gpt_feedback.feedback).toLowerCase()

  for (const error of LATAM_COMMON_ERRORS) {
    if (text.includes(error.pattern) && error.over_penalty) {
      adjusted_score = adjusted_score / error.weight
      latam_errors.push(error.pattern)
    }
  }

  // 2. Ajuste por comunicación exitosa
  // Si el mensaje se entiende, el score mínimo es 60 en A1/A2
  const communication_success = !gpt_feedback.corrected_version.includes('[incomprehensible]')
  const level_floors: Record<string, number> = {
    A1: 55, A2: 50, B1: 45, B2: 40, C1: 35,
  }
  const floor = level_floors[student_level] || 45
  if (communication_success && adjusted_score < floor) {
    adjusted_score = floor
  }

  // 3. Ajuste por progresión del estudiante
  // Si el estudiante mejora consistentemente, pequeño bonus
  if (student_history.total_attempts > 5 && gpt_score > student_history.avg_score) {
    adjusted_score = Math.min(100, adjusted_score + 2) // +2 por mejorar
  }

  // 4. Cap y redondeo
  adjusted_score = Math.min(100, Math.max(0, Math.round(adjusted_score)))

  // Dimensiones
  const dimensions = {
    grammar_latam: parseGrammarScore(gpt_feedback.grammar, student_level),
    fluency_natural: parseFluencyScore(gpt_feedback.fluency),
    pronunciation_clarity: parsePronunciationScore(gpt_feedback.pronunciation, student_level),
    vocabulary_range: estimateVocabularyScore(transcript, student_level),
    communication_success: communication_success ? 85 : 40,
  }

  // Indicadores de dominio
  const mastery_indicators: string[] = []
  if (adjusted_score >= 80) mastery_indicators.push('Comunicación efectiva')
  if (dimensions.fluency_natural >= 75) mastery_indicators.push('Fluidez natural')
  if (latam_errors.length === 0) mastery_indicators.push('Sin errores LATAM típicos')
  if (dimensions.vocabulary_range >= 70) mastery_indicators.push('Vocabulario apropiado al nivel')

  return {
    academia_score: adjusted_score,
    dimensions,
    latam_error_flags: latam_errors,
    mastery_indicators,
    next_focus: determineNextFocus(dimensions, student_level),
    gpt_score,
    academia_adjustment: adjusted_score - gpt_score,
    calibration_version: 'v1.0-latam',
  }
}

// ── 167 — PROPRIETARY MASTERY SYSTEM ──
// Mastery no es un score. Es un estado multidimensional.
export type MasteryState = {
  level: string
  is_mastered: boolean
  mastery_score: number           // 0-100 compuesto
  dimensions_mastered: string[]
  dimensions_pending: string[]
  sessions_at_level: number
  consistency_score: number       // qué tan consistente es el score (no solo el promedio)
  can_advance: boolean
  advance_message: string
}

export function calculateMastery(params: {
  student_level: string
  recent_scores: number[]         // últimas 10 sesiones
  total_sessions: number
  weak_topics: string[]
}): MasteryState {
  const { student_level, recent_scores, total_sessions, weak_topics } = params

  if (recent_scores.length === 0) {
    return {
      level: student_level,
      is_mastered: false,
      mastery_score: 0,
      dimensions_mastered: [],
      dimensions_pending: ['speaking', 'grammar', 'vocabulary', 'fluency'],
      sessions_at_level: 0,
      consistency_score: 0,
      can_advance: false,
      advance_message: 'Sin sesiones registradas aún',
    }
  }

  const avg = recent_scores.reduce((a, b) => a + b, 0) / recent_scores.length

  // Consistencia: qué tan estable es el score (penaliza alta varianza)
  const variance = recent_scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / recent_scores.length
  const consistency_score = Math.max(0, 100 - variance * 2)

  // Score de mastery compuesto: 60% promedio + 40% consistencia
  const mastery_score = Math.round(avg * 0.6 + consistency_score * 0.4)

  // Umbrales por nivel (más exigente a medida que sube)
  const thresholds: Record<string, { mastery: number; min_sessions: number }> = {
    A1: { mastery: 70, min_sessions: 8  },
    A2: { mastery: 72, min_sessions: 10 },
    B1: { mastery: 75, min_sessions: 12 },
    B2: { mastery: 78, min_sessions: 15 },
    C1: { mastery: 80, min_sessions: 20 },
  }

  const threshold = thresholds[student_level] || thresholds['A1']
  const is_mastered = mastery_score >= threshold.mastery &&
                      total_sessions >= threshold.min_sessions &&
                      weak_topics.length === 0

  const dimensions_mastered = []
  const dimensions_pending = []

  if (avg >= 75) dimensions_mastered.push('speaking_score')
  else dimensions_pending.push('speaking_score')

  if (consistency_score >= 70) dimensions_mastered.push('consistency')
  else dimensions_pending.push('consistency')

  if (weak_topics.length === 0) dimensions_mastered.push('no_weak_topics')
  else dimensions_pending.push(`weak_topics: ${weak_topics.join(', ')}`)

  if (total_sessions >= threshold.min_sessions) dimensions_mastered.push('sufficient_practice')
  else dimensions_pending.push(`sessions: ${total_sessions}/${threshold.min_sessions}`)

  const can_advance = is_mastered
  const advance_message = can_advance
    ? `¡Dominio ${student_level} confirmado! Lista para avanzar al siguiente nivel.`
    : `Mastery ${Math.round(mastery_score)}/${threshold.mastery} requerido. ${dimensions_pending[0] || 'Seguir practicando'}.`

  return {
    level: student_level,
    is_mastered,
    mastery_score,
    dimensions_mastered,
    dimensions_pending,
    sessions_at_level: total_sessions,
    consistency_score: Math.round(consistency_score),
    can_advance,
    advance_message,
  }
}

// ── HELPERS ──
function parseGrammarScore(grammar: string, level: string): number {
  if (grammar.toLowerCase().includes('excellent') || grammar.toLowerCase().includes('perfecto')) return 90
  if (grammar.toLowerCase().includes('good') || grammar.toLowerCase().includes('bien')) return 75
  if (grammar.toLowerCase().includes('minor') || grammar.toLowerCase().includes('pequeño')) return 65
  return 50
}

function parseFluencyScore(fluency: string): number {
  if (fluency.toLowerCase().includes('natural') || fluency.toLowerCase().includes('fluent')) return 85
  if (fluency.toLowerCase().includes('good') || fluency.toLowerCase().includes('bien')) return 70
  if (fluency.toLowerCase().includes('hesitation') || fluency.toLowerCase().includes('pausa')) return 55
  return 45
}

function parsePronunciationScore(pronunciation: string, level: string): number {
  const toleranceBonus = level === 'A1' ? 15 : level === 'A2' ? 10 : 0
  if (pronunciation.toLowerCase().includes('clear') || pronunciation.toLowerCase().includes('comprensible')) return 80 + toleranceBonus
  if (pronunciation.toLowerCase().includes('good')) return 70 + toleranceBonus
  return 55 + toleranceBonus
}

function estimateVocabularyScore(transcript: string, level: string): number {
  const words = transcript.split(' ').length
  const uniqueWords = new Set(transcript.toLowerCase().split(' ')).size
  const variety = uniqueWords / Math.max(words, 1)
  const levelBonus: Record<string, number> = { A1: 20, A2: 15, B1: 10, B2: 5, C1: 0 }
  return Math.min(100, Math.round(variety * 100) + (levelBonus[level] || 0))
}

function determineNextFocus(dimensions: any, level: string): string {
  const lowest = Object.entries(dimensions).sort((a: any, b: any) => a[1] - b[1])[0]
  const focusMap: Record<string, string> = {
    grammar_latam: 'Practicar estructuras gramaticales del nivel actual',
    fluency_natural: 'Sesiones de speaking libre de 3 min sin parar',
    pronunciation_clarity: 'Ejercicios de minimal pairs y shadowing',
    vocabulary_range: 'Vocabulario nuevo del tema de esta semana',
    communication_success: 'Practicar completar ideas completas antes de parar',
  }
  return focusMap[lowest[0]] || 'Continuar con ejercicios de la semana'
}
