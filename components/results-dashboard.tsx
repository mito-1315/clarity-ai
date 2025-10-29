"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { AnalysisReport } from "@/lib/types"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { GeminiApiModal } from "./ai-api-modal"

interface ResultsDashboardProps {
  report: AnalysisReport
  downloadToken: string
  onReset: () => void
}

export function ResultsDashboard({ report, downloadToken, onReset }: ResultsDashboardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/download/${downloadToken}`)

      if (!response.ok) {
        throw new Error("Download failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "clarity-cleaned.zip"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)    } catch (error) {
      console.error("[v0] Download error:", error)
      alert("Failed to download cleaned ZIP file")
    }
  }
  
  const handleDownloadReport = () => {
    setReportError(null)
    setIsModalOpen(true)
  }
  
  const handleGeminiSubmit = async (apiKey: string, provider: 'huggingface' | 'openai') => {
    setIsGeneratingReport(true)
    setReportError(null)
    
    try {
      const response = await fetch("/api/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          provider,
          analysisReport: report,
          downloadToken,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to generate report" }))
        throw new Error(errorData.error || "Failed to generate report")
      }      const htmlContent = await response.text()
      
      // Open HTML content in a new window for printing to PDF
      const newWindow = window.open('', '_blank')
      if (newWindow) {
        newWindow.document.write(htmlContent)
        newWindow.document.close()
        // The print dialog will be triggered automatically by the HTML
      } else {
        // Fallback: create a blob and download as HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `clarity-ai-report-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
      
      setIsModalOpen(false)
    } catch (error) {
      console.error("Report generation failed:", error)
      setReportError(error instanceof Error ? error.message : "Failed to generate report")
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const chartColors = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ]

  return (
    <div className="mx-auto max-w-6xl space-y-8">      {/* Hero Section - Reduction Percentage */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardContent className="p-12 text-center">
          <div className="mb-4 inline-flex items-center justify-center rounded-full bg-primary/10 p-4">
            <svg className="h-12 w-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mb-2 text-4xl font-bold text-foreground">
            {Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)}% Reduction
          </h2>
          <p className="mb-6 text-lg text-muted-foreground">
            Your archive was optimized from {report.originalSizeMB}MB to {report.cleanedSizeMB}MB
          </p>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleDownload}
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Cleaned Archive
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={handleDownloadReport}
              className="gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download Report
            </Button>
          </div>
          
          <Button variant="ghost" onClick={onReset} className="mt-4">
            Analyze Another File
          </Button>
        </CardContent>
      </Card>

      {/* Statistics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Duplicate Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{report.duplicateFiles}</div>
            <p className="mt-1 text-xs text-muted-foreground">{report.duplicateSizeRemovedMB} MB removed</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forgotten Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{report.archivedOldFiles}</div>
            <p className="mt-1 text-xs text-muted-foreground">{report.forgottenFileSizeMB} MB archived</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Screenshots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{report.unwantedScreenshots}</div>
            <p className="mt-1 text-xs text-muted-foreground">{report.screenshotSizeMB} MB removed</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Large Files</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{report.largeFileCount}</div>
            <p className="mt-1 text-xs text-muted-foreground">{report.largeFileSizeMB} MB total</p>
          </CardContent>
        </Card>
      </div>

      {/* File Type Breakdown Chart */}
      <Card className="bg-card/80 border-border">
        <CardHeader>
          <CardTitle className="text-foreground">File Type Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">Distribution of files in your cleaned archive</p>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              size: {
                label: "Size (MB)",
                color: "hsl(var(--chart-1))",
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report.fileTypeBreakdown}>
                <XAxis
                  dataKey="type"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}MB`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="sizeMB" radius={[8, 8, 0, 0]}>
                  {report.fileTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {report.fileTypeBreakdown.map((item, index) => (
              <div key={item.type} className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: chartColors[index % chartColors.length] }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{item.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.count} files • {item.sizeMB} MB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{report.totalFilesAnalyzed}</div>
              <div className="text-sm text-muted-foreground">Files Analyzed</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">{report.totalFilesRemoved}</div>
              <div className="text-sm text-muted-foreground">Files Removed</div>
            </div>
            <div className="h-12 w-px bg-border" />
            <div>
              <div className="text-2xl font-bold text-foreground">
                {report.totalFilesAnalyzed - report.totalFilesRemoved}
              </div>
              <div className="text-sm text-muted-foreground">Files Kept</div>
            </div>          </div>
        </CardContent>
      </Card>      <GeminiApiModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleGeminiSubmit}
        isLoading={isGeneratingReport}
        error={reportError}
      />
    </div>
  )
}
