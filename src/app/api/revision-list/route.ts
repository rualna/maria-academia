import { supabaseAdmin } from '@/lib/supabase-admin'
import { buildRevisionList } from '@/lib/spaced-repetition'
import { getSkillTreeStatus } from '@/lib/skill-tree'

// GET /api/revision-list?student_id=xxx
// Devuelve: qué lecciones repasar hoy + estado del skill tree
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json({ success: false, error: 'student_id required' }, { status: 400 })
  }

  // Lecciones completadas del estudiante
  const { data: completed } = await supabaseAdmin
    .from('student_lesson_progress')
    .select('lesson_id')
    .eq('student_id', student_id)
    .eq('completed', true)

  const completedIds = (completed || []).map((l: any) => l.lesson_id)

  // Lista de revisión (48 + 49)
  const revisionList = await buildRevisionList(student_id, supabaseAdmin)

  // Estado del skill tree (38)
  const skillTreeStatus = getSkillTreeStatus(completedIds)

  const urgent = revisionList.filter(r => r.priority === 'urgent')
  const soon = revisionList.filter(r => r.priority === 'soon')

  return Response.json({
    success: true,
    revision: {
      urgent,
      soon,
      total_to_review: revisionList.length,
      has_urgent: urgent.length > 0,
    },
    skill_tree: skillTreeStatus,
    completed_lessons: completedIds.length,
    total_lessons: skillTreeStatus.length,
  })
}
