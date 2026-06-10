// ============================================================
// 111 — PROMPT MANAGEMENT SYSTEM
// 112 — PROMPT VERSIONING
// ============================================================
// Los prompts son el corazón de María.
// Versionarlos permite mejorar sin romper, y medir qué versión
// produce mejores resultados de aprendizaje.
// ============================================================

export type PromptVersion = {
  id: string
  version: string
  component: string       // 'chat' | 'speaking_eval' | 'monthly_exam' | 'daily_mission'
  content: string
  active: boolean
  created_at: string
  performance_score?: number  // promedio de scores de estudiantes con este prompt
  notes: string
}

// ── REGISTRO DE VERSIONES ACTIVAS ──
export const PROMPT_REGISTRY: Record<string, PromptVersion> = {
  chat_v1: {
    id: 'chat_v1',
    version: '1.0',
    component: 'chat',
    content: 'Base prompt — restricción temática + tono pedagógico',
    active: false,
    created_at: '2026-05-01',
    notes: 'Primera versión sin restricción temática real',
  },
  chat_v2: {
    id: 'chat_v2',
    version: '2.0',
    component: 'chat',
    content: 'Restricción por semana + tono por retention state + language engine',
    active: true,
    created_at: '2026-06-01',
    performance_score: 7.8,
    notes: 'Versión actual — incluye Bloque 3 retention + Bloque 4 language OS',
  },
  speaking_eval_v1: {
    id: 'speaking_eval_v1',
    version: '1.0',
    component: 'speaking_eval',
    content: 'Evaluación básica gramática/fluidez/pronunciación',
    active: false,
    created_at: '2026-05-01',
    notes: 'Sin ruta de pronunciación por nivel',
  },
  speaking_eval_v2: {
    id: 'speaking_eval_v2',
    version: '2.0',
    component: 'speaking_eval',
    content: 'Evaluación con ruta de pronunciación por nivel + tolerancia adaptativa',
    active: true,
    created_at: '2026-06-01',
    performance_score: 8.1,
    notes: 'Versión actual — incluye pronunciation roadmap A1-C1',
  },
  daily_mission_v1: {
    id: 'daily_mission_v1',
    version: '1.0',
    component: 'daily_mission',
    content: 'Misión diaria estática por semana',
    active: false,
    created_at: '2026-05-15',
    notes: 'Sin adaptación por debilidades o retention state',
  },
  daily_mission_v2: {
    id: 'daily_mission_v2',
    version: '2.0',
    component: 'daily_mission',
    content: 'Misión adaptativa según debilidades + retention + stamina',
    active: true,
    created_at: '2026-06-01',
    performance_score: 8.4,
    notes: 'Versión actual — fully adaptive',
  },
}

// Obtener prompt activo para un componente
export function getActivePrompt(component: string): PromptVersion | null {
  return Object.values(PROMPT_REGISTRY).find(p => p.component === component && p.active) || null
}

// Obtener historial de versiones de un componente
export function getPromptHistory(component: string): PromptVersion[] {
  return Object.values(PROMPT_REGISTRY)
    .filter(p => p.component === component)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
}

// Registrar performance de un prompt (para 127 — AI optimization loops)
export function recordPromptPerformance(promptId: string, score: number) {
  if (PROMPT_REGISTRY[promptId]) {
    const current = PROMPT_REGISTRY[promptId].performance_score || 0
    const count = 10 // simplificado — en producción se guarda en DB
    PROMPT_REGISTRY[promptId].performance_score =
      Math.round(((current * count + score) / (count + 1)) * 10) / 10
  }
}

// Metadata del sistema de prompts
export function getPromptSystemStatus() {
  const components = ['chat', 'speaking_eval', 'daily_mission', 'monthly_exam']
  return components.map(c => {
    const active = getActivePrompt(c)
    const history = getPromptHistory(c)
    return {
      component: c,
      active_version: active?.version || 'none',
      active_score: active?.performance_score || null,
      total_versions: history.length,
      last_updated: active?.created_at || null,
    }
  })
}
