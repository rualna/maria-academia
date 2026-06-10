'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function handleReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/update-password`,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Te enviamos un email para recuperar tu contraseña.')
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Recuperar contraseña
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full p-4 rounded-xl bg-slate-800 text-white border border-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-4 rounded-xl"
        >
          Enviar email de recuperación
        </button>

        {message && (
          <p className="text-sm text-slate-300 text-center">{message}</p>
        )}

        <a
          href="/login"
          className="block text-center text-sm text-emerald-400 hover:text-emerald-300 underline"
        >
          Volver al login
        </a>
      </div>
    </main>
  )
}
