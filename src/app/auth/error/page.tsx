'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { AlertTriangle, ArrowLeft } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'CredentialsSignin':
        return 'Invalid credentials provided. Please check your information and try again.'
      case 'Verification':
        return 'Verification failed. Please try again.'
      case 'Default':
      default:
        return 'An error occurred during authentication. Please try again.'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-3 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
        
        <p className="text-gray-600 mb-8">
          {getErrorMessage(error)}
        </p>
        
        <button
          onClick={() => router.push('/auth/signin')}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Try Again
        </button>
      </div>
    </div>
  )
}