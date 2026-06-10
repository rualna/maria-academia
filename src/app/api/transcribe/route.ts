import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return Response.json(
        { success: false, error: 'No audio file' },
        { status: 400 }
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en', // programa de inglés: forzar inglés, no auto-detectar (ej. español por acento hispano)
    })

    return Response.json({
      success: true,
      transcript: transcription.text,
    })
  } catch (error: any) {
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    )
  }
}