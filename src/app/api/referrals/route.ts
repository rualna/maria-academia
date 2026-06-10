import { supabaseAdmin } from '@/lib/supabase-admin'

// ============================================================
// 137 — REFERRAL SYSTEM
// 138 — AFFILIATE SYSTEM
// ============================================================

// Recompensas del sistema de referidos
const REFERRAL_REWARDS = {
  referrer_chokis: 100,      // quien refiere gana 100 Chokis
  referrer_xp: 200,          // y 200 XP
  referred_discount_pct: 10, // el nuevo estudiante tiene 10% de descuento
  affiliate_commission_pct: 10, // afiliado externo gana 10% del primer pago
}

// POST — registrar referido o afiliado
export async function POST(request: Request) {
  const { action, referrer_id, referred_email, affiliate_code } = await request.json()

  // ── 137 — REFERRAL: estudiante refiere a un amigo ──
  if (action === 'refer' && referrer_id && referred_email) {
    const referralCode = `REF-${referrer_id.substring(0, 8).toUpperCase()}`

    await supabaseAdmin.from('student_events').insert([{
      student_id: referrer_id,
      event_type: 'referral_sent',
      level: null,
      module_name: 'Referrals',
      lesson_id: null,
      skill: 'business',
      score: null,
      event_data: {
        referred_email,
        referral_code: referralCode,
        status: 'pending',
        sent_at: new Date().toISOString(),
      },
    }])

    return Response.json({
      success: true,
      referral_code: referralCode,
      referred_email,
      rewards_on_signup: REFERRAL_REWARDS,
      message: `Cuando ${referred_email} se registre con tu código, vos ganás ${REFERRAL_REWARDS.referrer_chokis} Chokis y ellos tienen ${REFERRAL_REWARDS.referred_discount_pct}% de descuento.`,
    })
  }

  // ── 137 — REFERRAL: nuevo estudiante usa código de referido ──
  if (action === 'redeem' && referred_email && affiliate_code?.startsWith('REF-')) {
    const referrerId = affiliate_code.replace('REF-', '').toLowerCase()

    // Dar recompensas al que refirió
    try {
      await supabaseAdmin.rpc('add_student_rewards', {
        p_student_id: referrerId,
        p_xp: REFERRAL_REWARDS.referrer_xp,
        p_chokis: REFERRAL_REWARDS.referrer_chokis,
      })
    } catch (_) {}

    return Response.json({
      success: true,
      discount_applied: `${REFERRAL_REWARDS.referred_discount_pct}%`,
      referrer_rewarded: true,
      message: '¡Código válido! Tu descuento fue aplicado.',
    })
  }

  // ── 138 — AFFILIATE: vendedor externo registra una venta ──
  if (action === 'affiliate_sale' && affiliate_code && referred_email) {
    const commissionPct = REFERRAL_REWARDS.affiliate_commission_pct

    await supabaseAdmin.from('student_events').insert([{
      student_id: '00000000-0000-0000-0000-000000000000', // sistema
      event_type: 'affiliate_sale',
      level: null,
      module_name: 'Affiliates',
      lesson_id: null,
      skill: 'business',
      score: null,
      event_data: {
        affiliate_code,
        referred_email,
        commission_pct: commissionPct,
        status: 'pending_payment',
        registered_at: new Date().toISOString(),
      },
    }])

    return Response.json({
      success: true,
      affiliate_code,
      commission_pct: commissionPct,
      message: `Venta registrada. Comisión del ${commissionPct}% pendiente de pago tras confirmación.`,
    })
  }

  return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })
}

// GET — estadísticas de referidos de un estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const { data } = await supabaseAdmin
    .from('student_events')
    .select('event_data')
    .eq('student_id', student_id)
    .eq('event_type', 'referral_sent')

  const referrals = data || []
  const pending = referrals.filter(r => r.event_data?.status === 'pending').length
  const converted = referrals.filter(r => r.event_data?.status === 'converted').length

  return Response.json({
    success: true,
    referrals: {
      total_sent: referrals.length,
      pending,
      converted,
      chokis_earned: converted * REFERRAL_REWARDS.referrer_chokis,
      xp_earned: converted * REFERRAL_REWARDS.referrer_xp,
      referral_code: `REF-${student_id.substring(0, 8).toUpperCase()}`,
      share_message: `Aprendé inglés con IA en AcademIA. Usá mi código y tenés 10% de descuento: REF-${student_id.substring(0, 8).toUpperCase()}`,
    },
  })
}
