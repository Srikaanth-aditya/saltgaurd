"use client"

import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TrendingUp, TrendingDown, Loader2, AlertCircle } from "lucide-react"

// Direct Initialization using your env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

interface PatientRecord {
  id: string
  patient_name: string
  age: number
  created_at: string
  mortality_risk: string
  mortality_probability: number
  heart_attack_risk: string
  shock_index: number
  status?: string
}

function RiskBadge({ value }: { value: number }) {
  const isHigh = value >= 50
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${isHigh
          ? "bg-destructive/20 text-destructive border border-destructive/30"
          : "bg-emerald-500/20 text-emerald-500 border border-emerald-500/30"
        }`}
    >
      {value.toFixed(1)}%
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const isICU = status?.toUpperCase() === "ICU" || status?.includes("High")
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${isICU
          ? "bg-destructive/20 text-destructive border border-destructive/30"
          : "bg-primary/20 text-primary border border-primary/30"
        }`}
    >
      {status || "Stable"}
    </span>
  )
}

function TrendIndicator({
  current,
  previous,
}: {
  current: number
  previous?: number
}) {
  if (previous === undefined) return <span className="text-muted-foreground text-xs">—</span>

  const diff = current - previous
  if (Math.abs(diff) < 0.1) {
    return <span className="text-muted-foreground text-xs">Stable</span>
  }

  return (
    <div className="flex items-center justify-center gap-1">
      {diff > 0 ? (
        <>
          <TrendingUp className="h-3 w-3 text-destructive" />
          <span className="text-xs text-destructive">+{diff.toFixed(1)}%</span>
        </>
      ) : (
        <>
          <TrendingDown className="h-3 w-3 text-emerald-500" />
          <span className="text-xs text-emerald-500">{diff.toFixed(1)}%</span>
        </>
      )}
    </div>
  )
}

export function PatientHistoryTable() {
  const [patients, setPatients] = useState<PatientRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPatients = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Fetching directly from the flat assessments table
      const { data, error: dbError } = await supabase
        .from("patient_assessments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      if (dbError) throw dbError

      setPatients(data || [])
    } catch (err: any) {
      console.error("History fetch error:", err.message)
      setError("Failed to load clinical history")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 flex items-center gap-3">
        <AlertCircle className="text-destructive h-5 w-5" />
        <p className="text-destructive font-medium">{error}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card/80 p-12 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Synchronizing history with Supabase...</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border/30 flex justify-between items-center bg-secondary/10">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Assessments</h3>
          <p className="text-xs text-muted-foreground">Historical records retrieved from live database</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
          {patients.length} Records
        </Badge>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 bg-muted/30">
              <TableHead className="text-foreground font-bold">Patient Details</TableHead>
              <TableHead className="text-center text-foreground font-bold">Assessment Date</TableHead>
              <TableHead className="text-center text-foreground font-bold">Mortality Risk</TableHead>
              <TableHead className="text-center text-foreground font-bold">Heart Risk</TableHead>
              <TableHead className="text-center text-foreground font-bold">Shock Index</TableHead>
              <TableHead className="text-center text-foreground font-bold">Trend</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {patients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                  No records found in the `patient_assessments` table.
                </TableCell>
              </TableRow>
            ) : (
              patients.map((row, index) => (
                <TableRow
                  key={row.id}
                  className="border-border/30 hover:bg-secondary/30 transition-colors"
                >
                  <TableCell>
                    <div>
                      <p className="font-bold text-foreground capitalize">
                        {row.patient_name || "Anonymous Patient"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.age}y • ID: {row.id.slice(0, 8)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <p className="text-sm font-medium">
                      {new Date(row.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">
                      {new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <RiskBadge value={row.mortality_probability || 0} />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {row.mortality_risk}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`text-sm font-bold ${row.heart_attack_risk === "High"
                          ? "text-destructive"
                          : "text-emerald-500"
                        }`}
                    >
                      {row.heart_attack_risk}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-mono font-bold">
                    {(row.shock_index || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <TrendIndicator
                      current={row.mortality_probability || 0}
                      previous={patients[index + 1]?.mortality_probability}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Simple Badge component if not already in your UI folder
function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${className}`}>
      {children}
    </span>
  )
}