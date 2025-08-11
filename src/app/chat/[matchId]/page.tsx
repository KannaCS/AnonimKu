'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, use } from 'react'
import Image from 'next/image'
import { dbFunctions, supabase } from '@/lib/supabase'
import { Match, Message, RevealRequest, User } from '@/lib/supabase'
import { Send, Eye, Phone, User as UserIcon, LogOut, AlertCircle, ArrowLeft } from 'lucide-react'
import { FullPageLoader } from '@/components/LoadingSpinner'
import { gsap } from 'gsap'

interface ChatPageProps {
  params: Promise<{
    matchId: string
  }>
}

export default function ChatPage({ params: paramsPromise }: ChatPageProps) {
  const params = use(paramsPromise)
  const { data: session, status } = useSession()
  const router = useRouter()
  const [match, setMatch] = useState<Match & { 
    user1: User, 
    user2: User 
  } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [revealRequests, setRevealRequests] = useState<RevealRequest[]>([])
  const [showRevealDialog, setShowRevealDialog] = useState(false)
  const [partnerUser, setPartnerUser] = useState<User | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // GSAP Animation Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const messagesAreaRef = useRef<HTMLDivElement>(null)
  const inputAreaRef = useRef<HTMLDivElement>(null)
  const revealRequestRef = useRef<HTMLDivElement>(null)
  const revealDialogRef = useRef<HTMLDivElement>(null)
  const emptyStateRef = useRef<HTMLDivElement>(null)
  const sendButtonRef = useRef<HTMLButtonElement>(null)
  const messageRefs = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    if (session?.user?.id) {
      loadMatchData()
    }
  }, [status, session, params.matchId])

  // Page entrance animations
  useEffect(() => {
    if (loading || !match) return

    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set([headerRef.current, messagesAreaRef.current, inputAreaRef.current], {
        y: 50,
        opacity: 0
      })

      gsap.set(emptyStateRef.current, {
        scale: 0.8,
        opacity: 0
      })

      // Entrance timeline
      const tl = gsap.timeline()

      tl.to(headerRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      })
      .to(messagesAreaRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: "back.out(1.7)"
      }, "-=0.4")
      .to(inputAreaRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      }, "-=0.3")
      .to(emptyStateRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.5,
        ease: "back.out(2)"
      }, "-=0.2")

    }, containerRef)

    return () => ctx.revert()
  }, [loading, match])

  // Message animations
  useEffect(() => {
    if (!messages.length) return

    // Animate new messages
    const newMessageElements = messageRefs.current.slice(messages.length - 1)
    
    newMessageElements.forEach((el, index) => {
      if (el) {
        gsap.fromTo(el, {
          y: 30,
          opacity: 0,
          scale: 0.9
        }, {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.7)",
          delay: index * 0.1
        })
      }
    })
  }, [messages.length])

  // Reveal request animation
  useEffect(() => {
    if (revealRequests.length > 0 && revealRequestRef.current) {
      gsap.fromTo(revealRequestRef.current, {
        y: -20,
        opacity: 0,
        scale: 0.95
      }, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "back.out(1.7)"
      })
    }
  }, [revealRequests.length])

  // Reveal dialog animation
  useEffect(() => {
    if (showRevealDialog && revealDialogRef.current) {
      gsap.fromTo(revealDialogRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 20
      }, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.4,
        ease: "back.out(2)"
      })
    }
  }, [showRevealDialog])

  // Send button animation
  useEffect(() => {
    if (!sendButtonRef.current) return

    if (sending) {
      gsap.to(sendButtonRef.current, {
        scale: 0.9,
        duration: 0.2,
        ease: "power2.out"
      })
    } else {
      gsap.to(sendButtonRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "back.out(1.7)"
      })
    }
  }, [sending])

  // Separate effect for subscriptions to ensure proper cleanup
  useEffect(() => {
    if (!session?.user?.id || !params.matchId) return

    console.log('🔔 Setting up real-time subscriptions for match:', params.matchId)
    
    // Setup message subscription
    const messagesChannel = supabase
      .channel(`messages-${params.matchId}-${Date.now()}`, {
        config: {
          broadcast: { self: true }
        }
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${params.matchId}`
        },
        (payload) => {
          console.log('📨 New message received:', payload.new)
          const newMessage = payload.new as Message
          
          // Force state update with callback pattern
          setMessages(currentMessages => {
            console.log('📨 Current messages count:', currentMessages.length)
            
            // Prevent duplicates
            const exists = currentMessages.some(msg => msg.id === newMessage.id)
            if (exists) {
              console.log('📨 Message already exists, skipping')
              return currentMessages
            }
            
            console.log('📨 Adding new message to UI')
            const updatedMessages = [...currentMessages, newMessage].sort((a, b) =>
              new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            )
            return updatedMessages
          })
        }
      )
      .subscribe((status) => {
        console.log('📨 Messages subscription status:', status)
      })

    // Setup reveal requests subscription
    const revealChannel = supabase
      .channel(`reveal-${params.matchId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reveal_requests',
          filter: `match_id=eq.${params.matchId}`
        },
        (payload) => {
          console.log('👁️ Reveal request change:', payload)
          loadRevealRequests()
        }
      )
      .subscribe((status) => {
        console.log('👁️ Reveal subscription status:', status)
      })

    // Setup matches subscription for profile reveals
    const matchChannel = supabase
      .channel(`match-${params.matchId}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
          filter: `id=eq.${params.matchId}`
        },
        (payload) => {
          console.log('🔄 Match updated:', payload.new)
          // Reload match data when profile is revealed
          loadMatchData()
        }
      )
      .subscribe((status) => {
        console.log('🔄 Match subscription status:', status)
      })

    return () => {
      console.log('🧹 Cleaning up subscriptions')
      supabase.removeChannel(messagesChannel)
      supabase.removeChannel(revealChannel)
      supabase.removeChannel(matchChannel)
    }
  }, [session?.user?.id, params.matchId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadMatchData = async () => {
    if (!session?.user?.id) return

    try {
      setLoading(true)
      
      // Load match details
      const { data: matchData, error: matchError } = await dbFunctions.getActiveMatch(session.user.id)
      
      if (matchError || !matchData || matchData.id !== params.matchId) {
        router.push('/dashboard')
        return
      }

      setMatch(matchData)

      // Determine partner user
      const partner = matchData.user1_id === session.user.id ? matchData.user2 : matchData.user1
      setPartnerUser(partner)

      // Load messages
      const { data: messagesData, error: messagesError } = await dbFunctions.getMessages(params.matchId)
      
      if (!messagesError && messagesData) {
        setMessages(messagesData)
      }

      // Load pending reveal requests
      const { data: revealData, error: revealError } = await dbFunctions.getPendingRevealRequests(session.user.id)
      
      if (!revealError && revealData) {
        setRevealRequests(revealData.filter(req => req.match_id === params.matchId))
      }

    } catch (error) {
      console.error('Error loading match data:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadRevealRequests = async () => {
    if (!session?.user?.id) return

    const { data, error } = await dbFunctions.getPendingRevealRequests(session.user.id)
    if (!error && data) {
      setRevealRequests(data.filter(req => req.match_id === params.matchId))
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newMessage.trim() || !session?.user?.id || sending) return

    setSending(true)
    try {
      await dbFunctions.sendMessage(params.matchId, session.user.id, newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const requestReveal = async () => {
    if (!session?.user?.id || !partnerUser) return

    try {
      await dbFunctions.requestReveal(params.matchId, session.user.id, partnerUser.id)
      setShowRevealDialog(false)
    } catch (error) {
      console.error('Error requesting reveal:', error)
    }
  }

  const respondToReveal = async (requestId: string, accepted: boolean) => {
    try {
      await dbFunctions.respondToReveal(requestId, accepted ? 'accepted' : 'rejected')
      loadRevealRequests()
      
      if (accepted) {
        loadMatchData()
      }
    } catch (error) {
      console.error('Error responding to reveal:', error)
    }
  }

  const endChat = async () => {
    if (!confirm('Are you sure you want to end this chat?')) return

    try {
      await dbFunctions.endMatch(params.matchId)
      router.push('/dashboard')
    } catch (error) {
      console.error('Error ending chat:', error)
    }
  }

  // Interactive animations
  const handleButtonHover = (element: HTMLElement, isEntering: boolean) => {
    if (isEntering) {
      gsap.to(element, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out"
      })
    } else {
      gsap.to(element, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      })
    }
  }

  if (loading) {
    return <FullPageLoader text="Loading chat..." />
  }

  if (!match || !partnerUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 w-full max-w-md text-center">
          <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Not Found</h1>
          <p className="text-gray-600 mb-6">This chat session could not be found or has ended.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-2xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const isProfileRevealed = match.both_profiles_revealed
  const canReveal = !isProfileRevealed && revealRequests.length === 0

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" ref={containerRef}>
      
      {/* Sticky Header Card */}
      <div className="sticky top-0 z-10 bg-gray-50 p-4" ref={headerRef}>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-2xl transition-colors"
                onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
                onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden">
                  {isProfileRevealed ? (
                    <div className="w-8 h-8">
                      <Image
                        src="/AnonimKu.png"
                        alt="User"
                        width={32}
                        height={32}
                        className="rounded-xl"
                      />
                    </div>
                  ) : (
                    <UserIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">
                    {isProfileRevealed ? partnerUser.name : 'Anonymous User'}
                  </h1>
                  {isProfileRevealed ? (
                    <p className="text-sm text-gray-600 flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {partnerUser.phone}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">Connected</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {canReveal && (
                <button
                  onClick={() => setShowRevealDialog(true)}
                  onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-1"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Reveal</span>
                </button>
              )}
              
              <button
                onClick={endChat}
                onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
                onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
                className="bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-1"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">End</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reveal Requests */}
      {revealRequests.length > 0 && (
        <div className="px-4 mb-4" ref={revealRequestRef}>
          <div className="bg-yellow-50 border border-yellow-200 rounded-3xl p-4">
            <div className="max-w-4xl mx-auto">
              {revealRequests.map((request) => (
                <div key={request.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-yellow-800 font-medium">
                    Your chat partner wants to reveal profiles. Do you accept?
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => respondToReveal(request.id, true)}
                      onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
                      onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
                      className="bg-green-600 text-white px-4 py-2 rounded-2xl text-sm font-medium hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => respondToReveal(request.id, false)}
                      onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
                      onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
                      className="bg-red-600 text-white px-4 py-2 rounded-2xl text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area - takes remaining space */}
      <div className="flex-1 px-4 pb-4" ref={messagesAreaRef}>
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 h-full flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12" ref={emptyStateRef}>
                  <div className="text-6xl mb-4">👋</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Start the conversation!</h3>
                  <p className="text-gray-600">Say hello to your anonymous chat partner</p>
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwn = message.sender_id === session?.user?.id
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      ref={(el) => {
                        if (el) messageRefs.current[index] = el
                      }}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        <p className={`text-xs mt-2 ${isOwn ? 'text-blue-100' : 'text-gray-500'}`}>
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Sticky Message Input */}
          <div className="sticky bottom-0 bg-white p-4 border-t border-gray-100" ref={inputAreaRef}>
            <form onSubmit={sendMessage} className="max-w-4xl mx-auto">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all"
                  disabled={sending}
                />
                <button
                  ref={sendButtonRef}
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  onMouseEnter={(e) => !sending && handleButtonHover(e.currentTarget, true)}
                  onMouseLeave={(e) => !sending && handleButtonHover(e.currentTarget, false)}
                  className="bg-blue-600 text-white p-3 rounded-2xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Reveal Dialog */}
      {showRevealDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div 
            ref={revealDialogRef}
            className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 w-full max-w-md"
          >
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Reveal Profiles</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Do you want to reveal your profile to your chat partner? They will need to accept before both profiles are shown.
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowRevealDialog(false)}
                  onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-2xl font-medium hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={requestReveal}
                  onMouseEnter={(e) => handleButtonHover(e.currentTarget, true)}
                  onMouseLeave={(e) => handleButtonHover(e.currentTarget, false)}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-2xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Request Reveal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}