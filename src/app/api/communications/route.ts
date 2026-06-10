import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildMariaContext } from '@/lib/maria-context'
import { analyzeRetention } from '@/lib/retention-engine'
import { getToneForStudent } from '@/lib/student-profiles'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 85 — SMART ONBOARDING
// 86 — WELCOME SEQUENCES
// 87 — RE-ENGAGEMENT CAMPAIGNS
// 88 — WEEKLY SUMMARIES
// 89 — MONTHLY PROGRESS EMAILS
// 90 — MILESTONE CELEBRATIONS
// ============================================================

export async function POST(request: Request) {
  const { student_id, type } = await request.json()
  // type: 'onboarding' | 'welcome' | 'reengagement' | 'weekly_summary' | 'monthly_report' | 'celebration'

  if (!student_id || !type) {
    return Response.json({ success: false, error: 'student_id and type required' }, { status: 400 })
  }

  const [ctx, retention] = await Promise.all([
    buildMariaContext(student_id),
    analyzeRetention(student_id),
  ])

  const tone = getToneForStudent(retention.maria_tone)

  let content: any = {}

  switch (type) {

    // ── 85 — SMART ONBOARDING ──
    case 'onboarding': {
      content = {
        step: 1,
        welcome_message: `¡Hola ${ctx.student_name}! Soy María, tu tutora IA de AcademIA. Vamos a aprender inglés juntos desde cero. ¿Empezamos con tu test de nivel?`,
        steps: [
          { step: 1, action: 'placement_test',   title: 'Test de nivel (5 min)',         cta: 'Hacer el test' },
          { step: 2, action: 'first_speaking',    title: 'Tu primera práctica de voz',    cta: 'Hablar con María' },
          { step: 3, action: 'daily_mission',     title: 'Tu misión de hoy',              cta: 'Ver misión' },
          { step: 4, action: 'set_reminder',      title: 'Configurar recordatorio diario', cta: 'Activar' },
        ],
        maria_tip: 'No necesitás saber nada de inglés para empezar. María te guía desde el primer minuto.',
      }
      break
    }

    // ── 86 — WELCOME SEQUENCES ──
    case 'welcome': {
      content = {
        day: 1,
        subject: `Bienvenido/a a AcademIA, ${ctx.student_name} 🎉`,
        body: `
Hola ${ctx.student_name},

Bienvenido/a a AcademIA. Soy María, tu tutora IA personal.

En los próximos 15 meses vamos a trabajar juntos para que hables inglés con confianza. No con memorización — con práctica real.

Tu primer paso: hacé el test de nivel para que María sepa desde dónde empezamos.

Vamos,
María
        `.trim(),
        sequences: [
          { day: 1,  trigger: 'welcome',          message: 'Bienvenida y test de nivel' },
          { day: 2,  trigger: 'first_mission',     message: 'Tu primera misión te espera' },
          { day: 3,  trigger: 'speaking_reminder', message: 'Hoy toca hablar' },
          { day: 7,  trigger: 'week1_checkin',     message: 'Primera semana — ¿cómo va?' },
          { day: 14, trigger: 'two_week_report',   message: 'Tu progreso en 2 semanas' },
          { day: 30, trigger: 'month1_exam',       message: 'Examen del Mes 1 disponible' },
        ],
      }
      break
    }

    // ── 87 — RE-ENGAGEMENT CAMPAIGNS ──
    case 'reengagement': {
      // 80 — Anti-guilt: el regreso se celebra, no se reprocha
      const daysAway = 7 // estimado
      const completion = await openai.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [{
          role: 'system',
          content: `
Escribís un mensaje de reactivación para un estudiante de AcademIA que lleva ${daysAway} días sin entrar.
Nombre: ${ctx.student_name}
Nivel: ${ctx.current_level}
Score speaking: ${ctx.speaking_score_avg}/10

REGLAS ANTI-GUILT (80):
- NUNCA mencionar que "no entró", "abandonó", "faltó"
- María lo extrañó, no lo juzga
- El regreso es una victoria, no una derrota
- Máximo 3 oraciones
- En español
- Terminar con invitación concreta, no presión
          `,
        }, { role: 'user', content: 'Escribí el mensaje de reactivación.' }],
      })
      content = {
        message: completion.choices[0].message.content,
        cta: 'Continuar donde lo dejé',
        tone: 'anti_guilt',
        maria_greeting: tone.greeting,
      }
      break
    }

    // ── 88 — WEEKLY SUMMARIES ──
    case 'weekly_summary': {
      const { data: weekEvents } = await supabaseAdmin
        .from('student_events')
        .select('event_type, created_at')
        .eq('student_id', student_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const { data: weekSpeaking } = await supabaseAdmin
        .from('student_speaking_attempts')
        .select('score')
        .eq('student_id', student_id)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      const sessions = weekEvents?.length || 0
      const speakingScores = weekSpeaking?.map(s => s.score || 0) || []
      const weekAvg = speakingScores.length > 0
        ? Math.round(speakingScores.reduce((a, b) => a + b, 0) / speakingScores.length)
        : 0

      content = {
        subject: `Tu semana en AcademIA — ${ctx.student_name}`,
        week_sessions: sessions,
        speaking_attempts: speakingScores.length,
        speaking_avg: weekAvg,
        streak: ctx.streak_days,
        xp_earned_this_week: sessions * 10,
        maria_message: sessions >= 5
          ? `¡Semana increíble, ${ctx.student_name}! ${sessions} sesiones y ${ctx.streak_days} días de racha. Seguís construyendo.`
          : `Esta semana tuviste ${sessions} sesiones. La próxima podemos hacer más. María te espera.`,
        next_week_goal: `Completar semana ${Math.min(ctx.current_week + 1, 4)} y hacer ${Math.max(3, speakingScores.length)} prácticas de speaking`,
      }
      break
    }

    // ── 89 — MONTHLY PROGRESS EMAILS ──
    case 'monthly_report': {
      const { data: monthSpeaking } = await supabaseAdmin
        .from('student_speaking_attempts')
        .select('score, created_at')
        .eq('student_id', student_id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const scores = monthSpeaking?.map(s => s.score || 0) || []
      const monthAvg = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2))
      const secondHalf = scores.slice(Math.floor(scores.length / 2))
      const firstAvg = firstHalf.length > 0 ? firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length : 0
      const secondAvg = secondHalf.length > 0 ? secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length : 0

      content = {
        subject: `Tu progreso del mes — ${ctx.student_name} | AcademIA`,
        level: ctx.current_level,
        month: ctx.current_month,
        speaking_attempts: scores.length,
        monthly_avg: monthAvg,
        improvement: secondAvg > firstAvg ? `+${Math.round(secondAvg - firstAvg)} puntos vs primera quincena` : 'Consistente',
        streak: ctx.streak_days,
        xp: ctx.xp,
        chokis: ctx.chokis,
        next_milestone: 'Examen del Mes 1 disponible',
        maria_assessment: monthAvg >= 7
          ? `${ctx.student_name}, tu speaking mejora de forma consistente. Estás en el camino correcto para ${ctx.current_level}.`
          : `${ctx.student_name}, hay margen para mejorar el speaking. María tiene ejercicios específicos para vos.`,
      }
      break
    }

    // ── 90 — MILESTONE CELEBRATIONS ──
    case 'celebration': {
      const { data: badges } = await supabaseAdmin
        .from('student_badges')
        .select('*')
        .eq('student_id', student_id)
        .order('earned_at', { ascending: false })
        .limit(1)

      const latestBadge = badges?.[0]
      content = {
        type: 'celebration',
        badge: latestBadge,
        message: latestBadge
          ? `🎉 ¡${ctx.student_name} acaba de ganar "${latestBadge.badge_name}" ${latestBadge.badge_emoji}!`
          : `🎉 ¡${ctx.student_name} alcanzó un nuevo logro!`,
        confetti: true,
        xp_bonus: 10,
        choki_bonus: 5,
        maria_message: `${tone.encouragement} ${latestBadge ? `Ganaste el badge "${latestBadge.badge_name}".` : ''} Cada logro suma.`,
        share_text: `Acabo de ganar un logro en AcademIA aprendiendo inglés con IA 🎤🇬🇧`,
      }
      break
    }

    default:
      return Response.json({ success: false, error: 'Invalid type' }, { status: 400 })
  }

  return Response.json({ success: true, type, content })
}

// GET — obtener onboarding state del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const { data: events } = await supabaseAdmin
    .from('student_events')
    .select('event_type')
    .eq('student_id', student_id)

  const types = new Set(events?.map(e => e.event_type) || [])

  return Response.json({
    success: true,
    onboarding: {
      placement_done: types.has('placement_test'),
      first_speaking_done: types.has('speaking_stamina'),
      first_mission_seen: types.has('daily_mission'),
      welcome_sent: types.has('welcome_sequence'),
    },
  })
}
