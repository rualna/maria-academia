import { supabaseAdmin } from './supabase-admin'
import { ECONOMY, type RewardSource } from './economy'

// ============================================================
// Otorgamiento de XP / Chokis con tope diario anti-farm.
// Escribe en students.xp / students.chokis (vía RPC add_student_rewards,
// que hace coalesce → maneja NULL) y loguea cada premio en student_events
// (event_type='reward') para auditoría + cálculo de los topes.
// ============================================================

// Cuántos premios de esta fuente ya se dieron HOY (para el tope).
async function todaysRewards(studentId: string, source: RewardSource) {
  const todayStart = new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'
  const { data } = await supabaseAdmin
    .from('student_events')
    .select('event_data')
    .eq('student_id', studentId)
    .eq('event_type', 'reward')
    .gte('created_at', todayStart)
  return (data || []).filter((e: any) => e.event_data?.source === source)
}

export async function awardRewards(
  studentId: string,
  source: RewardSource,
  opts: { score?: number } = {}
): Promise<{ xp: number; chokis: number; capped: boolean }> {
  const prior = await todaysRewards(studentId, source)

  let xp = 0
  let chokis = 0
  let choki_type: string | null = null
  let capped = false

  if (source === 'chat') {
    // Responsabilidad → migaja de XP, sin Chokis. Tope diario por XP acumulado.
    const xpToday = prior.reduce((s: number, e: any) => s + (e.event_data?.xp || 0), 0)
    const remaining = ECONOMY.dailyCaps.chat_xp - xpToday
    xp = Math.max(0, Math.min(ECONOMY.xp.chat_message, remaining))
    if (xp === 0) capped = true
  } else {
    // speaking → tope por cantidad de prácticas premiadas/día
    if (prior.length >= ECONOMY.dailyCaps.speaking_awards) {
      capped = true
    } else {
      const score = opts.score ?? 0
      xp = ECONOMY.xp.speaking_attempt
      chokis = ECONOMY.chokis.speaking_habito
      choki_type = 'habito'
      if (score >= ECONOMY.scoreThresholds.great) {
        xp += ECONOMY.xp.great_bonus
        chokis += ECONOMY.chokis.great_logro
        choki_type = 'habito+logro'
      } else if (score >= ECONOMY.scoreThresholds.good) {
        xp += ECONOMY.xp.good_bonus
        chokis += ECONOMY.chokis.good_logro
        choki_type = 'habito+logro'
      }
    }
  }

  if (capped || (xp === 0 && chokis === 0)) {
    return { xp: 0, chokis: 0, capped }
  }

  // 1) Sumar a students.xp / students.chokis (coalesce maneja NULL)
  try {
    await supabaseAdmin.rpc('add_student_rewards', { p_student_id: studentId, p_xp: xp, p_chokis: chokis })
  } catch (_) { /* silencioso: un fallo de premio no debe romper la respuesta al estudiante */ }

  // 2) Loguear el premio (auditoría + base del tope diario)
  try {
    await supabaseAdmin.from('student_events').insert([{
      student_id: studentId,
      event_type: 'reward',
      level: null,
      module_name: 'rewards',
      lesson_id: null,
      skill: source,
      score: opts.score ?? null,
      event_data: { source, xp, chokis, choki_type, score: opts.score ?? null },
    }])
  } catch (_) { /* silencioso */ }

  return { xp, chokis, capped }
}
