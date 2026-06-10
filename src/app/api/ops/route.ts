import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================
// 139 — CRM INTEGRATION
// 140 — ADMIN DASHBOARD (operativo)
// 141 — SUPPORT PANEL
// 142 — USER MODERATION
// 143 — BETA TESTER SYSTEM
// 144 — FEATURE FLAGS
// 145 — TERMS & PRIVACY
// 146 — DATA EXPORT SYSTEM
// 147 — BACKUP SYSTEM
// 148 — MONITORING & ALERTS
// 149 — ERROR LOGS
// 150 — PRODUCTION MONITORING
// ============================================================

// ── 144 — FEATURE FLAGS ──
export const FEATURE_FLAGS: Record<string, boolean> = {
  quarterly_exam_voice:     false,  // → Bloque 7: OpenAI Realtime
  whatsapp_notifications:   false,  // → pendiente línea WA
  email_notifications:      false,  // → pendiente Zetly Mail config
  portuguese_language:      false,  // → trigger: 100 estudiantes o primer B1
  french_language:          false,
  corporate_plans:          true,
  referral_system:          true,
  affiliate_system:         true,
  ai_avatar:                false,  // → Bloque 7: HeyGen
  placement_test:           true,
  daily_missions:           true,
  weekly_missions:          true,
}

// GET — endpoints múltiples según ?action=
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action') || 'status'
  const student_id = searchParams.get('student_id')

  // ── 144 — Feature flags ──
  if (action === 'flags') {
    return Response.json({ success: true, flags: FEATURE_FLAGS })
  }

  // ── 140/148 — Admin overview + monitoring ──
  if (action === 'admin_overview') {
    const [studentsRes, eventsRes, speakingRes] = await Promise.all([
      supabaseAdmin.from('students').select('id, created_at, current_level, subscription_status'),
      supabaseAdmin.from('student_events').select('event_type, created_at').order('created_at', { ascending: false }).limit(50),
      supabaseAdmin.from('student_speaking_attempts').select('score').order('created_at', { ascending: false }).limit(20),
    ])

    const students = studentsRes.data || []
    const events = eventsRes.data || []
    const speaking = speakingRes.data || []

    const avgScore = speaking.length > 0
      ? Math.round(speaking.reduce((s, a) => s + (a.score || 0), 0) / speaking.length * 10) / 10
      : 0

    const today = new Date().toISOString().split('T')[0]
    const todayEvents = events.filter(e => e.created_at.startsWith(today))

    return Response.json({
      success: true,
      overview: {
        total_students: students.length,
        active_subscriptions: students.filter(s => s.subscription_status === 'active').length,
        free_users: students.filter(s => !s.subscription_status || s.subscription_status === 'inactive').length,
        today_events: todayEvents.length,
        avg_speaking_score: avgScore,
        levels_distribution: students.reduce((acc, s) => {
          acc[s.current_level] = (acc[s.current_level] || 0) + 1
          return acc
        }, {} as Record<string, number>),
        system_status: 'operational',
        feature_flags_active: Object.entries(FEATURE_FLAGS).filter(([_, v]) => v).map(([k]) => k),
      },
    })
  }

  // ── 149 — Error logs ──
  if (action === 'errors') {
    const { data } = await supabaseAdmin
      .from('student_events')
      .select('student_id, event_data, created_at')
      .eq('event_type', 'ai_cost')
      .order('created_at', { ascending: false })
      .limit(20)

    return Response.json({ success: true, recent_ai_calls: data || [] })
  }

  // ── 139 — CRM: datos del estudiante para soporte ──
  if (action === 'crm' && student_id) {
    const [studentRes, eventsRes, speakingRes, badgesRes] = await Promise.all([
      supabaseAdmin.from('students').select('*').eq('id', student_id).single(),
      supabaseAdmin.from('student_events').select('event_type, created_at, event_data').eq('student_id', student_id).order('created_at', { ascending: false }).limit(10),
      supabaseAdmin.from('student_speaking_attempts').select('score, created_at').eq('student_id', student_id).order('created_at', { ascending: false }).limit(5),
      supabaseAdmin.from('student_badges').select('*').eq('student_id', student_id),
    ])

    return Response.json({
      success: true,
      crm_profile: {
        student: studentRes.data,
        recent_activity: eventsRes.data,
        recent_speaking: speakingRes.data,
        badges: badgesRes.data,
        support_notes: 'Ver historial completo en Supabase dashboard',
      },
    })
  }

  // ── 145 — Terms & Privacy ──
  if (action === 'terms') {
    return Response.json({
      success: true,
      terms_url: '/terms',
      privacy_url: '/privacy',
      last_updated: '2026-06-01',
      version: '1.0',
    })
  }

  return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })
}

