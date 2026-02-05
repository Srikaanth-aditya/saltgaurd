"use client"

import { Brain, AlertCircle, Heart, Droplets, Activity } from "lucide-react"

interface ClinicalFlags {
  renal_dysfunction: boolean
  hyponatremia: boolean
  severe_anemia: boolean
  leukocytosis: boolean
}

interface PatientData {
  age: number
  sodium: number
  creatinine: number
  bilirubin: number
  inr: number
  platelet_count: number
  bun: number
  hemoglobin: number
  wbc: number
  systolic_bp: number
  heart_rate: number
}

interface ExplanationPanelProps {
  mortalityRisk: string
  heartRisk: string
  shockIndex: number
  clinicalFlags: ClinicalFlags
  patientData: PatientData
}

export function ExplanationPanel({
  mortalityRisk,
  heartRisk,
  shockIndex,
  clinicalFlags,
  patientData,
}: ExplanationPanelProps) {
  const isHighMortalityRisk = mortalityRisk === "High Risk"
  const isHighHeartRisk = heartRisk === "High"

  // Generate dynamic explanation based on clinical data
  const generateExplanation = () => {
    const reasons: string[] = []

    if (clinicalFlags.hyponatremia) {
      reasons.push(`low sodium level (${patientData.sodium} mEq/L)`)
    }
    if (clinicalFlags.renal_dysfunction) {
      reasons.push(`kidney dysfunction (creatinine: ${patientData.creatinine} mg/dL, BUN: ${patientData.bun} mg/dL)`)
    }
    if (clinicalFlags.severe_anemia) {
      reasons.push(`severe anemia (hemoglobin: ${patientData.hemoglobin} g/dL)`)
    }
    if (clinicalFlags.leukocytosis) {
      reasons.push(`elevated white blood cell count (${patientData.wbc} ×10³/µL)`)
    }
    if (patientData.systolic_bp < 90) {
      reasons.push(`low blood pressure (${patientData.systolic_bp} mmHg)`)
    }
    if (shockIndex > 1.0) {
      reasons.push(`critical shock index (${shockIndex.toFixed(2)})`)
    }
    if (patientData.bilirubin > 2) {
      reasons.push(`elevated bilirubin (${patientData.bilirubin} mg/dL)`)
    }
    if (patientData.inr > 1.5) {
      reasons.push(`prolonged INR (${patientData.inr})`)
    }

    if (reasons.length === 0) {
      return "The patient's clinical parameters are within acceptable ranges. Continue routine monitoring and follow standard care protocols."
    }

    const riskLevel = isHighMortalityRisk ? "high mortality" : "elevated"
    const heartStatus = isHighHeartRisk ? "increased heart attack risk" : "cardiac concerns"

    return `This patient presents with ${reasons.join(", ")}, which collectively contribute to ${riskLevel} risk and ${heartStatus}. Immediate clinical attention is recommended.`
  }

  // Generate recommendations
  const recommendations = [
    ...(clinicalFlags.renal_dysfunction
      ? ["Monitor renal function closely; consider nephrology consult"]
      : []),
    ...(clinicalFlags.hyponatremia
      ? ["Evaluate sodium correction strategy; monitor fluid balance"]
      : []),
    ...(clinicalFlags.severe_anemia
      ? ["Consider blood transfusion if symptomatic; investigate cause"]
      : []),
    ...(clinicalFlags.leukocytosis
      ? ["Screen for infection; consider broad-spectrum antibiotics if sepsis suspected"]
      : []),
    ...(shockIndex > 1.0
      ? ["Initiate fluid resuscitation; prepare for potential vasopressor support"]
      : []),
    ...(patientData.systolic_bp < 90
      ? ["Address hypotension immediately; consider ICU admission"]
      : []),
  ]

  if (recommendations.length === 0) {
    recommendations.push("Continue standard monitoring protocols")
    recommendations.push("Schedule follow-up assessment in 24-48 hours")
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 shadow-[0_0_20px_rgba(45,212,191,0.2)]">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            AI Clinical Explanation
          </h3>
          <p className="text-sm text-muted-foreground">
            Why is this patient {isHighMortalityRisk ? "high" : "moderate"} risk?
          </p>
        </div>
      </div>

      {/* Main Explanation */}
      <div
        className={`mb-6 rounded-xl border p-4 ${
          isHighMortalityRisk
            ? "border-alert-red/30 bg-alert-red/5"
            : "border-primary/30 bg-primary/5"
        }`}
      >
        <div className="flex items-start gap-3">
          <AlertCircle
            className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
              isHighMortalityRisk ? "text-alert-red" : "text-primary"
            }`}
          />
          <p className="text-foreground leading-relaxed">{generateExplanation()}</p>
        </div>
      </div>

      {/* Key Factors */}
      <div className="mb-6">
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Key Contributing Factors
        </h4>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clinicalFlags.hyponatremia && (
            <div className="flex items-center gap-3 rounded-lg border border-alert-red/30 bg-alert-red/5 p-3">
              <Droplets className="h-5 w-5 text-alert-red" />
              <div>
                <p className="text-sm font-medium text-foreground">Low Sodium</p>
                <p className="text-xs text-muted-foreground">{patientData.sodium} mEq/L</p>
              </div>
            </div>
          )}
          {clinicalFlags.renal_dysfunction && (
            <div className="flex items-center gap-3 rounded-lg border border-alert-red/30 bg-alert-red/5 p-3">
              <Activity className="h-5 w-5 text-alert-red" />
              <div>
                <p className="text-sm font-medium text-foreground">Kidney Failure</p>
                <p className="text-xs text-muted-foreground">Cr: {patientData.creatinine} mg/dL</p>
              </div>
            </div>
          )}
          {clinicalFlags.severe_anemia && (
            <div className="flex items-center gap-3 rounded-lg border border-alert-red/30 bg-alert-red/5 p-3">
              <Droplets className="h-5 w-5 text-alert-red" />
              <div>
                <p className="text-sm font-medium text-foreground">Severe Anemia</p>
                <p className="text-xs text-muted-foreground">Hgb: {patientData.hemoglobin} g/dL</p>
              </div>
            </div>
          )}
          {clinicalFlags.leukocytosis && (
            <div className="flex items-center gap-3 rounded-lg border border-alert-red/30 bg-alert-red/5 p-3">
              <Activity className="h-5 w-5 text-alert-red" />
              <div>
                <p className="text-sm font-medium text-foreground">Leukocytosis</p>
                <p className="text-xs text-muted-foreground">WBC: {patientData.wbc} ×10³/µL</p>
              </div>
            </div>
          )}
          {shockIndex > 1.0 && (
            <div className="flex items-center gap-3 rounded-lg border border-alert-red/30 bg-alert-red/5 p-3">
              <Heart className="h-5 w-5 text-alert-red" />
              <div>
                <p className="text-sm font-medium text-foreground">Critical Shock</p>
                <p className="text-xs text-muted-foreground">Index: {shockIndex.toFixed(2)}</p>
              </div>
            </div>
          )}
          {patientData.systolic_bp < 90 && (
            <div className="flex items-center gap-3 rounded-lg border border-alert-red/30 bg-alert-red/5 p-3">
              <Activity className="h-5 w-5 text-alert-red" />
              <div>
                <p className="text-sm font-medium text-foreground">Hypotension</p>
                <p className="text-xs text-muted-foreground">BP: {patientData.systolic_bp} mmHg</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Clinical Recommendations
        </h4>
        <ul className="space-y-2">
          {recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
