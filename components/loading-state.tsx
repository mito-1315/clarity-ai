"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useState } from "react"

const loadingMessages = [
  "Extracting ZIP contents...",
  "Calculating SHA-256 hashes...",
  "Detecting duplicate files...",
  "Analyzing file metadata...",
  "Identifying forgotten files...",
  "Scanning for screenshots...",
  "Categorizing file types...",
  "Creating cleaned archive...",
]

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="border-2 border-border bg-card">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="h-20 w-20 animate-spin rounded-full border-4 border-border border-t-primary" />
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>

            <div className="text-center">
              <h3 className="mb-2 text-xl font-semibold text-foreground">Analyzing Your Archive</h3>
              <p className="text-sm text-muted-foreground animate-pulse">{loadingMessages[messageIndex]}</p>
            </div>

            <div className="w-full max-w-xs">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full animate-pulse bg-primary" style={{ width: "60%" }} />
              </div>
            </div>

            <div className="rounded-lg bg-secondary/30 p-4 text-center">
              <p className="text-xs text-muted-foreground">
                Your files are being processed in a secure, isolated sandbox.
                <br />
                All data will be permanently deleted after analysis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
