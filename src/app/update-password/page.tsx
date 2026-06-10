'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()

  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Contraseña actualizada correctamente.')
      setTimeout(() => router.push('/login'), 1500)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-8 space-y-4">
        <h1 className="text-2xl font-bold text-white">
          Nueva contraseña
        </h1>

        <input
          type="password"
          placeholder="Nueva contraseña"
          className="w-full p-4 rounded-xl bg-slate-800 text-white border border-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={updatePassword}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-4 rounded-xl"
        >
          Actualizar contraseña
        </button>

        {message && (
          <p className="text-sm text-slate-300 text-center">{message}</p>
        )}
      </div>
    </main>
  )
}
