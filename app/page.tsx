"use client"

import React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { AnimatedBackground } from "@/components/animated-background"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Shield,
  Activity,
  Lock,
  Mail,
  AlertTriangle,
  Loader2,
  Heart,
  User,
} from "lucide-react"

type AuthMode = "signin" | "signup"

export default function LoginPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>("signin")
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (mode === "signin") {
        const result = await signIn(email, password)
        if (result.success) {
          router.push("/analytics")
        } else {
          setError(result.error || "Authentication failed")
        }
      } else {
        const result = await signUp(email, password, name)
        if (result.success) {
          router.push("/analytics")
        } else {
          setError(result.error || "Registration failed")
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin")
    setError(null)
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <AnimatedBackground />

      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo & Branding */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 shadow-[0_0_30px_rgba(45,212,191,0.3)]">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              SALTGUARD
            </h1>
            <p className="mt-2 text-muted-foreground">
              AI-Powered ICU Risk Prediction System
            </p>
          </div>

          {/* Auth Card */}
          <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-[0_0_50px_rgba(45,212,191,0.1)] backdrop-blur-xl">
            {/* Tab Toggle */}
            <div className="mb-6 flex rounded-lg bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("signin")
                  setError(null)
                }}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
                  mode === "signin"
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup")
                  setError(null)
                }}
                className={`flex-1 rounded-md py-2.5 text-sm font-medium transition-all ${
                  mode === "signup"
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(45,212,191,0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-foreground">
                {mode === "signin" ? "Doctor Login" : "Create Account"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "signin"
                  ? "Enter your credentials to access the dashboard"
                  : "Register to start using SALTGUARD"}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-foreground">
                    Full Name
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Dr. John Smith"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={mode === "signup"}
                      className="h-12 border-border/50 bg-input pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-border/50 bg-input pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={
                      mode === "signup"
                        ? "Create a password (min 6 characters)"
                        : "Enter your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={mode === "signup" ? 6 : undefined}
                    className="h-12 border-border/50 bg-input pl-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full bg-primary text-primary-foreground shadow-[0_0_20px_rgba(45,212,191,0.3)] transition-all hover:bg-primary/90 hover:shadow-[0_0_30px_rgba(45,212,191,0.5)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {mode === "signin" ? "Signing In..." : "Creating Account..."}
                  </>
                ) : mode === "signin" ? (
                  "Access Dashboard"
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            {/* Toggle Auth Mode */}
            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">
                {mode === "signin"
                  ? "Don't have an account?"
                  : "Already have an account?"}
              </span>{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="font-medium text-primary hover:underline"
              >
                {mode === "signin" ? "Sign up" : "Sign in"}
              </button>
            </div>

            {/* Demo Account Info */}
            {mode === "signin" && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/5 p-3 text-center text-sm">
                <p className="text-muted-foreground">
                  <span className="font-medium text-primary">Demo Account:</span>{" "}
                  doctor@hospital.com / password123
                </p>
              </div>
            )}

            {/* Security Badges */}
            <div className="mt-6 flex items-center justify-center gap-4 border-t border-border/30 pt-6">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Shield className="h-4 w-4 text-primary" />
                HIPAA Compliant
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-4 w-4 text-primary" />
                256-bit Encryption
              </div>
            </div>
          </div>

          {/* Feature Pills */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <div className="flex items-center gap-2 rounded-full border border-border/30 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <Activity className="h-4 w-4 text-primary" />
              Real-time Analysis
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/30 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <Heart className="h-4 w-4 text-alert-red" />
              Cardiac Risk Detection
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border/30 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
              <AlertTriangle className="h-4 w-4 text-warning-amber" />
              ICU Alerts
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>© 2026 SALTGUARD Medical Systems</p>
          </div>
        </div>
      </div>
    </div>
  )
}
