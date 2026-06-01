'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'

export default function SpeakingPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [mission, setMission] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)
  const [feedback, setFeedback] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')

  const mediaRecorderRef = useRef<any>(null)
  const chunksRef = useRef<any[]>([])

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        window.location.href = '/login'
        return
      }

      setStudentId(data.user.id)
      loadMission()
      loadProgress(data.user.id)
    }

    init()
  }, [])

  async function loadMission() {
    const res = await fetch('/api/missions')
    const data = await res.json()

    if (data.success) {
      setMission(data.mission)
    }
  }

  async function loadProgress(id: string) {
    const res = await fetch(`/api/speaking-progress?student_id=${id}`)
    const data = await res.json()

    if (data.success) {
      setProgress(data.progress)
    }
  }

  async function startRecording() {
    if (!studentId) return

    setFeedback(null)

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

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })

      const transcribeData = await transcribeRes.json()

      if (!transcribeData.success) {
        setLoading(false)
        return
      }

      const feedbackRes = await fetch('/api/speaking-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          transcript: transcribeData.transcript,
        }),
      })

      const feedbackData = await feedbackRes.json()

      if (feedbackData.success) {
        setFeedback(feedbackData.feedback)
        await loadProgress(studentId)
      }

      setLoading(false)
    }

    recorder.start()
    setLoading(false)
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop()
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-slate-900 rounded-2xl p-6 border border-slate-700">
        <div className="flex justify-between mb-6">
          <a href="/" className="text-emerald-400 underline">
            María Chat
          </a>

          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="bg-red-500 text-white font-bold px-4 py-2 rounded-xl"
          >
            Cerrar sesión
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          María Speaking
        </h1>

        <p className="text-slate-300 mb-6">
          Practica hablando. María evaluará tu speaking.
        </p>

        {mission && (
          <div className="bg-emerald-500 text-slate-950 p-4 rounded-xl mb-6">
            <p className="font-bold text-lg">
              🎯 Misión: {mission.title}
            </p>
            <p>{mission.description}</p>
          </div>
        )}

        {progress && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-sm">Prácticas</p>
              <p className="text-2xl font-bold">{progress.total_attempts}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-sm">Promedio</p>
              <p className="text-2xl font-bold">{progress.average_score}/10</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-sm">Mejor</p>
              <p className="text-2xl font-bold">{progress.best_score}/10</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-sm">Racha</p>
              <p className="text-2xl font-bold">{progress.streak || 0}</p>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <p className="text-slate-400 text-sm">Última</p>
              <p className="text-sm font-semibold">
                {progress.last_attempt
                  ? new Date(progress.last_attempt.created_at).toLocaleDateString()
                  : 'Sin actividad'}
              </p>
            </div>
          </div>
        )}

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-6 text-center">
          <p className="text-slate-300 mb-4">
            Mantén presionado, habla en inglés y suelta para enviar.
          </p>

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            disabled={loading}
            className="bg-purple-500 hover:bg-purple-400 text-white text-xl font-bold px-8 py-5 rounded-2xl"
          >
            {loading ? 'Evaluando...' : '🎤 Mantener para hablar'}
          </button>
        </div>

        {feedback && (
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
            <div>
              <p className="text-slate-400 text-sm">Score</p>
              <p className="text-4xl font-bold text-emerald-400">
                {feedback.score}/10
              </p>
            </div>

            <div>
              <p className="font-bold">Gramática</p>
              <p>{feedback.grammar}</p>
            </div>

            <div>
              <p className="font-bold">Fluidez</p>
              <p>{feedback.fluency}</p>
            </div>

            <div>
              <p className="font-bold">Pronunciación</p>
              <p>{feedback.pronunciation}</p>
            </div>

            <div>
              <p className="font-bold">Feedback</p>
              <p>{feedback.feedback}</p>
            </div>

            <div>
              <p className="font-bold">Versión corregida</p>
              <p className="text-emerald-300">
                {feedback.corrected_version}
              </p>
            </div>

            <button
              onClick={() => setFeedback(null)}
              className="bg-emerald-500 text-slate-950 font-bold px-4 py-3 rounded-xl"
            >
              🔁 Repetir ejercicio
            </button>
          </div>
        )}

        {audioUrl && (
          <audio controls src={audioUrl} className="mt-4 w-full" />
        )}
      </div>
    </main>
  )
}