import type { AnalysisReport } from "./types"

export interface AIAnalysisResult {
  summary: string
  recommendations: string[]
  insights: string[]
  technicalDetails: string
  aiGenerated: boolean
  provider: string
}

// Hugging Face Inference API (Completely Free!)
async function analyzeWithHuggingFace(apiKey: string, report: AnalysisReport): Promise<AIAnalysisResult> {
  const prompt = `
Analyze this ZIP archive cleanup report:

RESULTS:
- Size: ${report.originalSizeMB}MB → ${report.cleanedSizeMB}MB (${Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)}% reduction)
- Files: ${report.totalFilesAnalyzed} analyzed, ${report.totalFilesRemoved} removed
- Duplicates: ${report.duplicateFiles} files (${report.duplicateSizeRemovedMB}MB saved)
- Screenshots: ${report.unwantedScreenshots} removed (${report.screenshotSizeMB}MB)

Provide brief analysis with summary, 3 recommendations, and key insights.
  `

  try {
    const response = await fetch("https://api-inference.huggingface.co/models/microsoft/DialoGPT-large", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_length: 500,
          temperature: 0.7,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const result = await response.json()
    const text = result[0]?.generated_text || ""
    
    return parseAIResponse(text, report, true, "Hugging Face")
  } catch (error: any) {
    console.log("[AI] Hugging Face failed:", error?.message || error)
    throw error
  }
}

// OpenAI GPT-3.5-turbo (Free credits for new users)
async function analyzeWithOpenAI(apiKey: string, report: AnalysisReport): Promise<AIAnalysisResult> {
  const prompt = `Analyze this ZIP cleanup report and provide insights:
  
Original: ${report.originalSizeMB}MB, Cleaned: ${report.cleanedSizeMB}MB
Reduction: ${Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)}%
Files removed: ${report.totalFilesRemoved}/${report.totalFilesAnalyzed}
Duplicates: ${report.duplicateFiles}, Screenshots: ${report.unwantedScreenshots}

Provide: 1) Summary 2) Top 3 recommendations 3) Key insights`

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const result = await response.json()
    const text = result.choices[0]?.message?.content || ""
    
    return parseAIResponse(text, report, true, "OpenAI GPT-3.5")
  } catch (error: any) {
    console.log("[AI] OpenAI failed:", error?.message || error)
    throw error
  }
}

// Main AI analysis function with multiple providers
export async function analyzeWithAI(
  apiKey: string, 
  report: AnalysisReport,
  provider: 'huggingface' | 'openai' | 'auto' = 'auto'
): Promise<AIAnalysisResult> {
  
  // If no API key provided, immediately use intelligent fallback
  if (!apiKey || apiKey.trim() === '') {
    console.log("[AI] No API key provided, using intelligent fallback")
    return generateIntelligentFallback(report)
  }
  
  const providers = provider === 'auto' 
    ? ['huggingface', 'openai'] 
    : [provider]

  for (const currentProvider of providers) {
    try {
      console.log(`[AI] Trying ${currentProvider}...`)
      
      switch (currentProvider) {
        case 'huggingface':
          return await analyzeWithHuggingFace(apiKey, report)
        case 'openai':
          return await analyzeWithOpenAI(apiKey, report)
        default:
          continue
      }
    } catch (error) {
      console.log(`[AI] ${currentProvider} failed, trying next...`)
      continue
    }
  }
  
  // If all AI providers fail, use intelligent fallback
  console.log("[AI] All providers failed, using intelligent fallback")
  return generateIntelligentFallback(report)
}

function parseAIResponse(text: string, report: AnalysisReport, aiGenerated: boolean, provider: string): AIAnalysisResult {
  try {
    return {
      summary: extractSection(text, "summary") || generateSummary(report),
      recommendations: extractListSection(text, "recommendation") || generateRecommendations(report),
      insights: extractListSection(text, "insight") || generateInsights(report),
      technicalDetails: text,
      aiGenerated,
      provider
    }
  } catch (error) {
    console.log("[AI] Failed to parse response, using fallback")
    return generateIntelligentFallback(report)
  }
}

function extractSection(text: string, sectionName: string): string {
  const regex = new RegExp(`${sectionName}[:\\-]?\\s*([\\s\\S]*?)(?:\\n\\n|\\d+\\)|recommendation|insight|technical)`, 'i')
  const match = text.match(regex)
  return match?.[1]?.trim() || ""
}

function extractListSection(text: string, sectionName: string): string[] {
  const section = extractSection(text, sectionName)
  if (!section) return []
  
  return section
    .split(/[\n•\-\*]\s*/)
    .map(item => item.trim())
    .filter(item => item.length > 10)
    .slice(0, 5)
}

function generateSummary(report: AnalysisReport): string {
  const reductionPercentage = Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)
  return `Archive optimization achieved ${reductionPercentage}% size reduction, reducing ${report.originalSizeMB}MB to ${report.cleanedSizeMB}MB. Successfully removed ${report.totalFilesRemoved} unnecessary files including ${report.duplicateFiles} duplicates and ${report.unwantedScreenshots} screenshots, while preserving essential content.`
}

