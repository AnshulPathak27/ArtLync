'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'idle'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      verifyToken(token)
    }
  }, [token])

  const verifyToken = async (token: string) => {
    setStatus('verifying')
    setMessage('Verifying your email...')

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })

      const data = await res.json()

      if (res.ok) {
        setStatus('success')
        setMessage('Email verified successfully! Redirecting...')
        setTimeout(() => router.push('/login'), 2000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Verification failed')
      }
    } catch {
      setStatus('error')
      setMessage('An error occurred. Please try again.')
    }
  }

  const resendVerification = async () => {
    if (!email) return
    setStatus('verifying')
    setMessage('Sending verification email...')

    try {
      const res = await fetch(`/api/auth/verify-email?email=${encodeURIComponent(email)}`, {
        method: 'GET'
      })
      const data = await res.json()
      if (res.ok) {
        setStatus('idle')
        setMessage(`Verification link sent! Check the dev URL below.`)
        if (data.devVerifyUrl) {
          setMessage(`${message} <a href="${data.devVerifyUrl}" className="underline" target="_blank">Click here to verify</a>`)
        }
      }
    } catch {
      setStatus('error')
      setMessage('Failed to send verification email')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-indigo-600">AI Creator Marketplace</Link>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Verify Your Email</h2>
        </div>

        <div className="bg-white py-8 px-6 shadow-sm rounded-lg">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">{message}</p>
              </>
            )}
            {status === 'success' && (
              <>
                <div className="text-green-600 text-4xl mb-4">✓</div>
                <p className="text-gray-600">{message}</p>
              </>
            )}
            {status === 'error' && (
              <>
                <div className="text-red-600 text-4xl mb-4">✕</div>
                <p className="text-red-600 mb-4">{message}</p>
                <button onClick={resendVerification} className="text-indigo-600 hover:underline">
                  Resend verification email
                </button>
              </>
            )}
            {status === 'idle' && (
              <>
                <p className="text-gray-600 mb-4">
                  {email ? `Enter the verification code sent to ${email}` : 'Enter your email to receive a verification link'}
                </p>
                {email && (
                  <button onClick={resendVerification} className="text-indigo-600 hover:underline">
                    Resend verification email
                  </button>
                )}
                {!email && (
                  <Link href="/signup" className="text-indigo-600 hover:underline">
                    Back to signup
                  </Link>
                )}
              </>
            )}
          </div>

          {email && status !== 'success' && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm">
              <p className="font-medium mb-2">Development Mode - Simulate Verification:</p>
              <p className="text-gray-600 mb-2">Click the link below to verify without email:</p>
              <button
                onClick={() => fetch(`/api/auth/verify-email?email=${encodeURIComponent(email)}`).then(r => r.json()).then(d => d.devVerifyUrl && window.open(d.devVerifyUrl, '_blank'))}
                className="text-indigo-600 hover:underline break-all"
              >
                Dev: Get Verification Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}