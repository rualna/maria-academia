import { supabaseAdmin } from '@/lib/supabase-admin'

function calculateStreak(attempts: any[]) {
  if (!attempts.length) return 0

  const uniqueDays = [
    ...new Set(
      attempts.map((item) =>
        new Date(item.created_at)
          .toISOString()
          .split('T')[0]
      )
    ),
  ]

  let streak = 0
  let currentDate = new Date()

  for (let i = 0; i < uniqueDays.length; i++) {
    const dateString = currentDate
      .toISOString()
      .split('T')[0]

    if (uniqueDays.includes(dateString)) {
      streak++
      currentDate.setDate(currentDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const student_id = searchParams.get('student_id')

  if (!student_id) {
    return Response.json(
      {
        success: false,
        error: 'student_id is required',
      },
      { status: 400 }
    )
  }

  const { data, error } = await supabaseAdmin
    .from('student_speaking_attempts')
    .select('*')
    .eq('student_id', student_id)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }

  const totalAttempts = data.length

  const scores = data.map(
    (item) => item.score || 0
  )

  const averageScore =
    totalAttempts > 0
      ? Math.round(
          scores.reduce((a, b) => a + b, 0) /
            totalAttempts
        )
      : 0

  const bestScore =
    scores.length > 0
      ? Math.max(...scores)
      : 0

  const lastAttempt = data[0] || null

  const streak = calculateStreak(data)

  return Response.json({
    success: true,
    progress: {
      total_attempts: totalAttempts,
      average_score: averageScore,
      best_score: bestScore,
      last_attempt: lastAttempt,
      streak,
    },
  })
}