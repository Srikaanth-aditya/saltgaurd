"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Activity,
  Droplets,
  Beaker,
  AlertTriangle,
  Loader2,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface PatientData {
  patient_name: string
  age: string
  sodium: string
  creatinine: string
  bun: string
  hemoglobin: string
  wbc: string
}

interface ValidationErrors {
  [key: string]: string
}

const initialData: PatientData = {
  patient_name: "",
  age: "",
  sodium: "",
  creatinine: "",
  bun: "",
  hemoglobin: "",
  wbc: "",
}

const fieldConfig = [
  { key: "patient_name", label: "Patient Name", icon: User, unit: "", min: 0, max: 0, placeholder: "e.g., John Doe", isText: true },
  { key: "age", label: "Age", icon: User, unit: "years", min: 0, max: 120, placeholder: "e.g., 65" },
  { key: "sodium", label: "Sodium", icon: Droplets, unit: "mEq/L", min: 100, max: 180, placeholder: "e.g., 135" },
  { key: "creatinine", label: "Creatinine", icon: Beaker, unit: "mg/dL", min: 0, max: 20, placeholder: "e.g., 1.2" },
  { key: "bun", label: "BUN", icon: Beaker, unit: "mg/dL", min: 0, max: 200, placeholder: "e.g., 18" },
  { key: "hemoglobin", label: "Hemoglobin", icon: Droplets, unit: "g/dL", min: 0, max: 25, placeholder: "e.g., 14" },
  { key: "wbc", label: "WBC", icon: Droplets, unit: "×10³/µL", min: 0, max: 100, placeholder: "e.g., 7.5" },
]

