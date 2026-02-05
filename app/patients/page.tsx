'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Users, ArrowRight, TrendingUp, AlertCircle, Filter, Heart, Activity } from 'lucide-react'

interface Patient {
  id: string
  patient_name: string
  age: number
  created_at: string
  results?: {
    mortality_risk: string
    mortality_probability: number
    status: string
    heart_risk: string
    heart_risk_score: number
  }[] | null
}

export default function PatientsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const riskFilter = searchParams.get('risk')
  const cardiacFilter = searchParams.get('cardiac') // NEW: Get cardiac filter param

  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      fetchPatients()
    }
  }, [user])

  // --- UPDATED FILTER LOGIC ---
  useEffect(() => {
    if (!riskFilter && !cardiacFilter) {
      setFilteredPatients(patients)
      return
    }

    const filtered = patients.filter((p) => {
      const result = p.results?.[0]
      if (!result) return false

      const prob = result.mortality_probability || 0

      // 1. Check Mortality Filter
      if (riskFilter) {
        if (riskFilter === 'high' && prob <= 60) return false
        if (riskFilter === 'moderate' && (prob < 20 || prob > 60)) return false
        if (riskFilter === 'low' && prob >= 20) return false
      }

      // 2. Check Cardiac Filter
      if (cardiacFilter === 'high') {
        const hScore = result.heart_risk_score || 0
        const hRisk = result.heart_risk || ''
        // Returns false if NOT high risk or high score
        if (!hRisk.includes('High') && hScore <= 5) return false
      }

      return true
    })

    setFilteredPatients(filtered)
  }, [patients, riskFilter, cardiacFilter])

  const fetchPatients = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data, error: dbError } = await supabase
        .from('patients')
        .select(`
          id,
          patient_name,
          age,
          created_at,
          results (
            mortality_risk,
            mortality_probability,
            status,
            heart_risk,
            heart_risk_score
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (dbError) throw dbError
      setPatients(data || [])
    } catch (err: any) {
      console.error('[v0] Error fetching patients:', err)
      setError(err.message || 'Failed to load patients')
    } finally {
      setIsLoading(false)
    }
  }

  // --- HELPER: Mortality Colors ---
  const getRiskColor = (label: string) => {
    if (label === 'High Risk') return 'bg-destructive/10 text-destructive border-destructive/20'
    if (label === 'Moderate Risk') return 'bg-warning-amber/10 text-warning-amber border-warning-amber/20'
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }

  // --- HELPER: Cardiac Colors ---
  const getCardiacColor = (risk: string) => {
    if (!risk) return 'bg-secondary text-muted-foreground'
    if (risk.includes('High')) return 'bg-destructive/10 text-destructive border-destructive/20'
    if (risk.includes('Moderate')) return 'bg-warning-amber/10 text-warning-amber border-warning-amber/20'
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }

  const getStatusColor = (status: string) => {
    return status === 'ICU' ? 'text-destructive font-bold' : 'text-emerald-500'
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <button onClick={() => router.push('/analytics')} className="hover:text-primary transition-colors">
              Analytics Dashboard
            </button>
            <span>/</span>
            <span className="text-foreground font-medium">Patients</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Patient Records</h1>
                <p className="mt-1 text-muted-foreground">
                  {riskFilter ? (
                    <>Showing <span className="font-semibold capitalize">{riskFilter}</span> mortality risk patients</>
                  ) : cardiacFilter === 'high' ? (
                    <>Showing <span className="font-semibold text-pink-500">High Cardiac Risk</span> patients</>
                  ) : (
                    <>View all patient assessments and health records</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {(riskFilter || cardiacFilter) && (
                <Button
                  onClick={() => router.push('/patients')}
                  variant="outline"
                  className="border-dashed"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filter
                </Button>
              )}
              <Button onClick={() => router.push('/patient-input')}>
                New Assessment
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/5 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading patient registry...</p>
            </div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/50">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold">No patients found</h3>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or add a new patient.</p>
            <Button
              onClick={() => router.push('/patient-input')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Start Analysis
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPatients.map((patient) => {
              const result = patient.results && patient.results.length > 0 ? patient.results[0] : null

              let displayRiskLabel = "Low Risk"
              let prob = 0

              if (result) {
                prob = result.mortality_probability || 0
                if (prob > 60) displayRiskLabel = "High Risk"
                else if (prob >= 20) displayRiskLabel = "Moderate Risk"
                else displayRiskLabel = "Low Risk"
              }

              return (
                <button
                  key={patient.id}
                  onClick={() => router.push(`/patients/${patient.id}`)}
                  className="group relative rounded-xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 text-left"
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        {patient.patient_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                          {patient.patient_name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span>Age: {patient.age}</span>
                          <span>•</span>
                          <span>{new Date(patient.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    {result && (
                      <div className="flex flex-wrap items-center justify-end gap-3">

                        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${getRiskColor(displayRiskLabel)}`}>
                          <Activity className="h-4 w-4" />
                          <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-bold opacity-70">Mortality</span>
                            <span className="text-sm font-bold">{displayRiskLabel}</span>
                          </div>
                        </div>

                        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border ${getCardiacColor(result.heart_risk || '')}`}>
                          <Heart className="h-4 w-4" />
                          <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-bold opacity-70">Cardiac</span>
                            <span className="text-sm font-bold">{result.heart_risk || 'N/A'}</span>
                          </div>
                        </div>

                        <div className={`ml-2 text-sm font-bold ${getStatusColor(result.status)}`}>
                          {result.status}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                    <span className="text-xs text-muted-foreground"></span>
                    <div className="flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View Full Report <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}