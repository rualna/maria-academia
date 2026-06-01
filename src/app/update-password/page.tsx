'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  const router = useRouter()

  async function updatePassword() {
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Password updated.')

      setTimeout(() => {
        router.push('/login')
      }, 1500)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">
          Update Password
        </h1>

        <input
          type="password"
          placeholder="New Password"
          className="w-full border p-3 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={updatePassword}
          className="w-full bg-black text-white p-3 rounded"
        >
          Update Password
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