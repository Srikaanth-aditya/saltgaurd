"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
} from "recharts"

interface MedicalChartsProps {
  patientData: any
  results: any
}

export function MedicalCharts({ patientData, results }: MedicalChartsProps) {
  // 1. Creatinine vs Risk Data
  const creatinineData = [
    { name: "Normal Max", value: 1.2, fill: "#10b981" },
    { name: "Patient", value: patientData.creatinine || 0, fill: "#ef4444" },
    { name: "High Risk", value: 2.0, fill: "#7f1d1d" },
  ]

  // 2. Sodium vs Mortality Data (Trend simulation)
  const sodiumTrend = [
    { stage: "Baseline", val: 140 },
    { stage: "Current", val: patientData.sodium || 0 },
    { stage: "Threshold", val: 135 },
  ]

  // 3. Heart Rate vs Shock Index
  const cardiacData = [
    { name: "Heart Rate", value: patientData.heart_rate || 80 },
    { name: "Shock Index", value: (results.shock_index || 0) * 100 }, // Scaled for visibility
  ]

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Creatinine Chart */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase">Creatinine Levels (mg/dL)</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={creatinineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {creatinineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sodium Chart */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase">Sodium & Mortality Correlation</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sodiumTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="stage" fontSize={12} />
              <YAxis domain={[120, 150]} fontSize={12} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={3} dot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Shock Index Chart */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-medium text-muted-foreground uppercase">Vitals vs Shock Index</h3>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cardiacData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" fontSize={12} width={80} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}