function generateRecommendations(report: AnalysisReport): string[] {
  const recommendations = []
  
  if (report.duplicateFiles > 10) {
    recommendations.push("Implement automated duplicate detection to prevent future file redundancy")
  }
  
  if (report.unwantedScreenshots > 5) {
    recommendations.push("Establish screenshot management policies to avoid unnecessary image accumulation")
  }
  
  if (report.largeFileCount > 0) {
    recommendations.push("Review large files for compression opportunities or cloud storage migration")
  }
  
  recommendations.push("Use version control systems to reduce manual file versioning")
  recommendations.push("Create regular maintenance schedules for ongoing archive optimization")
  
  return recommendations.slice(0, 4)
}

function generateInsights(report: AnalysisReport): string[] {
  const insights = []
  
  const duplicateRatio = (report.duplicateFiles / report.totalFilesAnalyzed) * 100
  insights.push(`Duplicate file ratio: ${duplicateRatio.toFixed(1)}% indicates ${duplicateRatio > 15 ? 'poor' : 'good'} file organization`)
  
  const largestType = report.fileTypeBreakdown.reduce((max, current) => 
    current.sizeMB > max.sizeMB ? current : max
  )
  insights.push(`${largestType.type} files dominate storage (${largestType.sizeMB}MB across ${largestType.count} files)`)
  
  if (report.screenshotSizeMB > 0) {
    insights.push(`Screenshot cleanup recovered ${report.screenshotSizeMB}MB from ${report.unwantedScreenshots} files`)
  }
  
  const retentionRate = ((report.totalFilesAnalyzed - report.totalFilesRemoved) / report.totalFilesAnalyzed) * 100
  insights.push(`${retentionRate.toFixed(1)}% file retention rate shows selective, effective cleanup`)
  
  return insights.slice(0, 4)
}

function generateIntelligentFallback(report: AnalysisReport): AIAnalysisResult {
  return {
    summary: generateSummary(report),
    recommendations: generateRecommendations(report),
    insights: generateInsights(report),
    technicalDetails: generateTechnicalReport(report),
    aiGenerated: false,
    provider: "Intelligent Fallback"
  }
}

function generateTechnicalReport(report: AnalysisReport): string {
  const reductionPercentage = Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)
  
  return `
CLARITY AI - COMPREHENSIVE ANALYSIS REPORT
═══════════════════════════════════════════════════════════════════════════════════════

📊 EXECUTIVE SUMMARY
${generateSummary(report)}

🎯 OPTIMIZATION METRICS
┌─────────────────────────┬──────────────┬──────────────┬──────────────┐
│ Metric                  │ Original     │ Optimized    │ Improvement  │
├─────────────────────────┼──────────────┼──────────────┼──────────────┤
│ Archive Size           │ ${report.originalSizeMB.toString().padStart(8)} MB │ ${report.cleanedSizeMB.toString().padStart(8)} MB │ ${reductionPercentage.toString().padStart(8)}%     │
│ File Count             │ ${report.totalFilesAnalyzed.toString().padStart(8)}    │ ${(report.totalFilesAnalyzed - report.totalFilesRemoved).toString().padStart(8)}    │ -${report.totalFilesRemoved.toString().padStart(7)}    │
│ Duplicate Files        │ ${report.duplicateFiles.toString().padStart(8)}    │ 0        │ -${report.duplicateFiles.toString().padStart(7)}    │
│ Screenshot Files       │ ${report.unwantedScreenshots.toString().padStart(8)}    │ 0        │ -${report.unwantedScreenshots.toString().padStart(7)}    │
└─────────────────────────┴──────────────┴──────────────┴──────────────┘

📁 FILE TYPE ANALYSIS
${report.fileTypeBreakdown.map(item => {
  const percentage = ((item.sizeMB / report.cleanedSizeMB) * 100).toFixed(1)
  return `• ${item.type.padEnd(15)} │ ${item.count.toString().padStart(4)} files │ ${item.sizeMB.toString().padStart(6)} MB │ ${percentage.padStart(5)}%`
}).join('\n')}

🔧 CLEANUP BREAKDOWN
• Duplicate Removal: ${report.duplicateFiles} files → ${report.duplicateSizeRemovedMB}MB saved
• Screenshot Cleanup: ${report.unwantedScreenshots} files → ${report.screenshotSizeMB}MB saved  
• Archive Management: ${report.archivedOldFiles} files → ${report.forgottenFileSizeMB}MB optimized
• Large File Review: ${report.largeFileCount} files → ${report.largeFileSizeMB}MB identified

💡 KEY RECOMMENDATIONS
${generateRecommendations(report).map((rec, i) => `${i + 1}. ${rec}`).join('\n')}

🎯 STRATEGIC INSIGHTS
${generateInsights(report).map((insight, i) => `• ${insight}`).join('\n')}

Generated by Clarity AI - Advanced Archive Optimization System
Report Date: ${new Date().toISOString().split('T')[0]}
Analysis Engine: ${report.totalFilesAnalyzed > 1000 ? 'Enterprise' : 'Standard'} Mode
  `
}
