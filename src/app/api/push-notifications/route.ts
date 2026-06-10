import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================
// 161 — PREMIUM MOBILE UX (manifest + responsive ya activos)
// 162 — OFFLINE MODE (service worker — pendiente)
// 163 — PUSH NOTIFICATIONS
// 164 — NATIVE APP WRAPPER (Capacitor — pendiente)
// 165 — PREMIUM ONBOARDING EXPERIENCE
// ============================================================

// POST — registrar suscripción de push del navegador
export async function POST(request: Request) {
  const { student_id, action, subscription, notification } = await request.json()

  // 163 — Guardar suscripción de push
  if (action === 'subscribe' && student_id && subscription) {
    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'push_subscription',
      level: null,
      module_name: 'Push Notifications',
      lesson_id: null,
      skill: 'engagement',
      score: null,
      event_data: {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        subscribed_at: new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
      },
    }])

    return Response.json({
      success: true,
      message: 'Push subscription saved',
      note: 'Para enviar pushes reales agregar: web-push npm package + VAPID keys en .env',
    })
  }

  // 163 — Enviar push notification (estructura lista)
  if (action === 'send' && student_id && notification) {
    // En producción: usar web-push library con VAPID keys
    // const webpush = require('web-push')
    // webpush.sendNotification(subscription, JSON.stringify(notification))

    await supabaseAdmin.from('notifications_queue').insert([{
      student_id,
      type: 'push',
      channel: 'push',
      subject: notification.title,
      message: notification.body,
      scheduled_for: new Date().toISOString(),
      metadata: { icon: '/mariaanimada.jpeg', badge: '/mariaanimada.jpeg', url: notification.url || '/' },
    }])

    return Response.json({
      success: true,
      queued: true,
      notification,
      vapid_note: 'Agregar VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY al .env para activar pushes reales',
    })
  }

  // 165 — PREMIUM ONBOARDING: pasos completados
  if (action === 'onboarding_step' && student_id) {
    const { step, completed } = request.body as any || {}
    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'onboarding_step',
      level: null,
      module_name: 'Premium Onboarding',
      lesson_id: null,
      skill: 'onboarding',
      score: null,
      event_data: { step, completed, timestamp: new Date().toISOString() },
    }])
    return Response.json({ success: true, step })
  }

  return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })
}

// GET — estado premium del estudiante
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
    .in('event_type', ['push_subscription', 'onboarding_step', 'placement_test', 'first_speaking'])

  const types = new Set(events?.map(e => e.event_type) || [])

  return Response.json({
    success: true,
    premium_status: {
      // 161 — Mobile UX
      pwa_installable: true,  // manifest.json activo
      responsive: true,
      // 162 — Offline
      offline_mode: 'pending_service_worker',
      // 163 — Push
      push_subscribed: types.has('push_subscription'),
      push_status: 'pending_vapid_keys',
      // 164 — Native app
      native_app: 'pending_capacitor',
      // 165 — Onboarding
      onboarding_complete: types.has('placement_test') && types.has('first_speaking'),
    },
    features_roadmap: {
      '161_mobile_ux': '✅ Activo — responsive + PWA manifest',
      '162_offline': '⏳ Pendiente — service worker',
      '163_push': '⏳ Pendiente — VAPID keys',
      '164_native': '⏳ Pendiente — Capacitor wrapper',
      '165_onboarding': '✅ Activo — placement test + welcome sequence',
    },
  })
}
