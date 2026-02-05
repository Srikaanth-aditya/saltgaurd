"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

interface User {
  id: string
  email: string
  name: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Simple hash function for password (for demo purposes - use bcrypt in production)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + "saltguard_salt_2024")
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for existing session on mount
    const storedUser = sessionStorage.getItem("saltguard_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabase = createClient()
      const hashedPassword = await hashPassword(password)

      // Query Supabase for user with matching email and password
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("password_hash", hashedPassword)
        .single()

      if (error || !data) {
        // Fallback: Demo account for testing
        if (email === "doctor@hospital.com" && password === "password123") {
          const userData: User = {
            id: crypto.randomUUID(),
            email,
            name: "Dr. Roberts",
          }
          setUser(userData)
          sessionStorage.setItem("saltguard_user", JSON.stringify(userData))
          return { success: true }
        }
        return { success: false, error: "Invalid email or password" }
      }

      const userData: User = {
        id: data.id,
        email: data.email,
        name: data.full_name || "User",
      }
      setUser(userData)
      sessionStorage.setItem("saltguard_user", JSON.stringify(userData))
      return { success: true }
    } catch (err) {
      console.error("Sign in error:", err)
      return { success: false, error: "An error occurred during sign in" }
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return { success: false, error: "Invalid email format" }
      }

      // Validate password length
      if (password.length < 6) {
        return { success: false, error: "Password must be at least 6 characters" }
      }

      const supabase = createClient()
      const hashedPassword = await hashPassword(password)

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", email.toLowerCase())
        .single()

      if (existingUser) {
        return { success: false, error: "An account with this email already exists" }
      }

      // Insert new user into Supabase
      const { data, error } = await supabase
        .from("profiles")
        .insert({
          email: email.toLowerCase(),
          full_name: name,
          password_hash: hashedPassword,
        })
        .select()
        .single()

      if (error) {
        console.error("Supabase signup error:", error)
        return { success: false, error: error.message || "Failed to create account" }
      }

      // Auto sign in after successful signup
      const userData: User = {
        id: data.id,
        email: data.email,
        name: data.full_name || name,
      }
      setUser(userData)
      sessionStorage.setItem("saltguard_user", JSON.stringify(userData))

      return { success: true }
    } catch (err) {
      console.error("Sign up error:", err)
      return { success: false, error: "An error occurred during sign up" }
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem("saltguard_user")
    router.push("/")
  }, [router])

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
