"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ResultsDashboard } from "./results-dashboard"
import { LoadingState } from "./loading-state"
import type { AnalysisReport } from "@/lib/types"

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB in bytes

type ViewState = "upload" | "loading" | "results"

export function UploadInterface() {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewState, setViewState] = useState<ViewState>("upload")
  const [analysisReport, setAnalysisReport] = useState<(AnalysisReport & { downloadToken: string }) | null>(null)

  const validateFile = (file: File): string | null => {
    // Check file type
    if (
      !file.name.endsWith(".zip") &&
      file.type !== "application/zip" &&
      file.type !== "application/x-zip-compressed"
    ) {
      return "Please upload a valid ZIP file"
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds 200MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`
    }

    // Check if file is empty
    if (file.size === 0) {
      return "File is empty"
    }

    return null
  }

  const handleFile = useCallback((file: File) => {
    setError(null)
    const validationError = validateFile(file)

    if (validationError) {
      setError(validationError)
      setFile(null)
      return
    }

    setFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        handleFile(droppedFile)
      }
    },
    [handleFile],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFile(selectedFile)
      }
    },
    [handleFile],
  )

  const handleAnalyze = async () => {
    if (!file) return

    setViewState("loading")
    setError(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Analysis failed")
      }

      const report = await response.json()
      setAnalysisReport(report)
      setViewState("results")

      console.log("[v0] Analysis complete:", report)
    } catch (error) {
      console.error("[v0] Analysis error:", error)
      setError(error instanceof Error ? error.message : "Analysis failed")
      setViewState("upload")
    }
  }

  const handleReset = () => {
    setFile(null)
    setError(null)
    setViewState("upload")
    setAnalysisReport(null)
  }

  if (viewState === "loading") {
    return <LoadingState />
  }

  if (viewState === "results" && analysisReport) {
    return (
      <ResultsDashboard report={analysisReport} downloadToken={analysisReport.downloadToken} onReset={handleReset} />
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Card className="border-2 border-border bg-card">
        <CardContent className="p-8">
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-all ${
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30"
              }`}
            >
              <input
                type="file"
                accept=".zip,application/zip,application/x-zip-compressed"
                onChange={handleFileInput}
                className="absolute inset-0 cursor-pointer opacity-0"
                id="file-upload"
              />

              <div className="mb-4 rounded-full bg-primary/10 p-4">
                <svg className="h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <h3 className="mb-2 text-xl font-semibold text-foreground">Drop your ZIP file here</h3>
              <p className="mb-4 text-sm text-muted-foreground">or click to browse</p>
              <p className="text-xs text-muted-foreground">Maximum file size: 200MB</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-4 rounded-lg bg-secondary/30 p-4">
                <div className="rounded-lg bg-primary/10 p-3">
                  <svg className="h-8 w-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground truncate">{file.name}</h4>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              <Button
                onClick={handleAnalyze}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                Analyze ZIP File
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="mb-2 text-3xl font-bold text-primary">SHA-256</div>
            <p className="text-sm text-muted-foreground">Cryptographic hashing for duplicate detection</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="mb-2 text-3xl font-bold text-primary">Sandboxed</div>
            <p className="text-sm text-muted-foreground">Isolated processing environment for security</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="p-6">
            <div className="mb-2 text-3xl font-bold text-primary">Ephemeral</div>
            <p className="text-sm text-muted-foreground">Files deleted immediately after processing</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
