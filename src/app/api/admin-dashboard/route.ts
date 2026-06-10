import { supabaseAdmin } from '@/lib/supabase-admin'
import { clusterErrors, getLearningAnalytics, getSpeakingAnalytics, getRetentionAnalytics, getCohortAnalysis, forecastProgress } from '@/lib/analytics-engine'
import { getStudentAICosts } from '@/lib/ai-orchestrator'
import { getPromptSystemStatus } from '@/lib/prompt-manager'

// ============================================================
// 127 — AI OPTIMIZATION LOOPS
// 128 — AUTOMATED EXPERIMENTATION
// 129 — HEATMAPS & DASHBOARDS
// 130 — INTERNAL AI BENCHMARKING
// ============================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'full'
  const student_id = searchParams.get('student_id')

  // ── 129 — DASHBOARD CENTRAL ──
  if (view === 'full' || view === 'overview') {
    const [retention, cohorts, errors, learning, promptStatus] = await Promise.all([
      getRetentionAnalytics(),
      getCohortAnalysis(),
      clusterErrors(),
      getLearningAnalytics(),
      Promise.resolve(getPromptSystemStatus()),
    ])

    return Response.json({
      success: true,
      dashboard: {
        // Métricas de retención en tiempo real
        retention,
        // Análisis de cohortes
        cohorts,
        // 121 — Error clustering LATAM
        error_clustering: errors,
        // 122 — Learning analytics
        learning_analytics: learning,
        // 111/112 — Prompt system status
        prompt_system: promptStatus,
        generated_at: new Date().toISOString(),
      },
    })
  }

  // ── Vista de estudiante individual ──
  if (view === 'student' && student_id) {
    const [speaking, costs, forecast] = await Promise.all([
      getSpeakingAnalytics(student_id),
      getStudentAICosts(student_id),
      forecastProgress(student_id),
    ])

    return Response.json({
      success: true,
      student_analytics: {
        speaking,       // 123
        ai_costs: costs, // 118
        forecast,       // 126
      },
    })
  }

  return Response.json({ success: false, error: 'Invalid view' }, { status: 400 })
}

// POST — 127/128 — AI optimization loops + automated experimentation
export async function POST(request: Request) {
  const { action, data } = await request.json()

  // ── 127 — AI OPTIMIZATION LOOPS ──
  if (action === 'record_prompt_performance') {
    // Registra qué prompt generó qué resultado para optimizar automáticamente
    const { prompt_id, student_id, outcome_score, session_type } = data

    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'prompt_performance',
      level: null,
      module_name: 'AI Optimization',
      lesson_id: null,
      skill: 'ai_infrastructure',
      score: outcome_score,
      event_data: {
        prompt_id,
        session_type,
        outcome_score,
        recorded_at: new Date().toISOString(),
      },
    }])

    return Response.json({ success: true, message: 'Performance recorded for optimization loop' })
  }

  // ── 128 — AUTOMATED EXPERIMENTATION ──
  if (action === 'assign_experiment') {
    // A/B test: asigna al estudiante a grupo A o B
    const { student_id, experiment_id } = data

    // Asignación aleatoria balanceada
    const { data: existing } = await supabaseAdmin
      .from('student_events')
      .select('event_data')
      .eq('student_id', student_id)
      .eq('event_type', 'experiment_assignment')
      .contains('event_data', { experiment_id })
      .limit(1)
      .single()

    if (existing) {
      return Response.json({ success: true, group: existing.event_data.group, cached: true })
    }

    const group = Math.random() > 0.5 ? 'A' : 'B'

    await supabaseAdmin.from('student_events').insert([{
      student_id,
      event_type: 'experiment_assignment',
      level: null,
      module_name: 'Experimentation',
      lesson_id: null,
      skill: 'ai_infrastructure',
      score: null,
      event_data: { experiment_id, group, assigned_at: new Date().toISOString() },
    }])

    return Response.json({ success: true, group, experiment_id })
  }

  // ── 130 — INTERNAL AI BENCHMARKING ──
  if (action === 'run_benchmark') {
    // Evalúa la calidad de las respuestas de María en los últimos 7 días
    const { data: recentResponses } = await supabaseAdmin
      .from('student_events')
      .select('event_data, created_at')
      .eq('event_type', 'ai_response')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .limit(50)

    const { data: recentSpeaking } = await supabaseAdmin
      .from('student_speaking_attempts')
      .select('score')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

    const avgSpeakingScore = recentSpeaking && recentSpeaking.length > 0
      ? recentSpeaking.reduce((s, a) => s + (a.score || 0), 0) / recentSpeaking.length
      : 0

    const benchmark = {
      period: 'last_7_days',
      total_chat_interactions: recentResponses?.length || 0,
      total_speaking_evaluations: recentSpeaking?.length || 0,
      avg_speaking_score: Math.round(avgSpeakingScore * 10) / 10,
      maria_effectiveness: avgSpeakingScore >= 7 ? 'excellent' : avgSpeakingScore >= 5 ? 'good' : 'needs_improvement',
      benchmark_score: Math.round(avgSpeakingScore * 10),
      recommendation: avgSpeakingScore >= 7
        ? 'María está funcionando bien. Mantener prompts actuales.'
        : 'Considerar actualizar prompts de speaking evaluation.',
      generated_at: new Date().toISOString(),
    }

    return Response.json({ success: true, benchmark })
  }

  return Response.json({ success: false, error: 'Invalid action' }, { status: 400 })
}
