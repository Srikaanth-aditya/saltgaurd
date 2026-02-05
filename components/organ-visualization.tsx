"use client"

interface OrganVisualizationProps {
  organ: "heart" | "liver"
  riskLevel: number
  metrics: Array<{ label: string; value: string; unit: string }>
}

export function OrganVisualization({ organ, riskLevel, metrics }: OrganVisualizationProps) {
  const isHeart = organ === "heart"
  
  const getRiskColor = (risk: number) => {
    if (risk < 25) return { color: "#2dd4bf", glow: "rgba(45, 212, 191, 0.4)" }
    if (risk < 50) return { color: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)" }
    return { color: "#ef4444", glow: "rgba(239, 68, 68, 0.4)" }
  }

  const { color, glow } = getRiskColor(riskLevel)

  return (
    <div 
      className="relative overflow-hidden rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
      style={{ boxShadow: `0 0 40px ${glow}` }}
    >
      {/* Animated background pulse */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${color}20 0%, transparent 70%)`,
          animation: isHeart ? "pulse 1.5s ease-in-out infinite" : "none"
        }}
      />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:gap-8">
        {/* Organ SVG */}
        <div className="mb-6 flex justify-center lg:mb-0">
          <div className="relative">
            {isHeart ? (
              <HeartSVG color={color} glow={glow} />
            ) : (
              <LiverSVG color={color} glow={glow} />
            )}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex-1">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            {isHeart ? "Cardiac Metrics" : "Hepatic Metrics"}
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-border/30 bg-background/50 p-3"
              >
                <p className="text-xs text-muted-foreground">{metric.label}</p>
                <p className="text-lg font-semibold text-foreground">
                  {metric.value}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    {metric.unit}
                  </span>
                </p>
              </div>
            ))}
          </div>
          
          {/* Risk indicator */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-border/30">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{ 
                    width: `${riskLevel}%`, 
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${glow}`
                  }}
                />
              </div>
            </div>
            <span 
              className="text-sm font-medium"
              style={{ color }}
            >
              {riskLevel}%
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
      `}</style>
    </div>
  )
}

function HeartSVG({ color, glow }: { color: string; glow: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-32 w-32 lg:h-40 lg:w-40"
      style={{ filter: `drop-shadow(0 0 15px ${glow})` }}
    >
      {/* Heart shape */}
      <path
        d="M50 88C50 88 12 60 12 35C12 20 24 10 38 10C46 10 50 16 50 16C50 16 54 10 62 10C76 10 88 20 88 35C88 60 50 88 50 88Z"
        fill="none"
        stroke={color}
        strokeWidth="3"
        className="animate-pulse"
      />
      {/* Inner details */}
      <path
        d="M50 75C50 75 25 55 25 38C25 28 32 22 40 22C46 22 50 28 50 28"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path
        d="M50 28C50 28 54 22 60 22C68 22 75 28 75 38C75 55 50 75 50 75"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Pulse line */}
      <path
        d="M20 50 L35 50 L40 35 L45 65 L50 45 L55 55 L60 50 L80 50"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-pulse"
      />
      {/* Central glow */}
      <circle cx="50" cy="45" r="8" fill={color} opacity="0.2" className="animate-ping" />
    </svg>
  )
}

function LiverSVG({ color, glow }: { color: string; glow: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-32 w-32 lg:h-40 lg:w-40"
      style={{ filter: `drop-shadow(0 0 15px ${glow})` }}
    >
      {/* Liver outline */}
      <path
        d="M15 45C15 35 25 20 45 20C55 20 65 15 75 20C85 25 90 35 90 50C90 65 80 75 65 78C50 81 40 80 30 75C20 70 15 55 15 45Z"
        fill="none"
        stroke={color}
        strokeWidth="3"
      />
      {/* Liver lobes */}
      <path
        d="M50 25C50 25 55 40 55 55C55 70 45 75 45 75"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path
        d="M35 30C35 30 30 45 35 60"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.5"
      />
      <path
        d="M70 30C70 30 75 45 70 65"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        opacity="0.5"
      />
      {/* Blood vessels */}
      <path
        d="M45 40L55 45L50 55L60 60"
        fill="none"
        stroke={color}
        strokeWidth="1"
        opacity="0.4"
      />
      {/* Central indicator */}
      <circle cx="50" cy="50" r="6" fill={color} opacity="0.3" />
      <circle cx="50" cy="50" r="3" fill={color} opacity="0.5" />
    </svg>
  )
}
