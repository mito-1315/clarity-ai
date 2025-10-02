"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import type { AnalysisReport } from "@/lib/types"
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface ResultsDashboardProps {
  report: AnalysisReport
  downloadToken: string
  onReset: () => void
}

export function ResultsDashboard({ report, downloadToken, onReset }: ResultsDashboardProps) {
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
      document.body.removeChild(a)
    } catch (error) {
      console.error("[v0] Download error:", error)
      alert("Failed to download cleaned ZIP file")
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
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero Section - Reduction Percentage */}
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
          <h2 className="mb-2 text-6xl font-bold text-primary">{report.reductionPercentage}%</h2>
          <p className="mb-6 text-xl text-muted-foreground">Space Reduction Achieved</p>
          <div className="mx-auto mb-6 max-w-md">
            <div className="mb-2 flex justify-between text-sm text-muted-foreground">
              <span>{report.originalSizeMB} MB</span>
              <span>{report.cleanedSizeMB} MB</span>
            </div>
            <Progress value={100 - report.reductionPercentage} className="h-3" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
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
              Download Cleaned ZIP
            </Button>
            <Button onClick={onReset} size="lg" variant="outline">
              Analyze Another File
            </Button>
          </div>
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
