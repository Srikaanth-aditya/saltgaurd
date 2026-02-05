"use client"

import { useState } from "react"
import { AlertTriangle, X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ICUAlertBannerProps {
  patientName: string
}

export function ICUAlertBanner({ patientName }: ICUAlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-destructive/90 via-destructive to-destructive/90">
      {/* Animated stripes */}
      <div className="absolute inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg,
              transparent,
              transparent 10px,
              rgba(255,255,255,0.1) 10px,
              rgba(255,255,255,0.1) 20px
            )`,
            animation: "slide 20s linear infinite"
          }}
        />
      </div>

      {/* Pulsing glow effect */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative flex items-center justify-between gap-4 px-4 py-3 lg:px-6">
        <div className="flex items-center gap-3">
          {/* Animated alert icon */}
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-white/30" />
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <AlertTriangle className="h-4 w-4 text-white" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="text-sm font-bold text-white sm:text-base">
              ICU ALERT
            </span>
            <span className="hidden text-white/60 sm:inline">|</span>
            <span className="text-xs text-white/90 sm:text-sm">
              Critical risk level detected for {patientName}. Immediate assessment recommended.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="hidden bg-white/20 text-white hover:bg-white/30 sm:flex"
          >
            <Bell className="mr-2 h-4 w-4" />
            Page Team
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-white/80 hover:bg-white/20 hover:text-white"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(0); }
          100% { transform: translateX(40px); }
        }
      `}</style>
    </div>
  )
}
