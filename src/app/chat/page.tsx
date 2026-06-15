'use client'
import { supabase } from '@/lib/supabase'

import { useEffect, useRef, useState } from 'react'

// Header con el JWT del usuario para autenticar las llamadas a la API
async function authHeader(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

type ChatMessage = {
  role: 'user' | 'maria'
  content: string
}

export default function ChatPage() {
  const [message, setMessage] = useState('')
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
const [mission, setMission] = useState<any>(null)

  const [studentId, setStudentId] = useState<string | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initUser() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        window.location.href = '/login'
        return
      }

      setStudentId(data.user.id)

      loadHistory(data.user.id)
      loadMission()
    }

    initUser()
  }, [])

  // 19 — Scroll persistence: baja al último mensaje siempre
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chat, loading])

  async function loadMission() {
    const res = await fetch('/api/missions', { headers: await authHeader() })
    const data = await res.json()

    if (data.success) {
      setMission(data.mission)
    }
  }

  async function loadHistory(studentId: string) {
    const res = await fetch(`/api/chat-history?student_id=${studentId}`, { headers: await authHeader() })
    const data = await res.json()

    if (data.success) {
      const formatted = data.history.flatMap((item: any) => [
        { role: 'user', content: item.event_data?.user_message || '' },
        { role: 'maria', content: item.event_data?.ai_response || '' },
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

    setChat((prev) => [...prev, { role: 'user', content: userMessage }])
    setMessage('')
    setLoading(true)

    const res = await fetch('/api/maria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeader()) },
      body: JSON.stringify({ student_id: studentId, message: userMessage }),
    })

    const data = await res.json()

    setChat((prev) => [
      ...prev,
      { role: 'maria', content: data.reply || 'María no respondió.' },
    ])

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-start sm:items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-700">

        {/* Header */}
        <div className="flex justify-between mb-4">
          <div className="flex gap-2">
            <a
              href="/"
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold px-3 py-2 sm:px-4 rounded-xl text-sm sm:text-base"
            >
              🏠 Inicio
            </a>
            <a
              href="/speaking"
              className="bg-purple-500 hover:bg-purple-400 text-white font-bold px-3 py-2 sm:px-4 rounded-xl text-sm sm:text-base"
            >
              🎤 Speaking
            </a>
          </div>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="bg-red-500 hover:bg-red-400 text-white font-bold px-3 py-2 sm:px-4 rounded-xl text-sm sm:text-base"
          >
            Cerrar sesión
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-1">María Tutor-IA</h1>
        <p className="text-slate-300 mb-4 text-sm sm:text-base">Tu tutora IA oficial de Academ-IA</p>

        {/* 33 — Loading state: skeleton mientras carga la misión */}
        {!mission && !studentId && (
          <div className="h-16 bg-slate-800 rounded-xl mb-4 animate-pulse" />
        )}

        {mission && (
          <div className="bg-emerald-500 text-slate-950 p-3 sm:p-4 rounded-xl mb-4">
            <p className="font-bold text-base sm:text-lg">🎯 Mission: {mission.title}</p>
            <p className="text-sm sm:text-base">{mission.description}</p>
          </div>
        )}

        {/* Chat */}
        <div className="h-72 sm:h-96 overflow-y-auto bg-slate-950 border border-slate-800 rounded-xl p-3 sm:p-4 mb-3 space-y-3">
          {chat.length === 0 && !loading && (
            <p className="text-slate-500 text-sm">Empieza hablando con María...</p>
          )}

          {chat.map((msg, index) => (
            <div
              key={index}
              className={`p-3 sm:p-4 rounded-xl max-w-[90%] sm:max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-emerald-500 text-slate-950 ml-auto'
                  : 'bg-slate-800 text-white'
              }`}
            >
              <p className="font-bold mb-1 text-sm">
                {msg.role === 'user' ? 'Tú' : 'María'}
              </p>
              <p className="whitespace-pre-line text-sm sm:text-base">{msg.content}</p>
              {msg.role === 'maria' && (
                <button
                  onClick={() => speak(msg.content)}
                  className="mt-2 text-xs sm:text-sm bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-lg"
                >
                  🔊 Escuchar
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="bg-slate-800 p-3 rounded-xl max-w-[85%] flex items-center gap-2">
              <span className="text-slate-400 text-sm">María está escribiendo</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2 sm:gap-3">
          <input
            className="flex-1 p-3 sm:p-4 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm sm:text-base"
            placeholder="Escribe tu mensaje..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') talkToMaria() }}
          />
          <button
            onClick={talkToMaria}
            disabled={loading || !(message || '').trim()}
            className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold px-4 sm:px-6 rounded-xl text-sm sm:text-base whitespace-nowrap"
          >
            Enviar
          </button>
        </div>
      </div>
    </main>
  )
}
