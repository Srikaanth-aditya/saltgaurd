"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let particles: Particle[] = []
    let pulses: Pulse[] = []

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    class Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      opacity: number

      constructor() {
        this.x = Math.random() * (canvas?.width || 0)
        this.y = Math.random() * (canvas?.height || 0)
        this.size = Math.random() * 2 + 0.5
        this.speedX = (Math.random() - 0.5) * 0.5
        this.speedY = (Math.random() - 0.5) * 0.5
        this.opacity = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.speedX
        this.y += this.speedY

        if (canvas) {
          if (this.x > canvas.width) this.x = 0
          if (this.x < 0) this.x = canvas.width
          if (this.y > canvas.height) this.y = 0
          if (this.y < 0) this.y = canvas.height
        }
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(45, 212, 191, ${this.opacity})`
        ctx.fill()
      }
    }

    class Pulse {
      x: number
      y: number
      radius: number
      maxRadius: number
      opacity: number

      constructor() {
        this.x = Math.random() * (canvas?.width || 0)
        this.y = Math.random() * (canvas?.height || 0)
        this.radius = 0
        this.maxRadius = Math.random() * 100 + 50
        this.opacity = 0.3
      }

      update() {
        this.radius += 0.5
        this.opacity = 0.3 * (1 - this.radius / this.maxRadius)
        return this.radius < this.maxRadius
      }

      draw() {
        if (!ctx) return
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(45, 212, 191, ${this.opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }

    // Initialize particles
    for (let i = 0; i < 100; i++) {
      particles.push(new Particle())
    }

    // ECG line data
    let ecgOffset = 0
    const ecgHeight = canvas.height / 2

    const drawECG = () => {
      if (!ctx || !canvas) return
      
      ctx.beginPath()
      ctx.strokeStyle = "rgba(45, 212, 191, 0.15)"
      ctx.lineWidth = 2

      for (let x = 0; x < canvas.width + 100; x += 1) {
        const adjustedX = (x + ecgOffset) % (canvas.width + 100)
        let y = ecgHeight

        // Create ECG-like pattern
        const patternX = (adjustedX % 200) / 200

        if (patternX < 0.1) {
          y = ecgHeight
        } else if (patternX < 0.15) {
          y = ecgHeight - 20
        } else if (patternX < 0.2) {
          y = ecgHeight + 10
        } else if (patternX < 0.25) {
          y = ecgHeight - 80 * Math.sin((patternX - 0.2) * Math.PI / 0.05)
        } else if (patternX < 0.3) {
          y = ecgHeight + 30 * Math.sin((patternX - 0.25) * Math.PI / 0.05)
        } else if (patternX < 0.4) {
          y = ecgHeight - 15 * Math.sin((patternX - 0.3) * Math.PI / 0.1)
        } else {
          y = ecgHeight
        }

        if (adjustedX === 0) {
          ctx.moveTo(adjustedX, y)
        } else {
          ctx.lineTo(adjustedX, y)
        }
      }
      ctx.stroke()
    }

    const drawGrid = () => {
      if (!ctx || !canvas) return
      
      ctx.strokeStyle = "rgba(45, 212, 191, 0.03)"
      ctx.lineWidth = 1

      const gridSize = 40

      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }
    }

    const connectParticles = () => {
      if (!ctx) return
      
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(45, 212, 191, ${0.1 * (1 - distance / 100)})`
            ctx.lineWidth = 0.5
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
          }
        }
      }
    }

    const animate = () => {
      if (!ctx || !canvas) return

      // Clear canvas with fade effect
      ctx.fillStyle = "rgba(15, 23, 42, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw background gradient
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      )
      gradient.addColorStop(0, "rgba(15, 40, 60, 0.8)")
      gradient.addColorStop(1, "rgba(10, 20, 35, 1)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Draw grid
      drawGrid()

      // Draw ECG
      ecgOffset += 1
      drawECG()

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update()
        particle.draw()
      })

      // Connect nearby particles
      connectParticles()

      // Add new pulses occasionally
      if (Math.random() < 0.02) {
        pulses.push(new Pulse())
      }

      // Update and draw pulses
      pulses = pulses.filter((pulse) => {
        const alive = pulse.update()
        pulse.draw()
        return alive
      })

      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 h-full w-full"
      style={{ background: "linear-gradient(135deg, #0a1628 0%, #0f2942 50%, #0a1628 100%)" }}
    />
  )
}
