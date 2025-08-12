'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { Users, Shield, Heart, ArrowRight, Sparkles } from 'lucide-react'
import { gsap } from 'gsap'

export default function HomePage() {
  const { status } = useSession()
  const router = useRouter()

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null)
  const logoSectionRef = useRef<HTMLDivElement>(null)
  const ctaSectionRef = useRef<HTMLDivElement>(null)
  const featureCardsRef = useRef<HTMLDivElement[]>([])
  const howItWorksRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const ctaButtonRef = useRef<HTMLButtonElement>(null)
  const stepsRef = useRef<HTMLDivElement[]>([])

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  // Homepage entrance animations
  useEffect(() => {
    if (status !== 'unauthenticated') return

    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set([logoSectionRef.current, ctaSectionRef.current, ...featureCardsRef.current, howItWorksRef.current, statsRef.current, footerRef.current], {
        y: 60,
        opacity: 0,
        scale: 0.95
      })

      gsap.set(logoRef.current, {
        scale: 0.7,
        opacity: 0,
        rotation: -15
      })

      gsap.set(ctaButtonRef.current, {
        scale: 0.9,
        opacity: 0
      })

      gsap.set(stepsRef.current, {
        y: 30,
        opacity: 0
      })

      // Main timeline
      const tl = gsap.timeline()

      // Logo section entrance
      tl.to(logoSectionRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)"
      })
      .to(logoRef.current, {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.8,
        ease: "back.out(2)"
      }, "-=0.6")

      // CTA section entrance
      .to(ctaSectionRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "back.out(1.7)"
      }, "-=0.5")
      .to(ctaButtonRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.6,
        ease: "back.out(2)"
      }, "-=0.3")

      // Feature cards staggered entrance
      .to(featureCardsRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "back.out(1.7)",
        stagger: 0.15
      }, "-=0.4")

      // How it works section
      .to(howItWorksRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: "back.out(1.7)"
      }, "-=0.3")
      .to(stepsRef.current, {
        y: 0,
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
        stagger: 0.1
      }, "-=0.4")

      // Stats and footer
      .to(statsRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.7,
        ease: "back.out(1.7)"
      }, "-=0.2")
      .to(footerRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.6,
        ease: "power2.out"
      }, "-=0.1")

    }, containerRef)

    return () => ctx.revert()
  }, [status])

  // Interactive animations
  const handleCardHover = (element: HTMLElement, isEntering: boolean) => {
    if (isEntering) {
      gsap.to(element, {
        y: -8,
        scale: 1.03,
        duration: 0.4,
        ease: "power2.out"
      })
    } else {
      gsap.to(element, {
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out"
      })
    }
  }

  const handleButtonHover = (isEntering: boolean) => {
    if (!ctaButtonRef.current) return
    
    if (isEntering) {
      gsap.to(ctaButtonRef.current, {
        scale: 1.05,
        duration: 0.3,
        ease: "power2.out"
      })
    } else {
      gsap.to(ctaButtonRef.current, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

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
      <div className="min-h-screen bg-gray-50" ref={containerRef}>
        <div className="max-w-7xl mx-auto px-4 py-12">
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-12 gap-6 h-screen max-h-[900px]">
            
            {/* Logo & Description Section */}
            <div 
              ref={logoSectionRef}
              className="col-span-12 md:col-span-5 bg-white rounded-3xl p-8 flex flex-col justify-center items-center shadow-sm border border-gray-100 cursor-pointer"
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
            >
              <div className="mb-8" ref={logoRef}>
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
            <div 
              ref={ctaSectionRef}
              className="col-span-12 md:col-span-7 bg-blue-600 rounded-3xl p-8 flex flex-col justify-center items-center text-white shadow-sm cursor-pointer"
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
            >
              <h2 className="text-3xl font-bold mb-4 text-center">Ready to Connect?</h2>
              <p className="text-blue-100 text-center mb-8 text-lg">
                Start chatting anonymously with strangers from around the world
              </p>
              <button
                ref={ctaButtonRef}
                onClick={() => router.push('/auth/signin')}
                onMouseEnter={() => handleButtonHover(true)}
                onMouseLeave={() => handleButtonHover(false)}
                className="bg-white text-blue-600 px-8 py-4 rounded-2xl text-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
              >
                Start Anonymous Chat
                <ArrowRight className="h-5 w-5" />
              </button>
              <p className="text-blue-200 mt-4 text-sm">No registration required • Start in seconds</p>
            </div>

            {/* Anonymous Matching */}
            <div 
              ref={(el) => {
                if (el) featureCardsRef.current[0] = el
              }}
              className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
            >
              <div className="bg-blue-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Anonymous Matching</h3>
              <p className="text-gray-600 text-sm">
                Get matched with strangers without revealing your identity first
              </p>
            </div>

            {/* Safe & Secure */}
            <div 
              ref={(el) => {
                if (el) featureCardsRef.current[1] = el
              }}
              className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
            >
              <div className="bg-green-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Safe & Secure</h3>
              <p className="text-gray-600 text-sm">
                Your privacy is protected until you choose to reveal yourself
              </p>
            </div>

            {/* Mutual Consent */}
            <div 
              ref={(el) => {
                if (el) featureCardsRef.current[2] = el
              }}
              className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
            >
              <div className="bg-red-50 w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Mutual Consent</h3>
              <p className="text-gray-600 text-sm">
                Profiles are revealed only when both parties agree
              </p>
            </div>

            {/* How it Works */}
            <div 
              ref={howItWorksRef}
              className="col-span-12 md:col-span-8 bg-gray-900 rounded-3xl p-8 text-white shadow-sm cursor-pointer"
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
            >
              <h3 className="text-2xl font-bold mb-6">How It Works</h3>
              <div className="grid grid-cols-3 gap-6">
                <div 
                  ref={(el) => {
                    if (el) stepsRef.current[0] = el
                  }}
                  className="text-center"
                >
                  <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    1
                  </div>
                  <h4 className="font-semibold mb-2">Enter Details</h4>
                  <p className="text-gray-300 text-sm">Share your name and phone</p>
                </div>
                <div 
                  ref={(el) => {
                    if (el) stepsRef.current[1] = el
                  }}
                  className="text-center"
                >
                  <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    2
                  </div>
                  <h4 className="font-semibold mb-2">Get Matched</h4>
                  <p className="text-gray-300 text-sm">Connect anonymously</p>
                </div>
                <div 
                  ref={(el) => {
                    if (el) stepsRef.current[2] = el
                  }}
                  className="text-center"
                >
                  <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-lg font-bold">
                    3
                  </div>
                  <h4 className="font-semibold mb-2">Chat & Reveal</h4>
                  <p className="text-gray-300 text-sm">Connect and reveal when ready</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div 
              ref={statsRef}
              className="col-span-12 md:col-span-4 bg-white rounded-3xl p-6 shadow-sm border border-gray-100 cursor-pointer"
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
            >
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
        <footer 
          ref={footerRef}
          className="bg-white border-t border-gray-100 py-6 mt-12"
        >
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-gray-500 text-sm">
              © 2025 AnonimKu. Connect anonymously, reveal when ready.
            </p>
          </div>
        </footer>
      </div>
    )
  }

  return null
}