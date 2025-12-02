'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signupSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type SignupFormData = z.infer<typeof signupSchema>

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const supabase = createClient()
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?type=signup`,
        },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
      } else if (signUpData.user) {
        // Always require email verification
        // Sign out the user immediately to prevent auto-login
        await supabase.auth.signOut()
        
        setSuccess(
          'Account created successfully! Please check your email to verify your account before signing in. You can close this page.'
        )
        setLoading(false)
        
        // Clear the form
        setTimeout(() => {
          router.push('/auth/login?message=Please verify your email to continue')
        }, 3000)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Or{' '}
            <Link href="/auth/login" className="font-medium text-blue-500 hover:text-blue-400">
              sign in to existing account
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-900/20 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg">
              {success}
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
                autoComplete="new-password"
                className="appearance-none relative block w-full px-3 py-2 bg-gray-900 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Password"
              />
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                Confirm Password
              </label>
              <input
                {...register('confirmPassword')}
                type="password"
                autoComplete="new-password"
                className="appearance-none relative block w-full px-3 py-2 bg-gray-900 border border-white/10 placeholder-gray-500 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Confirm Password"
              />
              {errors.confirmPassword && (
                <p className="text-red-400 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

