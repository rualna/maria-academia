'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  async function handleReset() {
    const { error } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: 'http://localhost:3000/update-password',
      }
    )

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Recovery email sent.')
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">
          Forgot Password
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full border p-3 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-black text-white p-3 rounded"
        >
          Send Recovery Email
        </button>

        {message && (
          <p className="text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}