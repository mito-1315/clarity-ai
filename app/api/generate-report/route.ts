import { NextRequest, NextResponse } from "next/server"
import { analyzeWithAI } from "@/lib/ai-service"
import type { AnalysisReport } from "@/lib/types"
import type { AIAnalysisResult } from "@/lib/ai-service"

function generateHTMLReport(report: AnalysisReport, aiAnalysis: AIAnalysisResult): string {
  const reductionPercentage = Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)
  const spaceSaved = (report.originalSizeMB - report.cleanedSizeMB).toFixed(1)
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clarity AI - Archive Analysis Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8fafc;
            padding: 40px 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 40px; 
            text-align: center; 
        }
        .header h1 { 
            font-size: 2.5rem; 
            margin-bottom: 10px; 
            font-weight: 700;
        }
        .header .subtitle { 
            font-size: 1.1rem; 
            opacity: 0.9; 
            margin-bottom: 20px;
        }
        .header .meta { 
            font-size: 0.9rem; 
            opacity: 0.8; 
        }
        .content { padding: 40px; }
        .section { margin-bottom: 40px; }
        .section h2 { 
            color: #2d3748; 
            font-size: 1.5rem; 
            margin-bottom: 20px; 
            padding-bottom: 10px;
            border-bottom: 2px solid #e2e8f0;
        }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .metric-card { 
            background: #f7fafc; 
            border: 1px solid #e2e8f0; 
            border-radius: 8px; 
            padding: 24px; 
            text-align: center;
            transition: transform 0.2s;
        }
        .metric-card:hover { transform: translateY(-2px); }
        .metric-value { 
            font-size: 2rem; 
            font-weight: bold; 
            color: #667eea; 
            margin-bottom: 8px;
        }
        .metric-label { 
            font-size: 0.9rem; 
            color: #718096; 
            font-weight: 500;
        }
        .summary-box { 
            background: #edf2f7; 
            border-left: 4px solid #667eea; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 0 8px 8px 0;
        }
        .recommendations, .insights { 
            background: #f7fafc; 
            padding: 24px; 
            border-radius: 8px; 
            margin: 20px 0;
        }
        .recommendations li, .insights li { 
            margin: 12px 0; 
            padding-left: 8px;
            position: relative;
        }
        .recommendations li::before {
            content: "💡";
            position: absolute;
            left: -20px;
        }
        .insights li::before {
            content: "🔍";
            position: absolute;
            left: -20px;
        }
        .file-types { 
            background: #f7fafc; 
            border-radius: 8px; 
            overflow: hidden;
            margin: 20px 0;
        }
        .file-type { 
            display: flex; 
            justify-content: space-between; 
            align-items: center;
            padding: 16px 20px; 
            border-bottom: 1px solid #e2e8f0; 
        }
        .file-type:last-child { border-bottom: none; }
        .file-type:nth-child(even) { background: #ffffff; }
        .cleanup-stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 16px; 
            margin: 20px 0;
        }
        .cleanup-stat { 
            background: white; 
            border: 1px solid #e2e8f0; 
            border-radius: 6px; 
            padding: 16px;
        }
        .cleanup-stat strong { color: #2d3748; }
        .ai-badge { 
            display: inline-block;
            background: ${aiAnalysis.aiGenerated ? '#48bb78' : '#a0aec0'}; 
            color: white; 
            padding: 4px 12px; 
            border-radius: 20px; 
            font-size: 0.8rem; 
            font-weight: 500;
        }
        .footer { 
            background: #2d3748; 
            color: white; 
            padding: 30px; 
            text-align: center; 
            font-size: 0.9rem;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
            .metric-card:hover { transform: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 Clarity AI</h1>
            <div class="subtitle">Archive Analysis Report</div>
            <div class="meta">
                Generated on ${new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} | 
                <span class="ai-badge">${aiAnalysis.provider}</span>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>📊 Executive Summary</h2>
                <div class="summary-box">
                    ${aiAnalysis.summary}
                </div>
            </div>

            <div class="section">
                <h2>🎯 Key Performance Metrics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-value">${reductionPercentage}%</div>
                        <div class="metric-label">Space Reduction</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${spaceSaved}MB</div>
                        <div class="metric-label">Space Saved</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${report.totalFilesRemoved}</div>
                        <div class="metric-label">Files Removed</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${report.totalFilesAnalyzed - report.totalFilesRemoved}</div>
                        <div class="metric-label">Files Kept</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>💡 AI-Powered Recommendations</h2>
                <div class="recommendations">
                    <ol>
                        ${aiAnalysis.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                    </ol>
                </div>
            </div>

            <div class="section">
                <h2>🔍 Strategic Insights</h2>
                <div class="insights">
                    <ul>
                        ${aiAnalysis.insights.map(insight => `<li>${insight}</li>`).join('')}
                    </ul>
                </div>
            </div>

            <div class="section">
                <h2>📁 File Type Distribution</h2>
                <div class="file-types">
                    ${report.fileTypeBreakdown.map(item => {
                      const percentage = ((item.sizeMB / report.cleanedSizeMB) * 100).toFixed(1)
                      return `
                        <div class="file-type">
                            <span><strong>${item.type}</strong> (${item.count} files)</span>
                            <span>${item.sizeMB}MB • ${percentage}%</span>
                        </div>
                      `
                    }).join('')}
                </div>
            </div>

            <div class="section">
                <h2>🔧 Cleanup Performance Details</h2>
                <div class="cleanup-stats">
                    <div class="cleanup-stat">
                        <strong>Duplicate Files</strong><br>
                        ${report.duplicateFiles} removed<br>
                        <small>${report.duplicateSizeRemovedMB}MB saved</small>
                    </div>
                    <div class="cleanup-stat">
                        <strong>Screenshots</strong><br>
                        ${report.unwantedScreenshots} removed<br>
                        <small>${report.screenshotSizeMB}MB saved</small>
                    </div>
                    <div class="cleanup-stat">
                        <strong>Old Files</strong><br>
                        ${report.archivedOldFiles} archived<br>
                        <small>${report.forgottenFileSizeMB}MB optimized</small>
                    </div>
                    <div class="cleanup-stat">
                        <strong>Large Files</strong><br>
                        ${report.largeFileCount} identified<br>
                        <small>${report.largeFileSizeMB}MB total</small>
                    </div>
                </div>
            </div>

            ${aiAnalysis.aiGenerated ? '' : `
            <div class="section">
                <h2>🤖 Technical Analysis</h2>
                <div style="background: #f7fafc; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 0.85rem; white-space: pre-line;">
${aiAnalysis.technicalDetails}
                </div>
            </div>
            `}
        </div>

        <div class="footer">
            <strong>Clarity AI</strong> - Advanced Archive Optimization System<br>
            Report generated for user: ${process.env.NODE_ENV === 'development' ? 'mito-1315' : 'User'} | 
            Analysis Engine: ${report.totalFilesAnalyzed > 1000 ? 'Enterprise' : 'Standard'} Mode
        </div>
    </div>

    <script>
        // Auto-trigger print dialog for PDF saving
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 1000);
        }
    </script>
</body>
</html>
  `
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey = '', provider = 'huggingface', analysisReport, downloadToken } = await request.json()

    if (!analysisReport) {
      return NextResponse.json(
        { error: "Missing analysis report" },
        { status: 400 }
      )
    }

    // Generate AI analysis using the selected provider (works with empty API key)
    const aiAnalysis = await analyzeWithAI(apiKey, analysisReport, provider)

    // Generate HTML report
    const htmlContent = generateHTMLReport(analysisReport, aiAnalysis)
    const htmlBuffer = Buffer.from(htmlContent, 'utf-8')

    return new NextResponse(htmlBuffer, {
      headers: {
        "Content-Type": "text/html",
        "Content-Disposition": `inline; filename="clarity-ai-report-${new Date().toISOString().split('T')[0]}.html"`,
      },
    })
  } catch (error) {
    console.error("Report generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    )
  }
}
