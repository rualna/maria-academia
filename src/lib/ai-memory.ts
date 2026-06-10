import { supabaseAdmin } from './supabase-admin'

// ============================================================
// 113 — AI MEMORY SYSTEM
// 114 — SEMANTIC MEMORY
// ============================================================
// María recuerda cosas específicas de cada estudiante entre sesiones.
// No es solo historial — es memoria estructurada que María usa para
// personalizar cada interacción.
//
// Semantic memory: agrupa errores similares para detectar patrones
// (El upgrade a pgvector embeddings va aquí cuando escale)
// ============================================================

export type MemoryItem = {
  type: 'error' | 'achievement' | 'preference' | 'fact' | 'struggle'
  content: string
  context: string
  importance: 'low' | 'medium' | 'high'
  created_at: string
}

// ── 113 — AI MEMORY: guardar un recuerdo importante sobre el estudiante ──
export async function saveMemory(
  studentId: string,
  memory: Omit<MemoryItem, 'created_at'>
) {
  await supabaseAdmin.from('student_events').insert([{
    student_id: studentId,
    event_type: 'ai_memory',
    level: null,
    module_name: 'AI Memory',
    lesson_id: null,
    skill: 'memory',
    score: null,
    event_data: {
      ...memory,
      created_at: new Date().toISOString(),
    },
  }])
}

// ── Recuperar memorias relevantes del estudiante ──
export async function getStudentMemories(
  studentId: string,
  type?: string,
  limit = 10
): Promise<MemoryItem[]> {
  let query = supabaseAdmin
    .from('student_events')
    .select('event_data, created_at')
    .eq('student_id', studentId)
    .eq('event_type', 'ai_memory')
    .order('created_at', { ascending: false })
    .limit(limit)

  const { data } = await query
  if (!data) return []

  return data
    .map(d => d.event_data as MemoryItem)
    .filter(m => !type || m.type === type)
}

// ── 114 — SEMANTIC MEMORY: detectar patrones en errores del estudiante ──
// Agrupa errores similares para que María sepa qué tipo de problema tiene
export async function analyzeErrorPatterns(studentId: string): Promise<{
  top_errors: string[]
  error_categories: Record<string, number>
  recommendation: string
}> {
  // Obtener todos los errores registrados
  const { data: errorMemories } = await supabaseAdmin
    .from('student_events')
    .select('event_data')
    .eq('student_id', studentId)
    .eq('event_type', 'ai_memory')

  const { data: attempts } = await supabaseAdmin
    .from('student_exercise_attempts')
    .select('exercise_id, final_score, stuck_flag')
    .eq('student_id', studentId)
    .eq('stuck_flag', true)

  // Categorizar errores por tipo gramatical (114 — semantic clustering simple)
  const errorCategories: Record<string, number> = {
    verb_be: 0,
    simple_present: 0,
    pronunciation: 0,
    vocabulary: 0,
    fluency: 0,
    plurals: 0,
    articles: 0,
    prepositions: 0,
  }

  const errors = errorMemories?.map(m => m.event_data?.content || '') || []

  for (const error of errors) {
    const lower = error.toLowerCase()
    if (lower.includes('verb be') || lower.includes('am/is/are')) errorCategories.verb_be++
    if (lower.includes('simple present') || lower.includes('third person')) errorCategories.simple_present++
    if (lower.includes('pronunciation') || lower.includes('sound')) errorCategories.pronunciation++
    if (lower.includes('vocabulary') || lower.includes('word')) errorCategories.vocabulary++
    if (lower.includes('fluency') || lower.includes('pause')) errorCategories.fluency++
    if (lower.includes('plural')) errorCategories.plurals++
    if (lower.includes('article') || lower.includes('a/an/the')) errorCategories.articles++
    if (lower.includes('preposition')) errorCategories.prepositions++
  }

  // Top 3 errores más frecuentes
  const topErrors = Object.entries(errorCategories)
    .sort((a, b) => b[1] - a[1])
    .filter(([_, count]) => count > 0)
    .slice(0, 3)
    .map(([cat]) => cat)

  const recommendations: Record<string, string> = {
    verb_be: 'Practicar conjugación de Verb BE con ejercicios de fill-in-the-blank',
    simple_present: 'Reforzar tercera persona (he/she/it adds -s) con oraciones sobre rutinas',
    pronunciation: 'Shadowing exercises — escuchar y repetir inmediatamente',
    vocabulary: 'Flashcards de vocabulario de la semana actual',
    fluency: 'Sesiones de speaking de 2 min sin parar — cantidad sobre calidad',
    plurals: 'Ejercicios de plurales irregulares y reglas -s/-es/-ies',
    articles: 'Práctica de a/an/the con objetos del aula',
    prepositions: 'Ejercicios de prepositions in/on/at con contexto de rutina diaria',
  }

  const recommendation = topErrors.length > 0
    ? recommendations[topErrors[0]] || 'Continuar con los ejercicios de la semana'
    : 'Sin patrones de error detectados aún — seguir practicando'

  return { top_errors: topErrors, error_categories: errorCategories, recommendation }
}

// ── Construir resumen de memoria para el prompt de María ──
export async function buildMemorySummary(studentId: string): Promise<string> {
  const [memories, patterns] = await Promise.all([
    getStudentMemories(studentId, undefined, 5),
    analyzeErrorPatterns(studentId),
  ])

  if (memories.length === 0 && patterns.top_errors.length === 0) {
    return 'Sin memoria previa registrada para este estudiante.'
  }

  const highImportance = memories.filter(m => m.importance === 'high')

  return `
Memorias importantes del estudiante:
${highImportance.map(m => `- [${m.type.toUpperCase()}] ${m.content}`).join('\n') || '- Sin memorias de alta importancia aún'}

Patrones de error detectados (semantic memory):
- Top errores: ${patterns.top_errors.join(', ') || 'ninguno aún'}
- Recomendación pedagógica: ${patterns.recommendation}
`.trim()
}