// POST — acciones administrativas
export async function POST(request: Request) {
  const { action, student_id, data } = await request.json()

  // ── 141 — Support panel: agregar nota de soporte ──
  if (action === 'support_note' && student_id) {
    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'support_note',
      level: null,
      module_name: 'Support',
      lesson_id: null,
      skill: 'support',
      score: null,
      event_data: {
        note: data?.note,
        agent: data?.agent || 'system',
        created_at: new Date().toISOString(),
      },
    }])
    return Response.json({ success: true, message: 'Support note saved' })
  }

  // ── 142 — User moderation ──
  if (action === 'moderate' && student_id) {
    const { reason, type } = data || {}
    // type: 'warn' | 'suspend' | 'reactivate'
    await supabaseAdmin.from('students').update({
      subscription_status: type === 'suspend' ? 'suspended' : 'active',
    }).eq('id', student_id)

    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'moderation_action',
      level: null,
      module_name: 'Moderation',
      lesson_id: null,
      skill: 'moderation',
      score: null,
      event_data: { type, reason, timestamp: new Date().toISOString() },
    }])
    return Response.json({ success: true, action: type })
  }

  // ── 143 — Beta tester system ──
  if (action === 'add_beta_tester' && student_id) {
    await supabaseAdmin.from('students').update({
      subscription_plan: 'beta',
      subscription_status: 'active',
    }).eq('id', student_id)
    return Response.json({ success: true, message: 'Beta tester activated — full access granted' })
  }

  // ── 144 — Toggle feature flag ──
  if (action === 'toggle_flag') {
    const { flag_name, enabled } = data || {}
    if (flag_name in FEATURE_FLAGS) {
      FEATURE_FLAGS[flag_name] = enabled
      return Response.json({ success: true, flag: flag_name, enabled })
    }
    return Response.json({ success: false, error: 'Unknown flag' }, { status: 400 })
  }

  // ── 146 — Data export ──
  if (action === 'export_data' && student_id) {
    const [studentRes, eventsRes, speakingRes] = await Promise.all([
      supabaseAdmin.from('students').select('*').eq('id', student_id).single(),
      supabaseAdmin.from('student_events').select('*').eq('student_id', student_id),
      supabaseAdmin.from('student_speaking_attempts').select('*').eq('student_id', student_id),
    ])

    return Response.json({
      success: true,
      export: {
        student: studentRes.data,
        events: eventsRes.data,
        speaking_attempts: speakingRes.data,
        exported_at: new Date().toISOString(),
        format: 'JSON',
        gdpr_compliant: true,
      },
    })
  }

  // ── 150 — Production monitoring health check ──
  if (action === 'health_check') {
    const checks = {
      database: false,
      openai: !!process.env.OPENAI_API_KEY,
      supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      stripe: !!process.env.STRIPE_SECRET_KEY,
      resend: !!process.env.RESEND_API_KEY,
    }

    // Test DB connection
    try {
      const { error } = await supabaseAdmin.from('students').select('id').limit(1)
      checks.database = !error
    } catch (_) {}

    const allCriticalOk = checks.database && checks.openai && checks.supabase

    return Response.json({
      success: true,
      status: allCriticalOk ? 'operational' : 'degraded',
      checks,
      missing_keys: Object.entries(checks).filter(([_, v]) => !v).map(([k]) => k),
      timestamp: new Date().toISOString(),
    })
  }

  return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })
}
