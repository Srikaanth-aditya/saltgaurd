"use client"

import { useEffect, useState } from "react"

interface RiskMeterProps {
  value: number
  maxValue: number
  size: number
  color: string // Changed from strict union to string to prevent type crashes
}

export function RiskMeter({ value, maxValue, size, color }: RiskMeterProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // 1. Define color configurations with a fallback
  const colorMap: Record<string, { stroke: string; bg: string }> = {
    red: { stroke: "#ef4444", bg: "rgba(239, 68, 68, 0.2)" },
    green: { stroke: "#10b981", bg: "rgba(16, 185, 129, 0.2)" },
    amber: { stroke: "#f59e0b", bg: "rgba(245, 158, 11, 0.2)" },
    yellow: { stroke: "#eab308", bg: "rgba(234, 179, 8, 0.2)" },
    blue: { stroke: "#3b82f6", bg: "rgba(59, 130, 246, 0.2)" },
  }

  // 2. Safely retrieve config, defaulting to 'green' if the key doesn't exist
  const config = colorMap[color] || colorMap["green"]

  const radius = 45
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max(value / maxValue, 0), 1)
  const dashoffset = circumference - progress * circumference

  if (!mounted) return null

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg
        className="h-full w-full -rotate-90 transform"
        viewBox="0 0 100 100"
      >
        {/* Background Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={config.bg}
          strokeWidth="8"
        />
        {/* Progress Circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={config.stroke} // This is where it was crashing
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-bold" style={{ color: config.stroke }}>
          {Math.round(value)}%
        </span>
      </div>
    </div>
  )
}