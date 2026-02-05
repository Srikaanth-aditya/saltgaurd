'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { DashboardLayout } from '@/components/dashboard-layout'
import { createClient } from '@/lib/supabase/client'
import { BarChart, TrendingUp, Calendar, Heart, Activity, AlertTriangle, Users } from 'lucide-react'

interface AggregatedData {
  totalPatients: number
  highRiskCount: number
  moderateRiskCount: number
  lowRiskCount: number
  cardiacHighRiskCount: number
  latestAssessments: any[]
}

export default function AnalyticsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [data, setData] = useState<AggregatedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const supabase = createClient()

      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select(`
          id,
          patient_name,
          created_at,
          results (
            mortality_risk,
            mortality_probability,
            heart_risk,
            heart_risk_score
          )
        `)
        .eq('user_id', user?.id || '')
        .order('created_at', { ascending: false })

      if (patientsError) throw patientsError

      let high = 0
      let moderate = 0
      let low = 0
      let cardiacHigh = 0

      patientsData?.forEach(p => {
        const result = p.results?.[0]
        if (!result) return

        const prob = result.mortality_probability || 0

        if (prob > 60) high++
        else if (prob >= 20) moderate++
        else low++

        const hScore = result.heart_risk_score || 0
        const hRisk = result.heart_risk || ''
        if (hRisk.includes('High') || hScore > 5) {
          cardiacHigh++
        }
      })

      setData({
        totalPatients: patientsData?.length || 0,
        highRiskCount: high,
        moderateRiskCount: moderate,
        lowRiskCount: low,
        cardiacHighRiskCount: cardiacHigh,
        latestAssessments: patientsData?.slice(0, 10) || [],
      })

    } catch (err) {
      console.error('[v0] Error fetching analytics:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getRiskColor = (prob: number) => {
    if (prob > 60) return 'bg-destructive/10 text-destructive border-destructive/20'
    if (prob >= 20) return 'bg-warning-amber/10 text-warning-amber border-warning-amber/20'
    return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }

  const getRiskLabel = (prob: number) => {
    if (prob > 60) return 'High Risk'
    if (prob >= 20) return 'Moderate Risk'
    return 'Low Risk'
  }

  if (isLoading || !data) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-muted-foreground">Compiling clinical data...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <BarChart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="mt-1 text-muted-foreground">Real-time patient population health overview</p>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <button
            onClick={() => router.push('/patients')}
            className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50 text-left"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                <h3 className="mt-2 text-4xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {data.totalPatients}
                </h3>
              </div>
              <Users className="h-8 w-8 text-primary opacity-20 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="mt-4 text-xs font-medium text-primary flex items-center gap-1">
              View All Records <TrendingUp className="h-3 w-3" />
            </p>
          </button>

          <button
            onClick={() => router.push('/patients?risk=high')}
            className="group relative overflow-hidden rounded-2xl border border-destructive/20 bg-destructive/5 p-6 transition-all hover:bg-destructive/10 text-left"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-destructive uppercase tracking-wide">Critical Risk</p>
                <h3 className="mt-2 text-4xl font-bold text-destructive">
                  {data.highRiskCount}
                </h3>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive opacity-50 group-hover:scale-110 transition-transform" />
            </div>
            <p className="mt-4 text-xs text-destructive/80 font-medium">
              Requires Immediate Attention
            </p>
          </button>

          <button
            onClick={() => router.push('/patients?risk=moderate')}
            className="group relative overflow-hidden rounded-2xl border border-warning-amber/20 bg-warning-amber/5 p-6 transition-all hover:bg-warning-amber/10 text-left"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-warning-amber uppercase tracking-wide">Moderate Risk</p>
                <h3 className="mt-2 text-4xl font-bold text-warning-amber">
                  {data.moderateRiskCount}
                </h3>
              </div>
              <Activity className="h-8 w-8 text-warning-amber opacity-50 group-hover:rotate-12 transition-transform" />
            </div>
            <p className="mt-4 text-xs text-warning-amber/80 font-medium">
              Needs Regular Monitoring
            </p>
          </button>

          {/* Cardiac High Risk (Clickable now) */}
          <button
            onClick={() => router.push('/patients?cardiac=high')}
            className="group relative overflow-hidden rounded-2xl border border-pink-500/20 bg-pink-500/5 p-6 transition-all hover:bg-pink-500/10 text-left"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-pink-600 uppercase tracking-wide">Cardiac Alert</p>
                <h3 className="mt-2 text-4xl font-bold text-pink-600">
                  {data.cardiacHighRiskCount}
                </h3>
              </div>
              <Heart className="h-8 w-8 text-pink-600 opacity-50 group-hover:scale-110 transition-transform" />
            </div>
            <p className="mt-4 text-xs text-pink-600/80 font-medium">
              Patients with High Heart Scores
            </p>
          </button>
        </div>

        {/* Latest Assessments */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto">
              {data.latestAssessments.length > 0 ? (
                <div className="divide-y divide-border/50">
                  {data.latestAssessments.map((p) => {
                    const result = p.results?.[0]
                    const prob = result?.mortality_probability || 0

                    return (
                      <button
                        key={p.id}
                        onClick={() => router.push(`/patients/${p.id}`)}
                        className="w-full flex items-center justify-between p-5 hover:bg-secondary/20 transition-colors text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            {p.patient_name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{p.patient_name}</p>
                            <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {result?.heart_risk_score > 0 && (
                            <div className="hidden sm:flex flex-col items-end mr-4">
                              <span className="text-[10px] uppercase font-bold text-muted-foreground">Heart Score</span>
                              <div className="flex items-center gap-1 text-xs font-bold">
                                <Heart className="h-3 w-3 text-pink-500" />
                                {result.heart_risk_score}/10
                              </div>
                            </div>
                          )}
                          <div className="text-right">
                            <div className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border mb-1 inline-block ${getRiskColor(prob)}`}>
                              {getRiskLabel(prob)}
                            </div>
                            <p className="text-sm font-bold text-foreground">{prob.toFixed(1)}% Prob.</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground font-medium">No assessments recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}