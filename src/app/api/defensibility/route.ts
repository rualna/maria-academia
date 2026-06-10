import { supabaseAdmin } from '@/lib/supabase-admin'
import { calculateAcademiaScore, calculateMastery } from '@/lib/proprietary-score'
import { getDatasetInsights, recordDatasetEntry } from '@/lib/latam-dataset'
import { getAcquisitionProfile } from '@/lib/acquisition-engine'

// ============================================================
// API central del Bloque 8 — Defensibility
// Expone todo lo que hace imposible copiar a AcademIA
// ============================================================

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view') || 'overview'
  const student_id = searchParams.get('student_id')

  // Dataset insights LATAM (168)
  if (view === 'dataset') {
    const insights = await getDatasetInsights()
    return Response.json({ success: true, latam_dataset: insights })
  }

  // Perfil de adquisición del estudiante (169+170)
  if (view === 'acquisition' && student_id) {
    const profile = await getAcquisitionProfile(student_id)
    return Response.json({ success: true, acquisition_profile: profile })
  }

  // Mastery del estudiante (167)
  if (view === 'mastery' && student_id) {
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('current_level')
      .eq('id', student_id)
      .single()

    const { data: speaking } = await supabaseAdmin
      .from('student_speaking_attempts')
      .select('score')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .limit(10)

    const { data: profile } = await supabaseAdmin
      .from('student_behavioral_profile')
      .select('weak_topics')
      .eq('student_id', student_id)
      .single()

    const mastery = calculateMastery({
      student_level: student?.current_level || 'A1',
      recent_scores: speaking?.map(s => s.score || 0) || [],
      total_sessions: speaking?.length || 0,
      weak_topics: profile?.weak_topics || [],
    })

    return Response.json({ success: true, mastery })
  }

  // Overview completo del sistema defensible
  if (view === 'overview') {
    const [datasetInsights] = await Promise.all([
      getDatasetInsights(),
    ])

    return Response.json({
      success: true,
      defensibility_status: {
        '166_proprietary_score': {
          status: 'active',
          description: 'Score propio calibrado para LATAM — no GPT genérico',
          calibration_version: 'v1.0-latam',
          data_points: datasetInsights.total_data_points,
        },
        '167_mastery_system': {
          status: 'active',
          description: 'Mastery multidimensional — consistencia + score + debilidades',
          dimensions: ['speaking_score', 'consistency', 'no_weak_topics', 'sufficient_practice'],
        },
        '168_latam_dataset': {
          status: 'growing',
          total_data_points: datasetInsights.total_data_points,
          top_errors: datasetInsights.top_error_patterns,
          note: datasetInsights.dataset_note,
        },
        '169_behavioral_engine': {
          status: 'active',
          tracks: ['best_hour', 'learning_velocity', 'engagement_triggers', 'disengagement_signals'],
        },
        '170_acquisition_engine': {
          status: 'active',
          stages: ['silent_period', 'early_production', 'speech_emergence', 'intermediate_fluency', 'advanced_fluency'],
          latam_calibrated: true,
        },
      },
      competitive_moat: [
        'Dataset de errores de hispanohablantes LATAM — crece con cada estudiante',
        'Score calibrado específicamente para LATAM — no genérico',
        'Modelo de mastery que considera consistencia, no solo promedio',
        'Perfil conductual individual que mejora la personalización',
        'Motor de adquisición basado en cómo LATAM aprende inglés — no teoría general',
      ],
    })
  }

  return Response.json({ success: false, error: 'Invalid view' }, { status: 400 })
}

// POST — registrar punto de dato en el dataset (168)
export async function POST(request: Request) {
  const { student_id, speaking_score, academia_score, error_types, session_minutes, words } = await request.json()

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const { data: student } = await supabaseAdmin
    .from('students')
    .select('current_level')
    .eq('id', student_id)
    .single()

  await recordDatasetEntry({
    student_id,
    level: student?.current_level || 'A1',
    speaking_score: speaking_score || 0,
    academia_score: academia_score || 0,
    error_types: error_types || [],
    session_duration_minutes: session_minutes || 0,
    words_spoken: words || 0,
  })

  return Response.json({ success: true, recorded: true, dataset_growing: true })
}
