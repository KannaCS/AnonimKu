'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Image from 'next/image'
import { MessageCircle, Users, Shield, Heart, ArrowRight, Sparkles } from 'lucide-react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AnonimKu...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6 h-screen max-h-[900px]">
            
            {/* Logo & Description Section */}
            <div className="col-span-12 md:col-span-5 bg-white rounded-3xl p-8 flex flex-col justify-center items-center shadow-sm border border-gray-100">
              <div className="mb-8">
                <Image
                  src="/AnonimKu.png"
                  alt="AnonimKu Logo"
                  width={180}
                  height={180}
                  className="rounded-2xl"
                  priority
                />
              </div>
              <p className="text-gray-600 text-center text-lg leading-relaxed">
                Connect with strangers anonymously and reveal your identity when you feel a connection
              </p>
            </div>

            {/* CTA Section */}
            <div className="col-span-12 md:col-span-7 bg-blue-600 rounded-3xl p-8 flex flex-col justify-center items-center text-white shadow-sm">
              <h2 className="text-3xl font-bold mb-4 text-center">Ready to Connect?</h2>
              <p className="text-blue-100 text-center mb-8 text-lg">
                Start chatting anonymously with strangers from around the world
              </p>
              <button
                onClick={() => router.push('/auth/signin')}
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                Start Anonymous Chat
                <ArrowRight className="h-5 w-5" />
              </button>
              <p className="text-blue-200 mt-4 text-sm">No registration required • Start in seconds</p>
            </div>

            {/* Anonymous Matching */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Anonymous Matching</h3>
              <p className="text-gray-600 text-sm">
                Get matched with strangers without revealing your identity first
              </p>
            </div>

            {/* Safe & Secure */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe & Secure</h3>
              <p className="text-gray-600 text-sm">
                Your privacy is protected until you choose to reveal yourself
              </p>
            </div>

            {/* Mutual Consent */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mutual Consent</h3>
              <p className="text-gray-600 text-sm">
                Profiles are revealed only when both parties agree
              </p>
            </div>

            {/* How it Works */}
            <div className="col-span-12 md:col-span-8 bg-gray-900 rounded-3xl p-8 text-white shadow-sm">
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    1
                  </div>
                  <h4 className="font-semibold mb-2">Enter Details</h4>
                  <p className="text-gray-300 text-sm">Share your name and phone</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    2
                  </div>
                  <h4 className="font-semibold mb-2">Get Matched</h4>
                  <p className="text-gray-300 text-sm">Connect anonymously</p>
                </div>
                <div className="text-center">
                  <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    3
                  </div>
                  <h4 className="font-semibold mb-2">Chat & Reveal</h4>
                  <p className="text-gray-300 text-sm">Connect and reveal when ready</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
              <div className="text-center">
                <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-1">100%</div>
                <div className="text-gray-600">Anonymous</div>
                <div className="text-2xl font-bold text-blue-600 mt-3">⚡</div>
                <div className="text-gray-600 text-sm">Real-time</div>
              </div>
            </div>

          </div>
        </div>

        {/* Simple Footer */}
        <footer className="bg-white border-t border-gray-100 py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 AnonimKu. Connect anonymously, reveal when ready.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  return null
}