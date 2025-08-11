import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { dbFunctions } from "./supabase"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: "phone-credentials",
      name: "Phone Number",
      credentials: {
        name: { label: "Name", type: "text" },
        phone: { label: "Phone Number", type: "tel" }
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.phone) {
          return null
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+?[0-9\s\-\(\)]{8,}$/
        if (!phoneRegex.test(credentials.phone.trim())) {
          return null
        }

        try {
          // Create or update user in Supabase
          const { data: user, error } = await dbFunctions.upsertUser({
            name: credentials.name,
            phone: credentials.phone
          })

          if (error || !user) {
            return null
          }

          return {
            id: user.id,
            name: user.name,
            phone: user.phone,
          }
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.phone = user.phone
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.phone = token.phone as string
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Extend the built-in session types
declare module "next-auth" {
  interface User {
    id: string
    phone: string
  }
  
  interface Session {
    user: {
      id: string
      name: string
      phone: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    phone: string
  }
}