'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DashboardLayout } from '@/components/dashboard-layout'
import { Loader2 } from 'lucide-react'

export default function DebugPage() {
  const [url, setUrl] = useState('https://unstagily-unextenuated-ashely.ngrok-free.dev/predict')
  const [response, setResponse] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const testPayloads = [
    {
      name: 'Current Payload',
      data: {
        age: 65,
        sodium: 135,
        creatinine: 1.2,
        bilirubin: 1.0,
        inr: 1.1,
        platelet_count: 250,
        bun: 18,
        hemoglobin: 14,
        wbc: 7.5,
        systolic_bp: 120,
        heart_rate: 75,
      },
    },
    {
      name: 'Snake Case Payload',
      data: {
        age: 65,
        sodium: 135,
        creatinine: 1.2,
        bilirubin: 1.0,
        inr: 1.1,
        platelet_count: 250,
        bun: 18,
        hemoglobin: 14,
        wbc: 7.5,
        systolic_bp: 120,
        heart_rate: 75,
      },
    },
  ]

  const testAPI = async (payload: any) => {
    setIsLoading(true)
    try {
      console.log('[v0] Testing payload:', payload)
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      console.log('[v0] Response status:', res.status)
      console.log('[v0] Response text:', text)

      setResponse(`Status: ${res.status}\n\n${text}`)
    } catch (err) {
      console.error('[v0] Error:', err)
      setResponse(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl p-6">
        <h1 className="mb-6 text-3xl font-bold text-foreground">API Debug</h1>

        <div className="rounded-xl border border-border/50 bg-card p-6">
          <Label className="block text-foreground">API URL</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="mt-2"
          />

          <div className="mt-6 space-y-3">
            {testPayloads.map((test) => (
              <Button
                key={test.name}
                onClick={() => testAPI(test.data)}
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Test: {test.name}
              </Button>
            ))}
          </div>

          {response && (
            <div className="mt-6 rounded-lg bg-background p-4">
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-sm text-foreground/70">
                {response}
              </pre>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}
