'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home after 5 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 5000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <Shield className="w-24 h-24 text-red-500" />
            <AlertTriangle className="w-12 h-12 text-yellow-500 absolute -top-2 -right-2" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-400 mb-2">
          You don't have permission to access the admin dashboard.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Only users with admin privileges can access this area.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Go to Homepage
          </Link>
          <p className="text-gray-500 text-xs">
            Redirecting automatically in 5 seconds...
          </p>
        </div>
      </div>
    </div>
  )
}

