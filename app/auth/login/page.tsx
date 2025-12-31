'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  // Check for message or error in URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlMessage = params.get('message')
    const urlError = params.get('error')
    if (urlMessage) setMessage(urlMessage)
    if (urlError) setError(urlError)
  }, [])

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true)
    setError(null)
    setMessage(null)

    const supabase = createClient()
    const { data: signInData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      // Check if error is due to unverified email
      if (error.message.includes('Email not confirmed') || error.message.includes('email')) {
        setError('Please verify your email address before signing in. Check your inbox for the verification link.')
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else if (signInData.user) {
      // Check if user is verified
      if (!signInData.user.email_confirmed_at) {
        setError('Please verify your email address before signing in. Check your inbox for the verification link.')
        await supabase.auth.signOut()
        setLoading(false)
      } else {
        // Check for redirect URL
        const params = new URLSearchParams(window.location.search)
        const redirectUrl = params.get('redirect') || '/'
        router.push(redirectUrl)
        router.refresh()
      }
    }
  }

  // Check for redirect URL
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null)
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('redirect')
    if (redirect) {
      setRedirectUrl(redirect)
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Sign in to your account
          </h2>
          {redirectUrl === '/checkout' && (
            <p className="mt-2 text-center text-sm text-blue-400 bg-blue-900/20 border border-blue-500/50 px-4 py-2 rounded-lg">
              You need to sign in to proceed with checkout
            </p>
          )}
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link 
              href={redirectUrl ? `/auth/signup?redirect=${encodeURIComponent(redirectUrl)}` : "/auth/signup"} 
              className="font-medium text-blue-500 hover:text-blue-400"
            >
              create a new account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {message && (
            <div className="bg-blue-900/20 border border-blue-500/50 text-blue-400 px-4 py-3 rounded-lg">
              {message}
            </div>
          )}
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div className="rounded-md space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                Email address
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="appearance-none relative block w-full px-3 py-2 bg-gray-900 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
              />
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                autoComplete="current-password"
                className="appearance-none relative block w-full px-3 py-2 bg-gray-900 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

