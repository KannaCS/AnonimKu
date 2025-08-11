'use client'

import { useState, useRef, useEffect } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Phone, User, ArrowRight } from 'lucide-react'
import { gsap } from 'gsap'

export default function SignInPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null)
  const logoSectionRef = useRef<HTMLDivElement>(null)
  const formSectionRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const formFieldsRef = useRef<HTMLDivElement[]>([])
  const submitButtonRef = useRef<HTMLButtonElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)
  const footerTextRef = useRef<HTMLDivElement>(null)

  // Page entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Set initial states
      gsap.set([logoSectionRef.current, formSectionRef.current], {
        y: 80,
        opacity: 0,
        scale: 0.9
      })

      gsap.set(logoRef.current, {
        scale: 0.6,
        opacity: 0,
        rotation: -20
      })

      gsap.set(formFieldsRef.current, {
        x: 30,
        opacity: 0
      })

      gsap.set(submitButtonRef.current, {
        y: 20,
        opacity: 0,
        scale: 0.95
      })

      gsap.set(footerTextRef.current, {
        opacity: 0
      })

      // Main entrance timeline
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
        ease: "back.out(2.5)"
      }, "-=0.6")

      // Form section entrance
      .to(formSectionRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.9,
        ease: "back.out(1.7)"
      }, "-=0.5")

      // Form fields staggered entrance
      .to(formFieldsRef.current, {
        x: 0,
        opacity: 1,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.1
      }, "-=0.3")

      // Submit button entrance
      .to(submitButtonRef.current, {
        y: 0,
        opacity: 1,
        scale: 1,
        duration: 0.5,
        ease: "back.out(1.7)"
      }, "-=0.2")

      // Footer text fade in
      .to(footerTextRef.current, {
        opacity: 1,
        duration: 0.4,
        ease: "power2.out"
      }, "-=0.1")

    }, containerRef)

    return () => ctx.revert()
  }, [])

  // Error animation
  useEffect(() => {
    if (error && errorRef.current) {
      gsap.fromTo(errorRef.current, {
        opacity: 0,
        y: -10,
        scale: 0.95
      }, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: "back.out(1.7)"
      })
    }
  }, [error])

  // Loading state animation
  useEffect(() => {
    if (submitButtonRef.current) {
      if (loading) {
        gsap.to(submitButtonRef.current, {
          scale: 0.98,
          duration: 0.2,
          ease: "power2.out"
        })
      } else {
        gsap.to(submitButtonRef.current, {
          scale: 1,
          duration: 0.3,
          ease: "back.out(1.7)"
        })
      }
    }
  }, [loading])

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

  // Interactive animations
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

  const handleInputFocus = (element: HTMLInputElement, isFocused: boolean) => {
    if (isFocused) {
      gsap.to(element, {
        scale: 1.02,
        duration: 0.3,
        ease: "power2.out"
      })
    } else {
      gsap.to(element, {
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      })
    }
  }

  const handleButtonHover = (isEntering: boolean) => {
    if (!submitButtonRef.current || loading) return
    
    if (isEntering) {
      gsap.to(submitButtonRef.current, {
        scale: 1.05,
        duration: 0.2,
        ease: "power2.out"
      })
    } else {
      gsap.to(submitButtonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out"
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" ref={containerRef}>
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Side - Logo & Welcome */}
        <div 
          ref={logoSectionRef}
          className="bg-white rounded-3xl p-14 shadow-lg border border-gray-100 flex flex-col justify-center items-center min-h-[420px] cursor-pointer"
          onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
          onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
        >
          <div className="mb-12" ref={logoRef}>
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
        <div 
          ref={formSectionRef}
          className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100"
          onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
          onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
        >
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h2>
            <p className="text-gray-600">Fill in your information to begin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div 
              ref={(el) => {
                if (el) formFieldsRef.current[0] = el
              }}
            >
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
                  onFocus={(e) => handleInputFocus(e.target, true)}
                  onBlur={(e) => handleInputFocus(e.target, false)}
                  className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>
            </div>

            <div 
              ref={(el) => {
                if (el) formFieldsRef.current[1] = el
              }}
            >
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
                  onFocus={(e) => handleInputFocus(e.target, true)}
                  onBlur={(e) => handleInputFocus(e.target, false)}
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
              <div 
                ref={errorRef}
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm"
              >
                {error}
              </div>
            )}

            <button
              ref={submitButtonRef}
              type="submit"
              disabled={loading}
              onMouseEnter={() => handleButtonHover(true)}
              onMouseLeave={() => handleButtonHover(false)}
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

          <div 
            ref={footerTextRef}
            className="mt-8 pt-6 border-t border-gray-100"
          >
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