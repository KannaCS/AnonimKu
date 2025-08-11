'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { dbFunctions } from '@/lib/supabase'
import { Match } from '@/lib/supabase'
import { Search, MessageCircle, UserX, Loader2, User, LogOut, Heart, Shield, Users } from 'lucide-react'
import { FullPageLoader } from '@/components/LoadingSpinner'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.id) {
      checkExistingMatch()
    }
  }, [status, session, router])

  const checkExistingMatch = async () => {
    if (!session?.user?.id) return

    try {
      const { data: match, error } = await dbFunctions.getActiveMatch(session.user.id)
      if (match && !error) {
        setCurrentMatch(match)
        // Redirect to chat if match exists
        router.push(`/chat/${match.id}`)
      }
    } catch (err) {
      console.error('Error checking existing match:', err)
    }
  }

  const startSearching = async () => {
    if (!session?.user?.id) return

    setIsSearching(true)
    setError('')

    try {
      // Update user status to online and not in chat
      await dbFunctions.updateOnlineStatus(session.user.id, true)

      // Try to find a match every 2 seconds
      const searchInterval = setInterval(async () => {
        try {
          const { data: matchId, error } = await dbFunctions.findMatch(session.user.id)
          
          if (matchId) {
            clearInterval(searchInterval)
            setIsSearching(false)
            
            // Get full match details
            const { data: match } = await dbFunctions.getActiveMatch(session.user.id)
            if (match) {
              setCurrentMatch(match)
              router.push(`/chat/${match.id}`)
            }
          } else if (error && Object.keys(error).length > 0 && error.message) {
            // Only log actual errors with content
            console.error('Match finding error:', error)
          }
          // Silently continue if no match found (this is normal behavior)
        } catch (err) {
          console.error('Search error:', err)
        }
      }, 2000)

      // Stop searching after 60 seconds
      setTimeout(() => {
        clearInterval(searchInterval)
        setIsSearching(false)
        setError('No matches found. Please try again.')
      }, 60000)

    } catch (err) {
      console.error('Error starting search:', err)
      setError('Failed to start searching. Please try again.')
      setIsSearching(false)
    }
  }

  const stopSearching = async () => {
    setIsSearching(false)
    setError('')
    
    if (session?.user?.id) {
      await dbFunctions.updateOnlineStatus(session.user.id, false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  if (status === 'loading') {
    return <FullPageLoader text="Loading dashboard..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Welcome Card */}
          <div className="col-span-12 md:col-span-4 rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="mb-8">
                <Image
                  src="/AnonimKu.png"
                  alt="AnonimKu Logo"
                  width={220}
                  height={220}
                  className=""
                  priority
                />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Welcome, {session.user.name}!</h1>
              <p className="text-gray-600 text-sm mb-4">Ready to meet someone new?</p>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-600">Online</span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>

          {/* Main Search Card */}
          <div className="col-span-12 md:col-span-8 bg-blue-600 rounded-3xl p-8 text-white shadow-sm">
            <div className="text-center max-w-md mx-auto h-full flex flex-col justify-center">
              {!isSearching ? (
                <>
                  <div className="bg-white/10 p-4 rounded-full w-fit mx-auto mb-6">
                    <Search className="h-12 w-12 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Find Your Match</h2>
                  <p className="text-blue-100 mb-8 text-lg">
                    Start searching for someone to chat with anonymously
                  </p>
                  
                  {error && (
                    <div className="bg-red-500/20 border border-red-300/30 text-red-100 px-4 py-3 rounded-2xl text-sm mb-6">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={startSearching}
                    className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2 mx-auto"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Start Searching</span>
                  </button>
                </>
              ) : (
                <>
                  <div className="bg-white/10 p-4 rounded-full w-fit mx-auto mb-6">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">Searching for Match...</h2>
                  <p className="text-blue-100 mb-8 text-lg">
                    Looking for someone interesting to chat with...
                  </p>
                  
                  <div className="flex items-center justify-center space-x-2 mb-8">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>

                  <button
                    onClick={stopSearching}
                    className="bg-gray-800 text-white px-8 py-4 rounded-2xl font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2 mx-auto"
                  >
                    <UserX className="h-5 w-5" />
                    <span>Stop Searching</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tips Cards */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Be Respectful</h3>
            <p className="text-gray-600 text-sm">
              Treat your chat partner with kindness and respect for a great experience
            </p>
          </div>

          <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Stay Safe</h3>
            <p className="text-gray-600 text-sm">
              Only reveal your identity when you feel comfortable and trust is built
            </p>
          </div>

          <div className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ask Questions</h3>
            <p className="text-gray-600 text-sm">
              Keep conversations flowing with open-ended questions and genuine interest
            </p>
          </div>

          {/* User Info Card */}
          <div className="col-span-12 bg-gray-900 rounded-3xl p-6 text-white shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h3 className="text-xl font-bold mb-2">Your Profile</h3>
                <div className="flex flex-col md:flex-row gap-4 text-gray-300">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{session.user.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <span>{session.user.phone}</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">🔒</div>
                <p className="text-gray-400 text-sm mt-1">Your info stays private<br />until you reveal it</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}