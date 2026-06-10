// ============================================================
// 48 — REVISION ENGINE
// 49 — SPACED REPETITION
// Decide qué lecciones necesitan revisión y cuándo.
// Algoritmo basado en SM-2 simplificado para hispanohablantes.
// ============================================================

export type ReviewItem = {
  lesson_id: string
  last_score: number
  last_practiced: Date
  review_count: number
}

export type ReviewSchedule = {
  lesson_id: string
  next_review: Date
  priority: 'urgent' | 'soon' | 'later'
  reason: string
}

// ============================================================
// 49 — SPACED REPETITION: cuántos días hasta el próximo repaso
// Basado en el score del último intento
// ============================================================
export function getDaysUntilNextReview(score: number, reviewCount: number): number {
  // Score 0-100
  if (score < 50)  return 0   // Inmediato — ni pasó
  if (score < 65)  return 1   // Al día siguiente
  if (score < 80)  return 3   // En 3 días
  if (score < 90)  return 7   // En una semana
  return 14 * Math.min(reviewCount, 3) // 14, 28, 42 días — dominio creciente
}

// ============================================================
// 48 — REVISION ENGINE: qué lecciones necesitan revisión HOY
// ============================================================
export function getRevisionList(items: ReviewItem[]): ReviewSchedule[] {
  const today = new Date()
  const schedule: ReviewSchedule[] = []

  for (const item of items) {
    const daysSince = Math.floor(
      (today.getTime() - new Date(item.last_practiced).getTime()) / (1000 * 60 * 60 * 24)
    )
    const daysNeeded = getDaysUntilNextReview(item.last_score, item.review_count)
    const nextReview = new Date(item.last_practiced)
    nextReview.setDate(nextReview.getDate() + daysNeeded)

    if (daysSince >= daysNeeded) {
      // Ya es hora de repasar
      let priority: 'urgent' | 'soon' | 'later' = 'later'
      let reason = ''

      if (item.last_score < 65) {
        priority = 'urgent'
        reason = 'Score bajo — necesita refuerzo inmediato'
      } else if (daysSince >= daysNeeded * 1.5) {
        priority = 'urgent'
        reason = 'Lleva mucho tiempo sin practicar este tema'
      } else if (daysSince >= daysNeeded) {
        priority = 'soon'
        reason = 'Es momento de repasar para no olvidar'
      }

      schedule.push({ lesson_id: item.lesson_id, next_review: nextReview, priority, reason })
    }
  }

  // Ordenar: urgent primero, luego soon, luego later
  return schedule.sort((a, b) => {
    const order = { urgent: 0, soon: 1, later: 2 }
    return order[a.priority] - order[b.priority]
  })
}

// ============================================================
// API helper — obtiene la lista de revisión de un estudiante
// desde la DB y calcula qué necesita repasar
// ============================================================
export async function buildRevisionList(studentId: string, supabaseAdmin: any): Promise<ReviewSchedule[]> {
  // Buscar intentos de ejercicios agrupados por lección
  const { data: attempts } = await supabaseAdmin
    .from('student_exercise_attempts')
    .select('lesson_id, final_score, created_at, attempts_count')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (!attempts || attempts.length === 0) return []

  // Agrupar por lesson_id — tomar el más reciente de cada uno
  const byLesson = new Map<string, any>()
  for (const attempt of attempts) {
    if (!byLesson.has(attempt.lesson_id)) {
      byLesson.set(attempt.lesson_id, attempt)
    }
  }

  const reviewItems: ReviewItem[] = Array.from(byLesson.values()).map(a => ({
    lesson_id: a.lesson_id,
    last_score: a.final_score || 0,
    last_practiced: new Date(a.created_at),
    review_count: a.attempts_count || 1,
  }))

  return getRevisionList(reviewItems)
}
