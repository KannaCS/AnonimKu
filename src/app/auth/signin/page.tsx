'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Phone, User, ArrowRight } from 'lucide-react'

export default function SignInPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name.trim() || !phone.trim()) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    // Basic phone number validation
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/
    if (!phoneRegex.test(phone.trim())) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }

    try {
      const result = await signIn('phone-credentials', {
        name: name.trim(),
        phone: phone.trim(),
        redirect: false,
      })

      if (result?.error) {
        setError('Failed to sign in. Please try again.')
      } else {
        // Wait for session to be updated
        const session = await getSession()
        if (session) {
          router.push('/dashboard')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side - Logo & Welcome */}
        <div className="bg-white rounded-3xl p-14 shadow-lg border border-gray-100 flex flex-col justify-center items-center min-h-[420px]">
          <div className="mb-12">
            <Image
              src="/AnonimKu.png"
              alt="AnonimKu Logo"
              width={240}
              height={240}
              className="rounded-2xl"
              priority
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 text-center">Welcome Back</h1>
          <p className="text-gray-600 text-center text-lg leading-relaxed">
            Enter your details to start connecting with strangers anonymously
          </p>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
            <p className="text-gray-600">Fill in your information to begin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-3">
                Your Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-3">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  placeholder="+1234567890"
                  disabled={loading}
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                We use your phone number for matching and security
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Starting...
                </>
              ) : (
                <>
                  Start Chatting
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <p className="text-sm text-gray-500 text-center leading-relaxed">
              By continuing, you agree to connect anonymously with strangers. 
              <br />
              Your information is kept private until you choose to reveal it.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}