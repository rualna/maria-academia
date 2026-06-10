import OpenAI from 'openai'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { analyzeRetention } from '@/lib/retention-engine'
import { buildMariaContext } from '@/lib/maria-context'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ============================================================
// 76 — SMART REMINDERS
// 77 — WHATSAPP REMINDERS (estructura lista, API key pendiente)
// 78 — EMAIL REMINDERS (estructura lista, Resend pendiente)
// 79 — PERSONALIZED NUDGES
// 80 — ANTI-GUILT REACTIVATION
// 81 — SESSION TIMING OPTIMIZATION
// ============================================================

// POST — generar y encolar notificación para un estudiante
export async function POST(request: Request) {
  const { student_id, trigger } = await request.json()
  // trigger: 'daily_reminder' | 'streak_at_risk' | 'reactivation' | 'celebration' | 'nudge'

  if (!student_id || !trigger) {
    return Response.json({ success: false, error: 'student_id and trigger required' }, { status: 400 })
  }

  const [ctx, retention] = await Promise.all([
    buildMariaContext(student_id),
    analyzeRetention(student_id),
  ])

  // 81 — SESSION TIMING: buscar la mejor hora del estudiante
  const { data: pastSessions } = await supabaseAdmin
    .from('student_events')
    .select('created_at')
    .eq('student_id', student_id)
    .order('created_at', { ascending: false })
    .limit(20)

  const bestHour = getBestStudyHour(pastSessions || [])

  // 79 + 80 — Generar mensaje personalizado con IA
  const messageStyle = trigger === 'reactivation'
    ? 'anti_guilt'  // 80 — nunca con culpa
    : retention.maria_tone

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `
Generás mensajes de notificación personalizados para AcademIA.

Estudiante: ${ctx.student_name}
Nivel: ${ctx.current_level} Semana ${ctx.current_week}
Racha: ${ctx.streak_days} días
Score speaking: ${ctx.speaking_score_avg}/10
Estado motivacional: ${retention.status}
Tono de María: ${messageStyle}
Trigger: ${trigger}

REGLAS CRÍTICAS para anti_guilt (80):
- NUNCA usar: "te perdiste", "fallaste", "deberías", "tenías que"
- SÍ usar: "cuando quieras", "a tu ritmo", "seguimos desde donde lo dejaste"
- El regreso se celebra, no se reprocha
- María extraña al estudiante, no lo juzga

REGLAS generales:
- Máximo 160 caracteres para WhatsApp/SMS
- Máximo 80 palabras para email
- Siempre terminar con una acción concreta
- Usar el nombre del estudiante
- Tono según estado: celebratory → festivo, gentle → cálido, urgent → directo pero sin presión

Devolvé JSON:
{
  "whatsapp_message": "mensaje corto max 160 chars",
  "email_subject": "asunto del email",
  "email_body": "cuerpo del email max 80 palabras",
  "in_app_message": "mensaje dentro de la app",
  "call_to_action": "texto del botón",
  "send_at_hour": ${bestHour}
}
`,
      },
      { role: 'user', content: `Generá notificación para trigger: ${trigger}` },
    ],
  })

  const notification = JSON.parse(completion.choices[0].message.content || '{}')

  // Guardar en cola
  const scheduledFor = new Date()
  scheduledFor.setHours(bestHour, 0, 0, 0)
  if (scheduledFor < new Date()) scheduledFor.setDate(scheduledFor.getDate() + 1)

  await supabaseAdmin.from('notifications_queue').insert([{
    student_id,
    type: trigger,
    channel: 'in_app',
    subject: notification.email_subject,
    message: notification.in_app_message,
    scheduled_for: scheduledFor.toISOString(),
    metadata: {
      whatsapp_message: notification.whatsapp_message,
      email_body: notification.email_body,
      call_to_action: notification.call_to_action,
      retention_status: retention.status,
    },
  }])

  return Response.json({
    success: true,
    notification,
    scheduled_for: scheduledFor.toISOString(),
    channels_note: {
      whatsapp: 'Requiere Twilio API key en .env (TWILIO_SID + TWILIO_TOKEN)',
      email: 'Requiere Resend API key en .env (RESEND_API_KEY)',
      in_app: 'Activo — guardado en notifications_queue',
    },
  })
}

// GET — notificaciones pendientes para el estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from('notifications_queue')
    .select('*')
    .eq('student_id', student_id)
    .eq('sent', false)
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })

  return Response.json({ success: true, notifications: data || [] })
}

// 81 — HELPER: mejor hora de estudio
function getBestStudyHour(sessions: any[]): number {
  if (sessions.length === 0) return 19 // default 7pm

  const hours = sessions.map(s => new Date(s.created_at).getHours())
  const freq: Record<number, number> = {}
  for (const h of hours) freq[h] = (freq[h] || 0) + 1

  return parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
}
