"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RiskMeter } from "@/components/risk-meter"
import { ClinicalFlagsPanel } from "@/components/clinical-flags-panel"
import { ExplanationPanel } from "@/components/explanation-panel"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine
} from "recharts"
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Activity,
  User,
  FileText,
  Heart,
  Loader2
} from "lucide-react"

// 1. Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = params.id as string

  const [record, setRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 2. Fetch Patient & Result Data
  useEffect(() => {
    const fetchPatientData = async () => {
      setIsLoading(true)
      try {
        const { data, error: dbError } = await supabase
          .from("patients")
          .select(`
            *,
            results (
              mortality_risk,
              mortality_probability,
              heart_risk,
              heart_risk_score,
              heart_risk_reasons,
              shock_index,
              status,
              renal_dysfunction,
              hyponatremia,
              severe_anemia,
              leukocytosis
            )
          `)
          .eq("id", patientId)
          .single()

        if (dbError) throw new Error(dbError.message)
        if (!data) throw new Error("Patient not found.")

        // Flatten the structure
        const latestResult = data.results && data.results.length > 0 ? data.results[0] : {}

        setRecord({
          ...data,
          ...latestResult,
          // Fallback for missing heart risk key
          heart_risk: latestResult.heart_risk || latestResult.heart_attack_risk
        })

      } catch (err: any) {
        console.error("Error fetching details:", err)
        setError(err.message || "Could not load patient record.")
      } finally {
        setIsLoading(false)
      }
    }

    if (patientId) fetchPatientData()
  }, [patientId])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Retrieving patient history...</p>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !record) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl p-6">
          <Button variant="outline" onClick={() => router.push("/patients")} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to List
          </Button>
          <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold text-destructive">Error Loading Record</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  // 3. Prepare Chart Data

  const creatinineVal = Number(record.creatinine) || 0
  const creatinineData = [
    { name: "Normal Max", value: 1.2, fill: "#10b981" },
    { name: "Patient", value: creatinineVal, fill: creatinineVal > 1.3 ? "#ef4444" : "#3b82f6" },
    { name: "Critical", value: 2.0, fill: "#7f1d1d" },
  ]

  const sodiumVal = Number(record.sodium) || 0
  const sodiumData = [
    { name: "Low Limit", value: 135 },
    { name: "Patient", value: sodiumVal },
    { name: "Normal", value: 145 },
  ]

  const heartScore = Number(record.heart_risk_score) || 0
  const useHeartScore = heartScore > 0

  const cardiacData = useHeartScore ? [
    { name: "Healthy", value: 2, fill: "#10b981" },
    { name: "Patient", value: heartScore, fill: heartScore > 4 ? "#ef4444" : "#f59e0b" },
    { name: "Critical", value: 8, fill: "#7f1d1d" },
  ] : [
    { name: "Normal", value: 0.7, fill: "#10b981" },
    { name: "Patient", value: Number(record.shock_index) || 0, fill: Number(record.shock_index) > 0.8 ? "#ef4444" : "#f59e0b" },
    { name: "Critical", value: 1.0, fill: "#7f1d1d" },
  ]

  // --- RISK LOGIC OVERRIDE ---
  const probability = record.mortality_probability || 0

  // Custom Thresholds:
  // Low: < 20%
  // Moderate: 20% - 60% (This ensures 52% is Moderate)
  // High: > 60%

  const isHighRisk = probability > 60
  const isModerateRisk = probability >= 20 && probability <= 60

  // Determine text label based on these new thresholds
  const riskLabel = isHighRisk ? "High Risk" : isModerateRisk ? "Moderate Risk" : "Low Risk"
  const riskColor = isHighRisk ? "red" : isModerateRisk ? "amber" : "green"

  const clinicalFlags = {
    renal_dysfunction: record.renal_dysfunction,
    hyponatremia: record.hyponatremia,
    severe_anemia: record.severe_anemia,
    leukocytosis: record.leukocytosis,
  }

  return (
    <DashboardLayout>
      {/* Alert Banner */}
      {(isHighRisk || isModerateRisk) && (
        <div className={`animate-pulse border-b ${isHighRisk ? "border-destructive/30 bg-destructive/10" : "border-yellow-500/30 bg-yellow-500/10"}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-6 py-3">
            <AlertTriangle className={`h-5 w-5 ${isHighRisk ? "text-destructive" : "text-yellow-600"}`} />
            <span className={`font-bold uppercase tracking-tight ${isHighRisk ? "text-destructive" : "text-yellow-600"}`}>
              {isHighRisk ? "Action Required: High Risk Patient" : "Warning: Moderate Risk Detected"}
            </span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl p-6">
        {/* Header Navigation */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Button variant="ghost" onClick={() => router.push("/patients")} className="mb-2 pl-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Patients
            </Button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <User className="h-8 w-8 text-muted-foreground" />
              {record.patient_name}
            </h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-2 text-sm">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Admit: {new Date(record.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span>Age: {record.age}</span>
              <span>•</span>
              <span>ID: {record.id.slice(0, 8)}</span>
            </div>
          </div>

        </div>

        {/* Vital Signs Grid */}
        <div className="mb-8 rounded-2xl border bg-card/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
            <Activity className="h-4 w-4 text-primary" /> Recorded Vitals
          </h3>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Sodium", value: record.sodium, unit: "mEq/L" },
              { label: "Creatinine", value: record.creatinine, unit: "mg/dL" },
              { label: "BUN", value: record.bun, unit: "mg/dL" },
              { label: "Hemoglobin", value: record.hemoglobin, unit: "g/dL" },
              { label: "WBC", value: record.wbc, unit: "K/µL" },
            ].map((item, idx) => (
              <div key={idx} className="rounded-lg border bg-background p-3 shadow-sm">
                <p className="text-xs text-muted-foreground uppercase">{item.label}</p>
                <p className="text-lg font-bold">{item.value} <span className="text-xs font-normal text-muted-foreground">{item.unit}</span></p>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Overview */}
        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          {/* Mortality Card */}
          <div className={`relative overflow-hidden rounded-2xl border p-6 ${isHighRisk ? "bg-destructive/5 border-destructive/20" : "bg-card"}`}>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mortality Analysis</p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h2 className={`text-4xl font-black ${isHighRisk ? "text-destructive" : isModerateRisk ? "text-yellow-600" : "text-foreground"}`}>
                  {riskLabel}
                </h2>
                <p className="mt-2 text-lg font-medium text-muted-foreground">
                  Probability: <span className="text-foreground font-bold">{probability.toFixed(1)}%</span>
                </p>
              </div>
              <RiskMeter value={probability} maxValue={100} size={120} color={riskColor} />
            </div>
          </div>

          {/* Cardiac/Shock Card */}
          <div className="rounded-2xl border bg-card p-6">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Cardiac Condition</p>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Heart className={`h-8 w-8 ${record.heart_risk === "High" ? "text-destructive animate-pulse" : "text-emerald-500"}`} />
                  <h2 className="text-4xl font-black">{record.heart_risk || "Low"}</h2>
                </div>

                {useHeartScore ? (
                  <div className="mt-3 inline-flex items-center rounded-full border bg-secondary/50 px-3 py-1 text-sm">
                    Risk Score: <span className="ml-2 font-bold">{heartScore}/5</span>
                  </div>
                ) : (
                  <div className="mt-3 inline-flex items-center rounded-full border bg-secondary/50 px-3 py-1 text-sm">
                    Shock Index: <span className="ml-2 font-bold">{(record.shock_index || 0).toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Graphs Section */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Creatinine Chart */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="mb-6 text-xs font-bold text-muted-foreground uppercase">Creatinine (Kidney Function)</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creatinineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {creatinineData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sodium Chart */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="mb-6 text-xs font-bold text-muted-foreground uppercase">Sodium Balance</h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sodiumData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                  <XAxis type="number" domain={[110, 150]} fontSize={11} hide />
                  <YAxis type="category" dataKey="name" width={80} fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} />
                  <ReferenceLine x={135} stroke="orange" strokeDasharray="3 3" />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20} fill="#3b82f6">
                    {sodiumData.map((e, i) => (
                      <Cell key={i} fill={i === 1 ? (e.value < 135 ? "#ef4444" : "#3b82f6") : "#1f2937"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cardiac Chart */}
          <div className="rounded-xl border bg-card p-5 shadow-sm">
            <h3 className="mb-6 text-xs font-bold text-muted-foreground uppercase">
              {useHeartScore ? "Heart Risk Score (0-10)" : "Hemodynamic Stability (SI)"}
            </h3>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cardiacData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1f2937', borderRadius: '8px', border: 'none' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {cardiacData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Detailed Explanation Panels */}
        <div className="grid gap-6">
          <ClinicalFlagsPanel flags={clinicalFlags} />

          <ExplanationPanel
            mortalityRisk={riskLabel} // Use computed label (Moderate Risk)
            heartRisk={record.heart_risk}
            shockIndex={heartScore}
            clinicalFlags={clinicalFlags}
            patientData={record}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}