export default function PatientInputPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [formData, setFormData] = useState<PatientData>(initialData)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {}

    for (const field of fieldConfig) {
      const value = formData[field.key as keyof PatientData]
      if (!value || value.trim() === "") {
        newErrors[field.key] = `${field.label} is required`
      } else if (!("isText" in field && field.isText)) {
        const numValue = parseFloat(value)
        if (Number.isNaN(numValue)) {
          newErrors[field.key] = `${field.label} must be a number`
        } else if (numValue < field.min || numValue > field.max) {
          newErrors[field.key] = `${field.label} must be between ${field.min} and ${field.max}`
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError(null)

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // 1. Prepare Payload
      const payload = {
        age: parseFloat(formData.age),
        sodium: parseFloat(formData.sodium),
        creatinine: parseFloat(formData.creatinine),
        bun: parseFloat(formData.bun),
        hemoglobin: parseFloat(formData.hemoglobin),
        wbc: parseFloat(formData.wbc),
      }

      console.log("[App] Sending payload to API:", payload)

      let result;

      // 2. Call Ngrok Backend
      try {
        const response = await fetch(
          "https://unstagily-unextenuated-ashely.ngrok-free.dev/predict",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify(payload),
          }
        )

        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`)
        }
        result = await response.json()
        console.log("[App] API Result:", result)

      } catch (err) {
        console.warn("[App] Prediction API failed, using fallback:", err)
        // Fallback Logic (Mock)
        result = {
          mortality_risk: "Unknown",
          mortality_probability: 0,
          heart_risk: "Unknown",
          heart_risk_score: 0,
          heart_risk_reasons: [],
          clinical_flags: {}
        }
      }

      // 3. Save to Supabase
      const supabase = createClient()

      // A. Insert Patient Record
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .insert({
          user_id: user?.id || '',
          patient_name: formData.patient_name,
          age: payload.age,
          sodium: payload.sodium,
          creatinine: payload.creatinine,
          bun: payload.bun,
          hemoglobin: payload.hemoglobin,
          wbc: payload.wbc,
          status: result.mortality_risk?.includes("High") ? "ICU" : "Monitor",
        })
        .select()
        .single()

      if (patientError) {
        throw new Error(`Failed to save patient: ${patientError.message}`)
      }

      const patientId = patientData.id

      // B. Insert Analysis Results (With NEW Fields)
      if (patientId) {
        const flags = result.clinical_flags || {}

        // Handle heart_risk_reasons formatting (Array vs String)
        // PostgreSQL array syntax usually handled automatically by Supabase client

        const { error: resultError } = await supabase
          .from("results")
          .insert({
            patient_id: patientId,
            mortality_risk: result.mortality_risk,
            mortality_probability: result.mortality_probability,

            // --- NEW CARDIAC FIELDS ---
            heart_risk: result.heart_risk,             // e.g. "High"
            heart_risk_score: result.heart_risk_score, // e.g. 5
            heart_risk_reasons: result.heart_risk_reasons, // e.g. ["Low Sodium", "Age"]

            // --- CLINICAL FLAGS ---
            renal_dysfunction: flags.renal_dysfunction || false,
            hyponatremia: flags.hyponatremia || false,
            severe_anemia: flags.severe_anemia || false,
            leukocytosis: flags.leukocytosis || false,
            severe_hyponatremia: flags.severe_hyponatremia || false,
            // elderly_risk: flags.elderly_risk || false, // Uncomment if you added this column

            status: result.mortality_risk?.includes("High") ? "ICU" : "Monitor",
          })

        if (resultError) {
          console.error("[App] Supabase result insert error:", resultError)
        }
      }

      // 4. Redirect
      router.push(`/patients/${patientId}`)

    } catch (err) {
      console.error(err)
      setApiError(
        err instanceof Error ? err.message : "Failed to process patient data"
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (key: keyof PatientData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Patient Assessment</h1>
          <p className="mt-2 text-muted-foreground">
            Enter patient clinical data for AI-powered risk analysis
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-[0_0_40px_rgba(45,212,191,0.08)] backdrop-blur-xl">
            {/* Clinical Values Section */}
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Activity className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Clinical Values</h2>
                <p className="text-sm text-muted-foreground">
                  Enter all required laboratory and vital sign data
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {fieldConfig.map((field) => {
                const Icon = field.icon
                const hasError = !!errors[field.key]
                return (
                  <div key={field.key} className="space-y-2">
                    <Label
                      htmlFor={field.key}
                      className={`flex items-center gap-2 text-sm ${hasError ? "text-destructive" : "text-foreground/80"}`}
                    >
                      <Icon className={`h-4 w-4 ${hasError ? "text-destructive" : "text-primary"}`} />
                      {field.label}
                      {field.unit && (
                        <span className="text-muted-foreground">({field.unit})</span>
                      )}
                    </Label>
                    <Input
                      id={field.key}
                      type={"isText" in field && field.isText ? "text" : "number"}
                      step="any"
                      placeholder={field.placeholder}
                      value={formData[field.key as keyof PatientData]}
                      onChange={(e) => handleChange(field.key as keyof PatientData, e.target.value)}
                      className={`h-11 border-border/50 bg-input text-foreground placeholder:text-muted-foreground/50 ${hasError
                        ? "border-destructive focus:border-destructive focus:ring-destructive"
                        : "focus:border-primary focus:ring-primary"
                        }`}
                    />
                    {hasError && (
                      <p className="flex items-center gap-1 text-xs text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {errors[field.key]}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {/* API Error */}
            {apiError && (
              <div className="mt-6 flex items-center gap-3 rounded-lg bg-destructive/10 p-4 text-destructive">
                <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Analysis Failed</p>
                  <p className="text-sm opacity-90">{apiError}</p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-end">
              <Button
                type="submit"
                disabled={isLoading}
                size="lg"
                className="h-14 min-w-[220px] bg-primary text-lg font-semibold text-primary-foreground shadow-[0_0_30px_rgba(45,212,191,0.4)] transition-all hover:bg-primary/90 hover:shadow-[0_0_40px_rgba(45,212,191,0.6)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Patient
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Info Card */}
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-primary" />
          <p className="text-sm text-foreground/80">
            AI predictions are intended to assist clinical decision-making and should not replace professional medical judgment.
          </p>
        </div>
      </div>
    </DashboardLayout>
  )
}