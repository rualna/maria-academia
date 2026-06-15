import { supabaseAdmin } from './supabase-admin'

// ============================================================
// Dashboard del estudiante — datos REALES de Supabase.
// (NO inventa nada ni usa localStorage. Si no hay datos, devuelve ceros reales.)
// ============================================================

// Niveles de XP (consistente con /api/gamification)
const XP_LEVELS = [
  { min: 0,    title: 'Beginner',  emoji: '🌱' },
  { min: 100,  title: 'Explorer',  emoji: '🧭' },
  { min: 300,  title: 'Learner',   emoji: '📚' },
  { min: 600,  title: 'Speaker',   emoji: '🗣️' },
  { min: 1000, title: 'Confident', emoji: '⚡' },
  { min: 1500, title: 'Advanced',  emoji: '🚀' },
  { min: 2500, title: 'Expert',    emoji: '🎯' },
  { min: 4000, title: 'Master',    emoji: '👑' },
]
function getLevelTitle(xp: number) {
  return [...XP_LEVELS].reverse().find(l => xp >= l.min) || XP_LEVELS[0]
}

// Niveles CEFR del programa (nombres desde maria-knowledge)
const CEFR_LEVELS = [
  { level: 'A1', name: 'Your First Steps' },
  { level: 'A2', name: 'Finding Your Voice' },
  { level: 'B1', name: 'Building Your Confidence' },
  { level: 'B2', name: 'Speaking Without Limits' },
  { level: 'C1', name: 'Owning the Language' },
  { level: 'C2', name: 'Mastering the Game' },
]

// Racha REAL = días consecutivos con práctica de speaking (mismo cálculo que /api/speaking-progress)
function activityStreak(attempts: { created_at: string }[]): number {
  if (!attempts.length) return 0
  const uniqueDays = [...new Set(attempts.map(a => new Date(a.created_at).toISOString().split('T')[0]))]
  let streak = 0
  const cursor = new Date()
  for (let i = 0; i < uniqueDays.length; i++) {
    const dateString = cursor.toISOString().split('T')[0]
    if (uniqueDays.includes(dateString)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

export async function buildDashboard(studentId: string) {
  const [studentRes, attemptsRes, progressRes, catalogRes] = await Promise.all([
    supabaseAdmin
      .from('students')
      .select('full_name, xp, chokis, streak_days, longest_streak, level_title, current_level')
      .eq('id', studentId)
      .single(),
    supabaseAdmin.from('student_speaking_attempts').select('created_at').eq('student_id', studentId),
    supabaseAdmin.from('student_lesson_progress').select('lesson_id, completed').eq('student_id', studentId),
    supabaseAdmin.from('lessons_catalog').select('id, level'),
  ])

  const s: any = studentRes.data || {}
  const attempts = attemptsRes.data || []
  const progress = progressRes.data || []
  const catalog = catalogRes.data || []

  const xp = s.xp || 0
  const level = getLevelTitle(xp)
  const nextLevel = XP_LEVELS.find(l => l.min > xp) || null
  const streak = activityStreak(attempts)

  const currentLevel = s.current_level || 'A1'
  const completedIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id))
  const order = CEFR_LEVELS.map(c => c.level)
  const curIdx = Math.max(0, order.indexOf(currentLevel))

  const courses = CEFR_LEVELS.map((c, i) => {
    const total = catalog.filter((l: any) => l.level === c.level).length
    const completed = catalog.filter((l: any) => l.level === c.level && completedIds.has(l.id)).length
    const status = i < curIdx ? 'completed' : i === curIdx ? 'active' : 'locked'
    return {
      level: c.level,
      name: c.name,
      status,
      total,
      completed,
      progress_pct: total > 0 ? Math.round((completed / total) * 100) : 0,
      has_content: total > 0, // hoy solo A1 tiene contenido cargado
    }
  })

  // Idiomas: inglés activo + portugués "Próximamente" (el resto se revela más adelante)
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸', active: true, coming_soon: false },
    { code: 'pt', name: 'Português', flag: '🇧🇷', active: false, coming_soon: true },
  ]

  return {
    student: {
      name: s.full_name || 'Estudiante',
      current_level: currentLevel,
      current_language: s.current_language || 'en',
    },
    stats: {
      xp,
      chokis: s.chokis || 0,
      streak_days: streak,
      longest_streak: s.longest_streak || 0,
      level,
      next_level: nextLevel,
      xp_to_next: nextLevel ? nextLevel.min - xp : 0,
    },
    courses,
    languages,
    is_new: xp === 0 && attempts.length === 0, // estudiante nuevo → empty states motivadores
  }
}
