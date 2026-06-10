import OpenAI from 'openai'
import { supabaseAdmin } from '../../../lib/supabase-admin'
import { getPronunciationInstructions, getCommonErrors } from '../../../lib/pronunciation-roadmap'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { student_id, transcript } = body

    // 41 — Obtener nivel del estudiante para aplicar ruta de pronunciación correcta
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('current_level')
      .eq('id', student_id)
      .single()

    const level = student?.current_level || 'A1'
    const pronunciationInstructions = getPronunciationInstructions(level)
    const commonErrors = getCommonErrors(level)

    if (!student_id || !transcript) {
      return Response.json(
        { success: false, error: 'student_id and transcript are required' },
        { status: 400 }
      )
    }

    const wordCount = transcript.trim().split(/\s+/).length

    if (wordCount < 3) {
      return Response.json(
        { success: false, error: 'Please speak a little more.' },
        { status: 400 }
      )
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
content: `
You are Maria, an English speaking evaluator for Spanish-speaking students.
Student level: ${level}

PRONUNCIATION INSTRUCTIONS FOR THIS LEVEL:
${pronunciationInstructions}

COMMON ERRORS TO WATCH FOR AT ${level}:
${commonErrors.map(e => `- ${e}`).join('\n')}


Return ONLY valid JSON with this exact structure:
{
  "score": 0,
  "grammar": "",
  "fluency": "",
  "pronunciation": "",
  "feedback": "",
  "corrected_version": ""
}

IMPORTANT:

- All feedback must be written in Spanish.
- Only corrected_version must remain in English.

Rules:

- Do NOT rewrite the student's idea.
- Preserve the original meaning.
- Only correct REAL grammar mistakes.
- Do NOT improve style unnecessarily.
- Do NOT make the sentence more advanced.
- If the sentence is understandable and acceptable, keep corrected_version VERY close to the original.
- Prioritize communication over perfection.
- Be tolerant with minor imperfections.
- Do NOT punish small mistakes too aggressively.
- The goal is helping students communicate confidently, not sounding perfect.
- Avoid changing vocabulary unless truly necessary.
- Avoid changing sentence structure unless truly necessary.

Scoring rules:

- 9-10 = clear, natural, very minor or no mistakes
- 7-8 = understandable with small grammar mistakes
- 5-6 = multiple mistakes but still understandable
- 3-4 = difficult to understand
- 0-2 = almost impossible to understand

IMPORTANT SCORING RULE:
If the student's message is fully understandable and communication is successful, the minimum score should usually be 7 or higher.

Do NOT heavily punish:
- small grammar mistakes
- awkward phrasing
- word order issues
if the meaning is still clear.

Reserve low scores only for sentences that are genuinely hard to understand.

Do NOT give low scores for small mistakes if the message is understandable.

Communication is more important than perfection.

Pronunciation:

- Evaluate pronunciation softly based on transcription clarity.
- If the transcription is clear and coherent, assume acceptable pronunciation.
- Do NOT mention limitations about pronunciation evaluation.
- Only mention pronunciation problems if the sentence is difficult to understand.

Feedback style:

- Be encouraging.
- Be concise.
- Be helpful.
- Do NOT sound robotic.
- Do NOT overcorrect.
- Do NOT rewrite like a native English editor.

The corrected_version must stay as close as possible to the student's
 original sentence.
 `
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
    })

    const raw = completion.choices[0].message.content || '{}'
    const feedback = JSON.parse(raw)

    const { error: attemptError } = await supabaseAdmin
      .from('student_speaking_attempts')
      .insert([
        {
          student_id,
          transcript,
          mission_id: null,
          score: feedback.score,
          feedback,
          audio_url: null,
        },
      ])

    if (attemptError) {
      return Response.json(
        { success: false, error: attemptError.message },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      feedback,
    })
  } catch (error: any) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}