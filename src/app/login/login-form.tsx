'use client'

import React, { useState } from 'react'
import { requestOtpSchema } from '@/core/schemas/auth'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'username' | 'otp'>('username')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')

    const parseResult = requestOtpSchema.safeParse({ username })
    if (!parseResult.success) {
      setErrorMsg(parseResult.error.issues[0].message)
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/loginlink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to send OTP')
      }

      setStep('otp')
    } catch (err: any) {
      setErrorMsg(err.message || 'Error sending request')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'otp') {
    return (
      <div className="text-center p-6 border rounded-lg border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-bold">Check your inbox!</h2>
        <p className="text-sm text-slate-500 mt-2">
          One-time Passphrase has been sent to <strong>{username}@duck.com</strong>
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm w-full mx-auto p-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="username" className="text-sm font-medium">
          Enter your Duck Address
        </label>
        <div className="flex rounded-md shadow-sm border border-slate-300 dark:border-slate-700 overflow-hidden">
          <input
            id="username"
            type="text"
            placeholder="Duck Address"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 px-3 py-2 bg-transparent text-sm focus:outline-none"
          />
          <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500">
            @duck.com
          </span>
        </div>
        {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-md text-sm font-medium disabled:opacity-50 transition-colors"
      >
        {loading ? 'Sending...' : 'Login'}
      </button>
    </form>
  )
}