'use client'
import { supabase } from '@/lib/supabase'

import { useEffect, useRef, useState } from 'react'

type ChatMessage = {
  role: 'user' | 'maria'
  content: string
}

export default function Home() {
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [mission, setMission] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)

  const mediaRecorderRef = useRef<any>(null)
  const chunksRef = useRef<any[]>([])

  const [studentId, setStudentId] = useState<string | null>(null)

 useEffect(() => {
  async function initUser() {
    const { data } = await supabase.auth.getUser()

    if (!data.user) {
      window.location.href = '/login'
      return
    }
    setStudentId(data.user.id)
    await fetch('/api/create-student', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: data.user.id,
    email: data.user.email,
  }),
})
    loadHistory(data.user.id)
    loadMission()
    loadProgress(data.user.id)
  }

  initUser()
}, [])

  async function loadMission() {
    const res = await fetch('/api/missions')

    const data = await res.json()

    if (data.success) {
      setMission(data.mission)
    }
  }
 async function loadProgress(studentId: string) {
  const res = await fetch(
    `/api/speaking-progress?student_id=${studentId}`
  )

  const data = await res.json()

  if (data.success) {
    setProgress(data.progress)
  }
}

 async function loadHistory(studentId: string) {
    const res = await fetch(
       `/api/chat-history?student_id=${studentId}`
    )

    const data = await res.json()

    if (data.success) {
      const formatted = data.history.flatMap((item: any) => [
        {
          role: 'user',
          content: item.event_data?.user_message || '',
        },
        {
          role: 'maria',
          content: item.event_data?.ai_response || '',
        },
      ])

      setChat(formatted)
    }
  }

  function speak(text: string) {
    const utterance = new SpeechSynthesisUtterance(text)

    utterance.lang = 'en-US'
    utterance.rate = 0.9

    speechSynthesis.speak(utterance)
  }

  async function talkToMaria() {
    if (!(message || '').trim()) return
    if (!studentId) return

    const userMessage = message

    setChat((prev) => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
      },
    ])

    setMessage('')
    setLoading(true)

    const res = await fetch('/api/maria', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student_id: studentId,
        message: userMessage,
      }),
    })

    const data = await res.json()

    setChat((prev) => [
      ...prev,
      {
        role: 'maria',
        content: data.reply || 'María no respondió.',
      },
    ])

    setLoading(false)
  }

  async function startListening() {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert('Speech Recognition no soportado')
      return
    }

    const recognition = new SpeechRecognition()

    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setListening(true)
    }

    recognition.onend = () => {
      setListening(false)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript

      setMessage(transcript)
    }

    recognition.start()
  }

 async function startRecording() {
  if (!studentId) return

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const recorder = new MediaRecorder(stream)

  mediaRecorderRef.current = recorder
  chunksRef.current = []

  recorder.ondataavailable = (e) => {
    chunksRef.current.push(e.data)
  }

  recorder.onstop = async () => {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const url = URL.createObjectURL(blob)
    setAudioUrl(url)

    const formData = new FormData()
    formData.append('audio', blob, 'recording.webm')

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    })

    const transcribeText = await res.text()
console.log('TRANSCRIBE RAW:', transcribeText)

const data = JSON.parse(transcribeText)

    if (!data.success) return

    setChat((prev) => [
      ...prev,
      { role: 'user', content: data.transcript },
    ])

    setMessage('')

    const feedbackRes = await fetch('/api/speaking-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId,
        transcript: data.transcript,
      }),
    })

    const feedbackData = await feedbackRes.json()

    if (feedbackData.success) {
      setChat((prev) => [
        ...prev,
        {
          role: 'maria',
          content: `
Score: ${feedbackData.feedback.score}

Grammar: ${feedbackData.feedback.grammar}

Fluency: ${feedbackData.feedback.fluency}

Pronunciation: ${feedbackData.feedback.pronunciation}

Feedback:
${feedbackData.feedback.feedback}

Corrected:
${feedbackData.feedback.corrected_version}
          `,
        },
      ])

      await loadProgress(studentId)
    }
  }

  recorder.start()
}

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-4xl bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-700">
        <div className="flex justify-end mb-4">
  <button
    onClick={async () => {
      await supabase.auth.signOut()
      window.location.href = '/login'
    }}
    className="bg-red-500 hover:bg-red-400 text-white font-bold px-4 py-2 rounded-xl"
  >
    Cerrar sesión
  </button>
</div>
        <h1 className="text-3xl font-bold mb-2">
          María Tutor-IA
        </h1>

        <p className="text-slate-300 mb-6">
          Tu tutora IA oficial de Academ-IA
        </p>

        {mission && (
          <div className="bg-emerald-500 text-slate-950 p-4 rounded-xl mb-6">
            <p className="font-bold text-lg">
              🎯 Mission: {mission.title}
            </p>

            <p>{mission.description}</p>
          </div>
        )}
        {progress && (
 <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-slate-400 text-sm">Prácticas</p>
    <p className="text-2xl font-bold">
      {progress.total_attempts}
    </p>
  </div>

  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-slate-400 text-sm">Promedio</p>
    <p className="text-2xl font-bold">
      {progress.average_score}/10
    </p>
  </div>

  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-slate-400 text-sm">Mejor score</p>
    <p className="text-2xl font-bold">
      {progress.best_score}/10
    </p>
  </div>

  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-slate-400 text-sm">Racha</p>
    <p className="text-2xl font-bold">
      {progress.streak || 0}
    </p>
  </div>

  <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
    <p className="text-slate-400 text-sm">
      Última práctica
    </p>

    <p className="text-sm font-semibold">
      {progress.last_attempt
        ? new Date(
            progress.last_attempt.created_at
          ).toLocaleDateString()
        : 'Sin actividad'}
    </p>
  </div>
</div>
)}

        <div className="h-96 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-4 mb-4 space-y-4">
          {chat.length === 0 && (
            <p className="text-slate-500">
              Empieza hablando con María...
            </p>
          )}

          {chat.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-slate-950 ml-auto'
                  : 'bg-slate-800 text-white'
              }`}
            >
              <p className="font-bold mb-1">
                {msg.role === 'user' ? 'Tú' : 'María'}
              </p>

              <p className="whitespace-pre-line">
                {msg.content}
              </p>

              {msg.role === 'maria' && (
                <button
                  onClick={() => speak(msg.content)}
                  className="mt-3 text-sm bg-emerald-500 text-slate-950 font-bold px-3 py-2 rounded-lg"
                >
                  🔊 Escuchar a María
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="bg-slate-800 p-4 rounded-xl max-w-[85%]">
              María está pensando...
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <input
            className="flex-1 p-4 rounded-xl bg-slate-800 border border-slate-700 text-white"
            placeholder="Escribe tu mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') talkToMaria()
            }}
          />

          <button
            onClick={talkToMaria}
            disabled={loading || !(message || '').trim()}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 rounded-xl"
          >
            Enviar
          </button>

          <button
            onClick={startListening}
            className="bg-blue-500 hover:bg-blue-400 text-white font-bold px-6 rounded-xl"
          >
            {listening ? '🎤 Escuchando...' : '🎙️ Hablar'}
          </button>

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-6 rounded-xl"
          >
            🎤 Mantener
          </button>
        </div>

        {audioUrl && (
          <audio
            controls
            src={audioUrl}
            className="mt-4 w-full"
          />
        )}
      </div>
    </main>
  )
}