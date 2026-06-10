'use client'

import { supabase } from '@/lib/supabase'
import { useEffect, useRef, useState } from 'react'

type Phase = 'ready' | 'recording' | 'evaluating' | 'feedback' | 'complete'

export default function SpeakingPage() {
  const [studentId, setStudentId] = useState<string | null>(null)
  const [mission, setMission] = useState<any>(null)
  const [progress, setProgress] = useState<any>(null)

  // flujo guiado
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('ready')
  const [feedback, setFeedback] = useState<any>(null)
  const [attempts, setAttempts] = useState(0)

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
      loadMission(data.user.id)
      loadProgress(data.user.id)
    }

    init()
  }, [])

  async function loadMission(id: string) {
    const res = await fetch(`/api/missions?student_id=${id}`)
    const data = await res.json()
    if (data.success) setMission(data.mission)
  }

  async function loadProgress(id: string) {
    const res = await fetch(`/api/speaking-progress?student_id=${id}`)
    const data = await res.json()
    if (data.success) setProgress(data.progress)
  }

  async function startRecording() {
    if (!studentId || phase !== 'ready') return

    setFeedback(null)
    setPhase('recording')

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)

    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => chunksRef.current.push(e.data)

    recorder.onstop = async () => {
      setPhase('evaluating')

      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')

      const transcribeRes = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      })
      const transcribeData = await transcribeRes.json()

      if (!transcribeData.success) {
        setPhase('ready')
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
        setAttempts((prev) => prev + 1)
        await loadProgress(studentId)
      }

      setPhase('feedback')
    }

    recorder.start()
  }

  function stopRecording() {
    if (phase === 'recording') {
      mediaRecorderRef.current?.stop()
    }
  }

  function nextPhrase() {
    const phrases = mission?.phrases ?? []
    const nextIndex = phraseIndex + 1

    if (nextIndex >= phrases.length) {
      setPhase('complete')
    } else {
      setPhraseIndex(nextIndex)
      setFeedback(null)
      setAttempts(0)
      setPhase('ready')
    }
  }

  function retryPhrase() {
    setFeedback(null)
    setPhase('ready')
  }

  function restartSession() {
    setPhraseIndex(0)
    setFeedback(null)
    setAttempts(0)
    setPhase('ready')
  }

  const phrases: string[] = mission?.phrases ?? []
  const minScore: number = mission?.min_score ?? 7
  const currentPhrase = phrases[phraseIndex] ?? ''
  const passed = feedback && feedback.score >= minScore

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-slate-900 rounded-2xl p-6 border border-slate-700">

        {/* Header */}
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

        {/* María avatar */}
        <div className="flex items-center gap-4 mb-6">
          <img
            src="/mariaanimada.jpeg"
            alt="María"
            className="w-16 h-16 rounded-full object-cover border-2 border-purple-500 shadow-lg shadow-purple-500/20"
          />
          <div>
            <h1 className="text-3xl font-bold">María Speaking</h1>
            <p className="text-slate-300">Practica hablando. María evaluará tu speaking.</p>
          </div>
        </div>

        {/* Misión */}
        {mission && (
          <div className="bg-emerald-500 text-slate-950 p-4 rounded-xl mb-6">
            <p className="font-bold text-lg">🎯 Misión: {mission.title}</p>
            <p>{mission.description}</p>
          </div>
        )}

        {/* Progreso del estudiante */}
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

        {/* SESIÓN COMPLETA */}
        {phase === 'complete' && (
          <div className="bg-emerald-500 text-slate-950 rounded-xl p-8 text-center space-y-4">
            <p className="text-4xl">🎉</p>
            <p className="text-2xl font-bold">¡Sesión completada!</p>
            <p className="text-lg">Completaste las {phrases.length} frases de la misión.</p>
            <button
              onClick={restartSession}
              className="bg-slate-950 text-white font-bold px-6 py-3 rounded-xl"
            >
              🔁 Repetir sesión
            </button>
          </div>
        )}

        {/* FLUJO GUIADO */}
        {phase !== 'complete' && (
          <>
            {/* Progreso de frases */}
            {phrases.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                {phrases.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full ${
                      i < phraseIndex
                        ? 'bg-emerald-500'
                        : i === phraseIndex
                        ? 'bg-purple-500'
                        : 'bg-slate-700'
                    }`}
                  />
                ))}
                <span className="text-slate-400 text-sm ml-2 whitespace-nowrap">
                  {phraseIndex + 1}/{phrases.length}
                </span>
              </div>
            )}

            {/* Frase actual */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 mb-6 text-center">
              <p className="text-slate-400 text-sm mb-3">Di esta frase en inglés:</p>
              <p className="text-xl font-semibold text-white leading-relaxed">
                "{currentPhrase}"
              </p>
              {attempts > 0 && (
                <p className="text-slate-500 text-xs mt-3">
                  Intento #{attempts} · Score mínimo: {minScore}/10
                </p>
              )}
            </div>

            {/* Botón grabar — forma de micrófono */}
            {(phase === 'ready' || phase === 'recording') && (
              <div className="flex flex-col items-center mb-6 gap-4">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                  disabled={phase === 'evaluating'}
                  className={`relative flex flex-col items-center transition-all select-none ${
                    phase === 'recording' ? 'scale-110' : 'hover:scale-105'
                  }`}
                >
                  {/* Cuerpo del micrófono */}
                  <div className={`w-16 h-24 rounded-t-full rounded-b-full flex items-center justify-center shadow-lg transition-all ${
                    phase === 'recording'
                      ? 'bg-red-500 shadow-red-500/50 shadow-2xl'
                      : 'bg-purple-500 shadow-purple-500/30'
                  }`}>
                    {/* Líneas decorativas del mic */}
                    <div className="flex flex-col gap-1.5">
                      <div className="w-6 h-0.5 bg-white/40 rounded-full" />
                      <div className="w-6 h-0.5 bg-white/40 rounded-full" />
                      <div className="w-6 h-0.5 bg-white/40 rounded-full" />
                    </div>
                  </div>

                  {/* Base del micrófono */}
                  <div className={`w-24 h-2 rounded-full mt-1 transition-all ${
                    phase === 'recording' ? 'bg-red-500' : 'bg-purple-500'
                  }`} />
                  <div className={`w-3 h-4 rounded-b-full transition-all ${
                    phase === 'recording' ? 'bg-red-500' : 'bg-purple-500'
                  }`} />
                  <div className={`w-10 h-1 rounded-full transition-all ${
                    phase === 'recording' ? 'bg-red-500' : 'bg-purple-500'
                  }`} />

                  {/* Animación pulsante cuando graba */}
                  {phase === 'recording' && (
                    <span className="absolute -inset-3 rounded-full bg-red-500/20 animate-ping" />
                  )}
                </button>

                <p className={`text-sm font-semibold ${phase === 'recording' ? 'text-red-400' : 'text-slate-400'}`}>
                  {phase === 'recording' ? '🔴 Grabando... suelta para enviar' : 'Mantén presionado y habla en inglés'}
                </p>
              </div>
            )}

            {/* Evaluando */}
            {phase === 'evaluating' && (
              <div className="text-center py-8">
                <div className="inline-block animate-pulse text-purple-400 text-lg font-semibold">
                  ✨ María está evaluando...
                </div>
              </div>
            )}

            {/* Feedback */}
            {phase === 'feedback' && feedback && (
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">

                {/* Score grande */}
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Score</p>
                  <p className={`text-5xl font-bold ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {feedback.score}/10
                  </p>
                  <p className={`text-sm font-semibold mt-1 ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {passed ? `✅ ¡Superaste el mínimo de ${minScore}!` : `❌ Mínimo requerido: ${minScore}/10`}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs mb-1">Gramática</p>
                    <p className="text-sm">{feedback.grammar}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs mb-1">Fluidez</p>
                    <p className="text-sm">{feedback.fluency}</p>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-xl">
                    <p className="text-slate-400 text-xs mb-1">Pronunciación</p>
                    <p className="text-sm">{feedback.pronunciation}</p>
                  </div>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-slate-400 text-xs mb-1">Feedback</p>
                  <p className="text-sm">{feedback.feedback}</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl">
                  <p className="text-slate-400 text-xs mb-1">Versión corregida</p>
                  <p className="text-emerald-300 font-semibold">{feedback.corrected_version}</p>
                </div>

                {/* Acciones */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={retryPhrase}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl"
                  >
                    🔁 Repetir frase
                  </button>
                  {passed && (
                    <button
                      onClick={nextPhrase}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl"
                    >
                      Siguiente frase →
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}
