"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { DashboardLayout } from "@/components/dashboard-layout"
import { RiskMeter } from "@/components/risk-meter"
import { ClinicalFlagsPanel } from "@/components/clinical-flags-panel"
import { ExplanationPanel } from "@/components/explanation-panel"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line,
} from "recharts"
import {
  AlertTriangle, Heart, ArrowLeft, RefreshCcw, Loader2
} from "lucide-react"

// 1. Direct Supabase Connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function ResultsPage() {
  const router = useRouter()
  const [record, setRecord] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // 2. Fetch data joining 'patients' and 'results' tables
      // We order by created_at to get the very latest entry if no ID is specified
      const { data, error: fetchError } = await supabase
        .from('patients')
        .select(`
          id,
          patient_name,
          age,
          created_at,
          results (
            creatinine,
            sodium,
            heart_rate,
            shock_index,
            mortality_risk,
            mortality_probability,
            heart_attack_risk,
            clinical_flags
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (fetchError) throw fetchError

      // Flatten the structure for easier use
      // If 'results' is an array (1:many), we take the first one. If object (1:1), we use it directly.
      const resultData = Array.isArray(data.results) ? data.results[0] : data.results

      if (!resultData) throw new Error("Patient found, but no results linked.")

      setRecord({
        ...data,
        ...resultData // Merges result fields (creatinine, sodium) to top level
      })

    } catch (err: any) {
      console.error("Database Error:", err.message)
      setError("Failed to retrieve analysis data.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (isLoading) return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading analysis from database...</p>
      </div>
    </DashboardLayout>
  )

  if (error || !record) return (
    <DashboardLayout>
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Data Error</h2>
        <p className="text-muted-foreground">{error}</p>
        <Button className="mt-4" onClick={fetchData}>Retry Sync</Button>
      </div>
    </DashboardLayout>
  )

  // 3. Dynamic Graph Data Configuration
  const creatinineData = [
    { name: "Normal Max", value: 1.2, fill: "#10b981" }, // Green
    { name: "Patient", value: record.creatinine || 0, fill: "#ef4444" }, // Red
    { name: "Critical", value: 2.5, fill: "#7f1d1d" }, // Dark Red
  ]

  const sodiumTrend = [
    { stage: "Normal", val: 140 },
    { stage: "Patient", val: record.sodium || 0 },
    { stage: "Low Risk", val: 130 },
  ]

  const cardiacData = [
    { name: "Heart Rate", value: record.heart_rate || 80 },
    { name: "Shock Index", value: (record.shock_index || 0) * 100 }, // Scaled x100 for visibility
  ]

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Clinical Analysis</h1>
            <p className="text-muted-foreground">
              Patient: {record.patient_name} • Age: {record.age}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/patient-input")}>
              <ArrowLeft className="mr-2 h-4" /> Back
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCcw className="mr-2 h-4" /> Sync
            </Button>
          </div>
        </div>

        {/* Risk Score Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Mortality Card */}
          <div className="rounded-2xl border p-6 bg-card">
            <p className="text-sm font-medium text-muted-foreground uppercase">Mortality Risk</p>
            <div className="flex justify-between items-center mt-2">
              <h2 className="text-4xl font-black text-foreground">{record.mortality_risk}</h2>
              <RiskMeter value={record.mortality_probability} maxValue={100} size={100} />
            </div>
          </div>

          {/* Heart Risk Card */}
          <div className="rounded-2xl border p-6 bg-card">
            <p className="text-sm font-medium text-muted-foreground uppercase">Heart Attack Risk</p>
            <div className="flex justify-between items-center mt-2">
              <h2 className="text-4xl font-black text-emerald-500 flex items-center gap-2">
                <Heart className="fill-emerald-500 h-8 w-8" /> {record.heart_attack_risk}
              </h2>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase">Shock Index</p>
                <p className="text-xl font-bold">{record.shock_index?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- DYNAMIC GRAPHS --- */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">

          {/* 1. Creatinine Chart */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-4 text-xs font-bold text-muted-foreground uppercase">Creatinine (mg/dL) vs Risk</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creatinineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} domain={[0, 'auto']} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#111', border: 'none' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {creatinineData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Sodium Chart */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-4 text-xs font-bold text-muted-foreground uppercase">Sodium (mEq/L) Trend</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sodiumTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="stage" fontSize={10} />
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} fontSize={10} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none' }} />
                  <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Vitals Chart */}
          <div className="rounded-xl border bg-card p-4">
            <h3 className="mb-4 text-xs font-bold text-muted-foreground uppercase">Vitals & Shock Index</h3>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cardiacData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" fontSize={10} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none' }} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Flags & Explanation */}
        <div className="mb-8">
          <ClinicalFlagsPanel flags={record.clinical_flags} />
        </div>

        <div className="mb-8">
          <ExplanationPanel
            mortalityRisk={record.mortality_risk}
            heartRisk={record.heart_attack_risk}
            shockIndex={record.shock_index}
            clinicalFlags={record.clinical_flags}
            patientData={record}
          />
        </div>
      </div>
    </DashboardLayout>
  )
}