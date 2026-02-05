"use client"

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface ClinicalFlags {
  renal_dysfunction: boolean
  hyponatremia: boolean
  severe_anemia: boolean
  leukocytosis: boolean
}

interface ClinicalFlagsPanelProps {
  flags: ClinicalFlags
}

const flagInfo = {
  renal_dysfunction: {
    label: "Renal Dysfunction",
    description: "Elevated creatinine indicating kidney impairment",
  },
  hyponatremia: {
    label: "Hyponatremia",
    description: "Low sodium levels in the blood",
  },
  severe_anemia: {
    label: "Severe Anemia",
    description: "Critically low hemoglobin levels",
  },
  leukocytosis: {
    label: "Leukocytosis",
    description: "Elevated white blood cell count",
  },
}

export function ClinicalFlagsPanel({ flags }: ClinicalFlagsPanelProps) {
  const activeFlags = Object.entries(flags).filter(([, value]) => value)
  const hasActiveFlags = activeFlags.length > 0

  return (
    <div className="rounded-2xl border border-border/50 bg-card/80 p-6 backdrop-blur-xl">
      <div className="mb-4 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            hasActiveFlags ? "bg-alert-red/20" : "bg-success-green/20"
          }`}
        >
          <AlertTriangle
            className={`h-5 w-5 ${hasActiveFlags ? "text-alert-red" : "text-success-green"}`}
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Clinical Warning Panel</h3>
          <p className="text-sm text-muted-foreground">
            {hasActiveFlags
              ? `${activeFlags.length} clinical warning${activeFlags.length > 1 ? "s" : ""} detected`
              : "No critical warnings detected"}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(flagInfo).map(([key, info]) => {
          const isActive = flags[key as keyof ClinicalFlags]
          return (
            <div
              key={key}
              className={`relative overflow-hidden rounded-xl border p-4 transition-all ${
                isActive
                  ? "border-alert-red/50 bg-alert-red/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                  : "border-success-green/30 bg-success-green/5"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    {isActive ? (
                      <XCircle className="h-5 w-5 text-alert-red" />
                    ) : (
                      <CheckCircle className="h-5 w-5 text-success-green" />
                    )}
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        isActive ? "text-alert-red" : "text-success-green"
                      }`}
                    >
                      {isActive ? "Detected" : "Normal"}
                    </span>
                  </div>
                  <h4 className="font-semibold text-foreground">{info.label}</h4>
                  <p className="mt-1 text-xs text-muted-foreground">{info.description}</p>
                </div>
              </div>
              {/* Glow effect for active flags */}
              {isActive && (
                <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-alert-red/20 blur-2xl" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
