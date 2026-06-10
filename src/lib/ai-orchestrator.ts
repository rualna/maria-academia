import OpenAI from 'openai'
import { supabaseAdmin } from './supabase-admin'

// ============================================================
// 115 — STUDENT CONTEXT ENGINE (enhanced)
// 116 — AI ORCHESTRATION
// 117 — MODEL ROUTING
// 118 — AI COST TRACKING
// 119 — AI CACHING
// 120 — AI FALLBACK SYSTEM
// ============================================================

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ── 117 — MODEL ROUTING ──
// Usa el modelo correcto según la complejidad de la tarea
// Objetivo: máxima calidad al menor costo posible
export type TaskComplexity = 'simple' | 'medium' | 'complex'

export const MODEL_ROUTER: Record<TaskComplexity, { model: string; cost_per_1k: number }> = {
  simple:  { model: 'gpt-4.1-nano',  cost_per_1k: 0.0001 },  // clasificaciones, fill-blank simple
  medium:  { model: 'gpt-4.1-mini',  cost_per_1k: 0.0004 },  // chat, evaluaciones, misiones
  complex: { model: 'gpt-4.1',       cost_per_1k: 0.002  },  // examen mensual, plan de estudio
}

export function routeModel(task: string): string {
  const simpleTasks = ['gamification', 'badge_check', 'streak_update', 'simple_correction']
  const complexTasks = ['monthly_exam', 'quarterly_exam', 'graduation_exam', 'study_planner']

  if (simpleTasks.some(t => task.includes(t))) return MODEL_ROUTER.simple.model
  if (complexTasks.some(t => task.includes(t))) return MODEL_ROUTER.complex.model
  return MODEL_ROUTER.medium.model // default para chat y speaking
}

// ── 118 — AI COST TRACKING ──
// Registra el costo de cada llamada a la IA por estudiante
export async function trackAICost(params: {
  student_id: string
  task: string
  model: string
  input_tokens: number
  output_tokens: number
}) {
  const { model, input_tokens, output_tokens, task, student_id } = params

  const costs: Record<string, { input: number; output: number }> = {
    'gpt-4.1-nano': { input: 0.0001, output: 0.0004 },
    'gpt-4.1-mini': { input: 0.0004, output: 0.0016 },
    'gpt-4.1':      { input: 0.002,  output: 0.008  },
    'whisper-1':    { input: 0.006,  output: 0 },       // por minuto
  }

  const modelCost = costs[model] || costs['gpt-4.1-mini']
  const total_cost_usd =
    (input_tokens / 1000) * modelCost.input +
    (output_tokens / 1000) * modelCost.output

  try {
    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'ai_cost',
      level: null,
      module_name: task,
      lesson_id: null,
      skill: 'ai_infrastructure',
      score: null,
      event_data: {
        model,
        task,
        input_tokens,
        output_tokens,
        total_cost_usd: Math.round(total_cost_usd * 100000) / 100000,
        recorded_at: new Date().toISOString(),
      },
    }])
  } catch (_) { /* silencioso */ }
}

// ── 119 — AI CACHING ──
// Cachea respuestas similares para evitar llamadas redundantes
// Clave: hash del prompt (simplificado — en producción usar Redis)
const memoryCache = new Map<string, { response: string; created_at: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutos

function getCacheKey(prompt: string): string {
  // Hash simple basado en las primeras 100 chars
  return prompt.substring(0, 100).replace(/\s+/g, '_').toLowerCase()
}

export function getFromCache(prompt: string): string | null {
  const key = getCacheKey(prompt)
  const cached = memoryCache.get(key)

  if (!cached) return null
  if (Date.now() - cached.created_at > CACHE_TTL_MS) {
    memoryCache.delete(key)
    return null
  }
  return cached.response
}

export function saveToCache(prompt: string, response: string) {
  const key = getCacheKey(prompt)
  memoryCache.set(key, { response, created_at: Date.now() })

  // Limpiar cache si crece mucho (max 100 entradas)
  if (memoryCache.size > 100) {
    const firstKey = memoryCache.keys().next().value
    if (firstKey) memoryCache.delete(firstKey)
  }
}

// ── 120 — AI FALLBACK SYSTEM ──
// Si el modelo principal falla, intenta con el siguiente
export async function callWithFallback(params: {
  messages: any[]
  task: string
  student_id: string
  response_format?: any
  prefer_cache?: boolean
}): Promise<{ content: string; model_used: string; from_cache: boolean }> {
  const { messages, task, student_id, response_format, prefer_cache = true } = params

  const systemContent = messages.find(m => m.role === 'system')?.content || ''

  // 119 — Verificar cache primero
  if (prefer_cache) {
    const cached = getFromCache(systemContent)
    if (cached) {
      return { content: cached, model_used: 'cache', from_cache: true }
    }
  }

  // 117 — Seleccionar modelo correcto
  const primaryModel = routeModel(task)
  const fallbackModel = MODEL_ROUTER.medium.model

  // 116 — Orquestar llamada con fallback
  const modelsToTry = [primaryModel, fallbackModel].filter((m, i, arr) => arr.indexOf(m) === i)

  let lastError: any = null
  for (const model of modelsToTry) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages,
        ...(response_format ? { response_format } : {}),
      })

      const content = completion.choices[0].message.content || ''

      // 118 — Registrar costo (silencioso)
      try {
        await trackAICost({
          student_id,
          task,
          model,
          input_tokens: completion.usage?.prompt_tokens || 0,
          output_tokens: completion.usage?.completion_tokens || 0,
        })
      } catch (_) { /* silencioso */ }

      // 119 — Guardar en cache
      if (prefer_cache) saveToCache(systemContent, content)

      return { content, model_used: model, from_cache: false }

    } catch (error: any) {
      lastError = error
      console.error(`Model ${model} failed for task ${task}:`, error.message)
      continue
    }
  }

  throw new Error(`All models failed for task ${task}: ${lastError?.message}`)
}

// ── GET costo total de IA por estudiante ──
export async function getStudentAICosts(studentId: string): Promise<{
  total_usd: number
  by_task: Record<string, number>
  sessions: number
}> {
  const { data } = await supabaseAdmin
    .from('student_events')
    .select('event_data')
    .eq('student_id', studentId)
    .eq('event_type', 'ai_cost')

  if (!data || data.length === 0) {
    return { total_usd: 0, by_task: {}, sessions: 0 }
  }

  const byTask: Record<string, number> = {}
  let total = 0

  for (const d of data) {
    const cost = d.event_data?.total_cost_usd || 0
    const task = d.event_data?.task || 'unknown'
    total += cost
    byTask[task] = (byTask[task] || 0) + cost
  }

  return {
    total_usd: Math.round(total * 100000) / 100000,
    by_task: byTask,
    sessions: data.length,
  }
}
