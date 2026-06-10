import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================
// 66 — HABIT SYSTEM
// 67 — SMART STREAKS
// 68 — XP SYSTEM
// 69 — CHOKIS ECONOMY
// 70 — ACHIEVEMENT BADGES
// ============================================================

// ── BADGES DISPONIBLES ──
export const BADGES = [
  { id: 'first_chat',       name: 'Primera Charla',      emoji: '💬', trigger: 'first_chat_message' },
  { id: 'first_speaking',   name: 'Primera Voz',         emoji: '🎤', trigger: 'first_speaking_attempt' },
  { id: 'streak_3',         name: 'Racha de 3',          emoji: '🔥', trigger: 'streak_3_days' },
  { id: 'streak_7',         name: 'Semana Completa',     emoji: '⚡', trigger: 'streak_7_days' },
  { id: 'streak_30',        name: 'Mes Imparable',       emoji: '🌟', trigger: 'streak_30_days' },
  { id: 'score_9',          name: 'Casi Perfecto',       emoji: '🎯', trigger: 'speaking_score_9' },
  { id: 'score_10',         name: 'Perfecto',            emoji: '💎', trigger: 'speaking_score_10' },
  { id: 'week1_complete',   name: 'Semana 1 Completa',   emoji: '✅', trigger: 'week_1_complete' },
  { id: 'month1_pass',      name: 'Mes 1 Aprobado',      emoji: '🏆', trigger: 'month_1_passed' },
  { id: 'month1_master',    name: 'Mes 1 Master',        emoji: '👑', trigger: 'month_1_score_90' },
  { id: 'early_bird',       name: 'Madrugador',          emoji: '🌅', trigger: 'study_before_7am' },
  { id: 'night_owl',        name: 'Búho Nocturno',       emoji: '🦉', trigger: 'study_after_10pm' },
  { id: 'consistent_week',  name: 'Consistente',         emoji: '📅', trigger: 'study_7_days_in_row' },
  { id: 'comeback',         name: 'De Regreso',          emoji: '💪', trigger: 'return_after_absence' },
  { id: 'placement_done',   name: 'Test de Nivel',       emoji: '📊', trigger: 'placement_test_done' },
]

// ── XP RULES — cuánto XP da cada acción ──
export const XP_RULES: Record<string, number> = {
  chat_message:           5,
  speaking_attempt:       15,
  speaking_score_7plus:   25,
  speaking_score_9plus:   40,
  lesson_complete:        30,
  week_complete:          100,
  daily_mission_complete: 20,
  weekly_mission_complete: 150,
  streak_day:             10,
  streak_7_bonus:         50,
  streak_30_bonus:        200,
  monthly_exam_pass:      200,
  monthly_exam_master:    300,
}

// ── XP LEVELS — títulos por cantidad de XP ──
export const XP_LEVELS = [
  { min: 0,    title: 'Beginner',    emoji: '🌱' },
  { min: 100,  title: 'Explorer',    emoji: '🧭' },
  { min: 300,  title: 'Learner',     emoji: '📚' },
  { min: 600,  title: 'Speaker',     emoji: '🗣️' },
  { min: 1000, title: 'Confident',   emoji: '⚡' },
  { min: 1500, title: 'Advanced',    emoji: '🚀' },
  { min: 2500, title: 'Expert',      emoji: '🎯' },
  { min: 4000, title: 'Master',      emoji: '👑' },
]

function getLevelTitle(xp: number) {
  const level = [...XP_LEVELS].reverse().find(l => xp >= l.min)
  return level || XP_LEVELS[0]
}

// ── CHOKIS RULES ──
export const CHOKI_RULES: Record<string, number> = {
  daily_mission_complete:  5,
  weekly_mission_complete: 20,
  speaking_score_8plus:    10,
  month_exam_pass:         50,
  streak_7_bonus:          15,
  badge_earned:            5,
}

