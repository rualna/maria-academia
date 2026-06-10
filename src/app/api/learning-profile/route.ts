import { supabaseAdmin } from '@/lib/supabase-admin'
import { evaluateLearningProfile, getLearningAdaptations } from '@/lib/learning-profiles'

// GET — obtener perfil actual del estudiante
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')
  const force = searchParams.get('force') === 'true'

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const adaptations = force
    ? await evaluateLearningProfile(student_id)
    : await getLearningAdaptations(student_id)

  // También devolver los datos raw del perfil para el admin
  const { data: raw } = await supabaseAdmin
    .from('student_learning_profile')
    .select('*')
    .eq('student_id', student_id)
    .single()

  return Response.json({
    success: true,
    adaptations,
    raw_profile: raw || null,
    profiles_active: {
      dislexia:         adaptations.reading_support_mode,
      tdah:             adaptations.short_session_mode,
      auditivo:         adaptations.audio_support_mode,
      ansiedad_speaking: adaptations.low_stakes_speaking_mode,
    },
    confidence: adaptations.profile_confidence,
    note: 'Los perfiles nunca se comunican al estudiante. María adapta su comportamiento en silencio.',
  })
}

// POST — forzar re-evaluación (admin only)
export async function POST(request: Request) {
  const { student_id } = await request.json()

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  const adaptations = await evaluateLearningProfile(student_id)

  return Response.json({
    success: true,
    message: 'Perfil re-evaluado',
    adaptations,
  })
}
