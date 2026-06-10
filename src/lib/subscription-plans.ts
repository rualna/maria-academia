// ============================================================
// 131 — SUBSCRIPTION SYSTEM
// 134 — FAMILY PLANS
// 135 — CORPORATE PLANS
// ============================================================

export type PlanType = 'intensivo' | 'semi' | 'flex' | 'family' | 'corporate'

export type Plan = {
  id: PlanType
  name: string
  price_monthly_usd: number
  price_monthly_crc: number
  hours_per_week: number
  months_to_c1: number
  features: string[]
  max_users: number
  badge_color: string
  popular: boolean
}

// NOTA: Stripe en stand by — activar cuando haya sociedad + cuenta bancaria
// NOTA: Pagos actuales = manual (transferencia / SINPE)

export const PLANS: Record<PlanType, Plan> = {
  // BASE — todo sobre este plan
  intensivo: {
    id: 'intensivo',
    name: 'Plan Intensivo',
    price_monthly_usd: 49,
    price_monthly_crc: 25000,
    hours_per_week: 10,
    months_to_c1: 15,
    features: [
      'María Chat ilimitada',
      'Speaking diario ilimitado',
      'Exámenes mensuales',
      'Evaluación trimestral',
      'Plan de estudio IA personalizado',
      'Acceso completo A1 → C1',
    ],
    max_users: 1,
    badge_color: '#10B981',
    popular: true,
  },
  // FAMILIAR — mismo plan Intensivo, 4 personas, 20% descuento por persona
  family: {
    id: 'family',
    name: 'Plan Familiar',
    price_monthly_usd: 120, // $30/persona × 4 (39% desc sobre $49)
    price_monthly_crc: 62000,
    hours_per_week: 10,
    months_to_c1: 15,
    features: [
      'Todo lo del Plan Intensivo para cada integrante',
      'Hasta 4 personas (familia)',
      '$30/persona/mes — ahorrás $19 por persona vs individual',
      'Dashboard familiar — ves el progreso de todos',
    ],
    max_users: 4,
    badge_color: '#F59E0B',
    popular: false,
  },
  corporate: {
    id: 'corporate',
    name: 'Plan Corporativo',
    price_monthly_usd: 350, // $35/persona × 10 (29% desc sobre $49)
    price_monthly_crc: 181000,
    hours_per_week: 10,
    months_to_c1: 15,
    features: [
      'Todo lo del Plan Intensivo para cada empleado',
      'Hasta 10 empleados',
      '$35/persona/mes — ahorrás $14 por persona vs individual',
      'Dashboard de empresa con progreso del equipo',
      'Reporte mensual para RRHH',
      'Factura electrónica empresarial',
      'Soporte prioritario',
    ],
    max_users: 10,
    badge_color: '#EF4444',
    popular: false,
  },
  // Mantenidos para compatibilidad del tipo
  semi: {
    id: 'semi',
    name: 'Plan Semi-Intensivo',
    price_monthly_usd: 49,
    price_monthly_crc: 25000,
    hours_per_week: 10,
    months_to_c1: 15,
    features: ['Igual al Intensivo — un solo plan base'],
    max_users: 1,
    badge_color: '#10B981',
    popular: false,
  },
  flex: {
    id: 'flex',
    name: 'Plan Flex',
    price_monthly_usd: 49,
    price_monthly_crc: 25000,
    hours_per_week: 10,
    months_to_c1: 15,
    features: ['Igual al Intensivo — un solo plan base'],
    max_users: 1,
    badge_color: '#10B981',
    popular: false,
  },
}

export function getPlan(planId: PlanType): Plan {
  return PLANS[planId] || PLANS.intensivo
}

export function getAllPlans(): Plan[] {
  return Object.values(PLANS)
}

export function getPricePerUser(plan: Plan): number {
  return Math.round(plan.price_monthly_usd / plan.max_users * 100) / 100
}
