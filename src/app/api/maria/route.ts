import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const student_id = body.student_id
    const message = body.message

    // buscar estudiante
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', student_id)
      .single()

    // buscar eventos recientes
    const { data: recent_events } = await supabase
      .from('student_events')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .limit(5)

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: `
You are Maria, an English AI tutor.

Student name: ${student?.full_name}
Level: ${student?.current_level}

Recent activity:
${JSON.stringify(recent_events)}

Be friendly.
Correct gently.
Keep answers short.
`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
    })

    const reply = completion.choices[0].message.content

    // guardar evento
    await supabase.from('student_events').insert([
      {
        student_id,
        event_type: 'ai_response',
        level: student?.current_level,
        module_name: 'Maria AI',
        lesson_id: null,
        skill: 'speaking',
        score: null,
        event_data: {
          user_message: message,
          ai_response: reply,
        },
      },
    ])

    return Response.json({
      success: true,
      reply,
    })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      }
    )
  }
}