// POST — registrar acción y dar recompensas
export async function POST(request: Request) {
  try {
    const { student_id, action, metadata } = await request.json()

    if (!student_id || !action) {
      return Response.json({ success: false, error: 'student_id and action required' }, { status: 400 })
    }

    const xp = XP_RULES[action] || 0
    const chokis = CHOKI_RULES[action] || 0
    const rewards: any = { xp, chokis, badges_earned: [] }

    // Dar XP y Chokis
    if (xp > 0 || chokis > 0) {
      try {
        await supabaseAdmin.rpc('add_student_rewards', {
          p_student_id: student_id,
          p_xp: xp,
          p_chokis: chokis,
        })
      } catch (_) { /* silencioso si falla */ }
    }

    // 67 — Smart streaks
    if (action === 'streak_day') {
      await updateStreak(student_id, rewards)
    }

    // 70 — Check badges
    const newBadges = await checkAndAwardBadges(student_id, action, metadata)
    rewards.badges_earned = newBadges

    // Actualizar level_title
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('xp')
      .eq('id', student_id)
      .single()

    if (student) {
      const levelInfo = getLevelTitle((student.xp || 0) + xp)
      await supabaseAdmin
        .from('students')
        .update({ level_title: levelInfo.title, last_active_at: new Date().toISOString() })
        .eq('id', student_id)
      rewards.level_title = levelInfo
    }

    return Response.json({ success: true, rewards })
  } catch (error: any) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

// GET — estado de gamificación del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const [studentRes, badgesRes] = await Promise.all([
    supabaseAdmin.from('students').select('xp, chokis, streak_days, longest_streak, level_title').eq('id', student_id).single(),
    supabaseAdmin.from('student_badges').select('*').eq('student_id', student_id),
  ])

  const student = studentRes.data
  const badges = badgesRes.data || []
  const levelInfo = getLevelTitle(student?.xp || 0)
  const nextLevel = XP_LEVELS.find(l => l.min > (student?.xp || 0))

  return Response.json({
    success: true,
    gamification: {
      xp: student?.xp || 0,
      chokis: student?.chokis || 0,
      streak_days: student?.streak_days || 0,
      longest_streak: student?.longest_streak || 0,
      level: levelInfo,
      next_level: nextLevel || null,
      xp_to_next: nextLevel ? nextLevel.min - (student?.xp || 0) : 0,
      badges_earned: badges,
      badges_total: BADGES.length,
      all_badges: BADGES,
    },
  })
}

// ── HELPERS ──

async function updateStreak(studentId: string, rewards: any) {
  const { data: student } = await supabaseAdmin
    .from('students')
    .select('streak_days, longest_streak, last_active_at, streak_freeze_available')
    .eq('id', studentId)
    .single()

  if (!student) return

  const lastActive = student.last_active_at ? new Date(student.last_active_at) : null
  const now = new Date()
  const daysSince = lastActive
    ? Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))
    : 999

  let newStreak = student.streak_days || 0

  if (daysSince === 0) return // ya se contó hoy
  if (daysSince === 1) {
    newStreak += 1 // día consecutivo
  } else if (daysSince === 2 && student.streak_freeze_available > 0) {
    // 67 — streak freeze: perdona un día de ausencia
    newStreak += 1
    await supabaseAdmin.from('students').update({ streak_freeze_available: student.streak_freeze_available - 1 }).eq('id', studentId)
    rewards.streak_freeze_used = true
  } else {
    newStreak = 1 // racha rota
    rewards.streak_reset = true
  }

  const longestStreak = Math.max(newStreak, student.longest_streak || 0)

  await supabaseAdmin.from('students').update({
    streak_days: newStreak,
    longest_streak: longestStreak,
    last_active_at: now.toISOString(),
  }).eq('id', studentId)

  rewards.new_streak = newStreak

  // Bonus XP por hitos de racha
  if (newStreak === 7) {
    rewards.xp = (rewards.xp || 0) + (XP_RULES.streak_7_bonus || 0)
    rewards.chokis = (rewards.chokis || 0) + (CHOKI_RULES.streak_7_bonus || 0)
  }
  if (newStreak === 30) {
    rewards.xp = (rewards.xp || 0) + (XP_RULES.streak_30_bonus || 0)
  }
}

async function checkAndAwardBadges(studentId: string, action: string, metadata: any): Promise<any[]> {
  const earned = []

  const triggerMap: Record<string, string> = {
    chat_message:           'first_chat',
    speaking_attempt:       'first_speaking',
    streak_3_days:          'streak_3',
    streak_7_days:          'streak_7',
    streak_30_days:         'streak_30',
    placement_test_done:    'placement_done',
    return_after_absence:   'comeback',
  }

  const badgeId = triggerMap[action]
  if (!badgeId) return []

  const badge = BADGES.find(b => b.id === badgeId)
  if (!badge) return []

  const { error } = await supabaseAdmin.from('student_badges').insert([{
    student_id: studentId,
    badge_id: badge.id,
    badge_name: badge.name,
    badge_emoji: badge.emoji,
  }]).select()

  if (!error) {
    earned.push(badge)
    try {
      await supabaseAdmin.rpc('add_student_rewards', {
        p_student_id: studentId,
        p_xp: 0,
        p_chokis: CHOKI_RULES.badge_earned || 5,
      })
    } catch (_) { /* silencioso */ }
  }

  return earned
}
