'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signUp() {
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      alert('Cuenta creada. Revisá tu email y confirmá tu cuenta antes de entrar.')
    }

    setLoading(false)
  }

  async function signIn() {
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message)
    } else {
      window.location.href = '/'
    }

    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-md border border-slate-700">
        <h1 className="text-3xl font-bold text-white mb-6">
          María Login
        </h1>

        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-800 text-white border border-slate-700"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 rounded-xl bg-slate-800 text-white border border-slate-700"
          />

          <button
            onClick={signIn}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold p-4 rounded-xl"
          >
            Login
          </button>
   <a
  href="/forgot-password"
  className="block text-center text-sm text-emerald-400 hover:text-emerald-300 underline"
>
  ¿Olvidaste tu contraseña?
</a>

          <button
            onClick={signUp}
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-400 text-white font-bold p-4 rounded-xl"
          >
            Crear Cuenta
          </button>
        </div>
      </div>
    </main>
  )
}