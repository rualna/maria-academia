import { supabaseAdmin } from '@/lib/supabase-admin'
import { getAllPlans, getPlan } from '@/lib/subscription-plans'

// ============================================================
// 131 — SUBSCRIPTION SYSTEM
// 132 — STRIPE INTEGRATION (estructura lista, keys pendientes)
// 133 — PAYMENT RECOVERY
// 134 — FAMILY PLANS
// 135 — CORPORATE PLANS
// 136 — TEAM DASHBOARDS
// ============================================================

// GET — planes disponibles o estado de suscripción del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')
  const view = searchParams.get('view') || 'plans'

  if (view === 'plans') {
    return Response.json({
      success: true,
      plans: getAllPlans(),
      stripe_status: 'ready_to_connect', // → agregar STRIPE_SECRET_KEY al .env
    })
  }

  if (view === 'status' && student_id) {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('subscription_plan, subscription_status, subscription_expires_at, team_id')
      .eq('id', student_id)
      .single()

    return Response.json({
      success: true,
      subscription: {
        plan: student?.subscription_plan || 'free',
        status: student?.subscription_status || 'inactive',
        expires_at: student?.subscription_expires_at || null,
        team_id: student?.team_id || null,
        is_active: student?.subscription_status === 'active',
      },
    })
  }

  // 136 — TEAM DASHBOARD
  if (view === 'team' && student_id) {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('team_id')
      .eq('id', student_id)
      .single()

    if (!student?.team_id) {
      return Response.json({ success: false, error: 'No team assigned' }, { status: 404 })
    }

    const { data: teamMembers } = await supabaseAdmin
      .from('students')
      .select('id, full_name, current_level, streak_days, xp')
      .eq('team_id', student.team_id)

    return Response.json({
      success: true,
      team: {
        id: student.team_id,
        members: teamMembers || [],
        total_members: teamMembers?.length || 0,
        avg_level: 'A1', // calcular cuando haya más datos
      },
    })
  }

  return Response.json({ success: false, error: 'Invalid view' }, { status: 400 })
}

// POST — crear/actualizar suscripción
export async function POST(request: Request) {
  const { student_id, plan_id, payment_method, action } = await request.json()

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  // 133 — PAYMENT RECOVERY: verificar si hay pago fallido pendiente
  if (action === 'recover_payment') {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('subscription_status, full_name')
      .eq('id', student_id)
      .single()

    if (student?.subscription_status === 'past_due') {
      return Response.json({
        success: true,
        action_needed: 'update_payment_method',
        message: `Hola ${student.full_name}, tu pago falló. Actualizá tu método de pago para continuar.`,
        stripe_portal_url: null, // → activar con STRIPE_SECRET_KEY
      })
    }
    return Response.json({ success: true, message: 'No payment recovery needed' })
  }

  // Activar suscripción (simulado — Stripe va aquí)
  if (action === 'activate' && plan_id) {
    const plan = getPlan(plan_id)
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + 1)

    await supabaseAdmin.from('students').update({
      subscription_plan: plan_id,
      subscription_status: 'active',
      subscription_expires_at: expiresAt.toISOString(),
    }).eq('id', student_id)

    // Registrar evento
    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'subscription_activated',
      level: null,
      module_name: 'Subscriptions',
      lesson_id: null,
      skill: 'business',
      score: null,
      event_data: {
        plan_id,
        plan_name: plan.name,
        price_usd: plan.price_monthly_usd,
        expires_at: expiresAt.toISOString(),
        payment_method: payment_method || 'manual',
      },
    }])

    return Response.json({
      success: true,
      plan: plan.name,
      expires_at: expiresAt.toISOString(),
      stripe_note: 'Integración Stripe pendiente — agregar STRIPE_SECRET_KEY al .env',
    })
  }

  return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })
}
