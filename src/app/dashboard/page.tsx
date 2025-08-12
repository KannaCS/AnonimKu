'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { dbFunctions, supabase } from '@/lib/supabase'
import { Match } from '@/lib/supabase'
import { Search, MessageCircle, UserX, Loader2, User, LogOut, Heart, Shield, Users } from 'lucide-react'
import { FullPageLoader } from '@/components/LoadingSpinner'
import { gsap } from 'gsap'

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null)
  const welcomeCardRef = useRef<HTMLDivElement>(null)
  const mainCardRef = useRef<HTMLDivElement>(null)
  const tipsCardsRef = useRef<HTMLDivElement[]>([])
  const userCardRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)

  const checkExistingMatch = async () => {
    if (!session?.user?.id) return

    try {
      const { data: match, error } = await dbFunctions.getActiveMatch(session.user.id)
      if (match && !error) {
        // Redirect to chat if match exists
        router.push(`/chat/${match.id}`)
      }
    } catch (err) {
      console.error('Error checking existing match:', err)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.id) {
      checkExistingMatch()
    }
  }, [status, session, router])

  // Real-time match subscription for both users
  useEffect(() => {
    if (!session?.user?.id) return

    console.log('🔔 Setting up match subscription for user:', session.user.id)
    
    // Subscribe to matches where this user is involved
    const matchChannel = supabase
      .channel(`user-matches-${session.user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('🎯 New match found (as user1):', payload.new)
          handleNewMatch(payload.new.id)
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user2_id=eq.${session.user.id}`
        },
        (payload) => {
          console.log('🎯 New match found (as user2):', payload.new)
          handleNewMatch(payload.new.id)
        }
      )
      .subscribe((status) => {
        console.log('🎯 Match subscription status:', status)
      })

    return () => {
      console.log('🧹 Cleaning up match subscription')
      supabase.removeChannel(matchChannel)
    }
  }, [session?.user?.id])

  const handleNewMatch = async (matchId: string) => {
    console.log('🎉 Processing new match:', matchId)
    setIsSearching(false)
    
    try {
      // Get full match details
      const { data: match } = await dbFunctions.getActiveMatch(session?.user?.id || '')
      if (match && match.id === matchId) {
        router.push(`/chat/${match.id}`)
      }
    } catch (err) {
      console.error('Error processing new match:', err)
    }
  }

  // GSAP Animations
  useEffect(() => {
    if (status === 'loading' || !session) return

    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set([welcomeCardRef.current, mainCardRef.current, ...tipsCardsRef.current, userCardRef.current], {
        y: 50,
        opacity: 0,
        scale: 0.95
      })

      gsap.set(logoRef.current, {
        scale: 0.8,
        opacity: 0,
        rotation: -10
      })

      // Animate cards in sequence
      const tl = gsap.timeline()
      
      tl.to(welcomeCardRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      })
      .to(logoRef.current, {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.4")
      .to(mainCardRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.5")
      .to(tipsCardsRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)",
        stagger: 0.1
      }, "-=0.4")
      .to(userCardRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.3")

    }, containerRef)

    return () => ctx.revert()
  }, [status, session])

  // Search button animation
  useEffect(() => {
    if (!searchButtonRef.current) return

    const ctx = gsap.context(() => {
      if (isSearching) {
        gsap.to(searchButtonRef.current, {
          scale: 0.95,
          duration: 0.3,
          ease: "power2.out"
        })
      } else {
        gsap.to(searchButtonRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)"
        })
      }
    }, searchButtonRef)

    return () => ctx.revert()
  }, [isSearching])

  const startSearching = async () => {
    if (!session?.user?.id) return

    setIsSearching(true)
    setError('')

    try {
      // Update user status to online and not in chat
      console.log('🟢 Setting user online:', session.user.id)
      const { error: statusError } = await dbFunctions.updateOnlineStatus(session.user.id, true)
      if (statusError) {
        console.error('❌ Error setting online status:', statusError)
      } else {
        console.log('✅ User is now online')
      }

      // Try to find a match every 3 seconds (less frequent since we have real-time notifications)
      const searchInterval = setInterval(async () => {
        try {
          console.log('🔍 Searching for match for user:', session.user.id)
          const { data: matchId, error } = await dbFunctions.findMatch(session.user.id)
          
          if (matchId) {
            // Match found! Real-time subscription will handle the redirect
            clearInterval(searchInterval)
            console.log('🎯 Match found via polling:', matchId)
          } else {
            console.log('👥 No matches available right now')
          }
          
          if (error) {
            console.log('⚠️ Error during match search:', error)
          }
        } catch (err) {
          console.error('Search error:', err)
        }
      }, 3000)

      // Store interval reference for cleanup
      const searchTimeout = setTimeout(() => {
        clearInterval(searchInterval)
        setIsSearching(false)
        setError('No matches found. Please try again.')
      }, 60000)

      // Store references for cleanup
      ;(window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchInterval = searchInterval
      ;(window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchTimeout = searchTimeout

    } catch (err) {
      console.error('Error starting search:', err)
      setError('Failed to start searching. Please try again.')
      setIsSearching(false)
    }
  }

  const stopSearching = async () => {
    setIsSearching(false)
    setError('')
    
    // Clean up any active intervals
    if ((window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchInterval) {
      clearInterval((window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchInterval)
      ;(window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchInterval = undefined
    }
    if ((window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchTimeout) {
      clearTimeout((window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchTimeout)
      ;(window as Window & { activeSearchInterval?: NodeJS.Timeout; activeSearchTimeout?: NodeJS.Timeout }).activeSearchTimeout = undefined
    }
    
    if (session?.user?.id) {
      await dbFunctions.updateOnlineStatus(session.user.id, false)
    }
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  // Add card hover animations
  const handleCardHover = (element: HTMLElement, isEntering: boolean) => {
    if (isEntering) {
      gsap.to(element, {
        y: -5,
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      })
    } else {
      gsap.to(element, {
        y: 0,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  if (status === 'loading') {
    return <FullPageLoader text="Loading dashboard..." />
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50" ref={containerRef}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Welcome Card */}
          <div 
            ref={welcomeCardRef}
            className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
            onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
          >
            <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <div className="mb-8" ref={logoRef}>
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
          <div 
            ref={mainCardRef}
            className="col-span-12 md:col-span-8 bg-blue-600 rounded-3xl p-8 text-white shadow-sm cursor-pointer"
            onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
          >
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
                    ref={searchButtonRef}
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
                    ref={searchButtonRef}
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
          <div
            ref={(el) => {
              if (el) tipsCardsRef.current[0] = el
            }}
            className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
            onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
          >
            <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Be Respectful</h3>
            <p className="text-gray-600 text-sm">
              Treat your chat partner with kindness and respect for a great experience
            </p>
          </div>

          <div
            ref={(el) => {
              if (el) tipsCardsRef.current[1] = el
            }}
            className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
            onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
          >
            <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Stay Safe</h3>
            <p className="text-gray-600 text-sm">
              Only reveal your identity when you feel comfortable and trust is built
            </p>
          </div>

          <div
            ref={(el) => {
              if (el) tipsCardsRef.current[2] = el
            }}
            className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
            onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
          >
            <div className="bg-purple-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Ask Questions</h3>
            <p className="text-gray-600 text-sm">
              Keep conversations flowing with open-ended questions and genuine interest
            </p>
          </div>

          {/* User Info Card */}
          <div 
            ref={userCardRef}
            className="col-span-12 bg-gray-900 rounded-3xl p-6 text-white shadow-sm cursor-pointer"
            onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
            onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
          >
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