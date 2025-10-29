import { GoogleGenerativeAI } from "@google/generative-ai"
import type { AnalysisReport } from "./types"

export interface GeminiAnalysisResult {
  summary: string
  recommendations: string[]
  insights: string[]
  technicalDetails: string
  aiGenerated: boolean // Track if this was AI-generated or fallback
}

export async function analyzeWithGemini(
  apiKey: string, 
  report: AnalysisReport
): Promise<GeminiAnalysisResult> {
  // First, try the free tier models
  const freeTierModels = [
    "gemini-1.5-flash",     // Free tier model
    "gemini-1.5-flash-001", // Alternative free tier
    "models/gemini-1.5-flash", // Full model path
    "models/gemini-1.5-flash-001"
  ]
  
  for (const modelName of freeTierModels) {
    try {
      console.log(`[Gemini] Attempting model: ${modelName}`)
      
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: modelName })

      const prompt = `
Analyze this ZIP archive cleanup report and provide insights:

CLEANUP RESULTS:
- Original: ${report.originalSizeMB}MB → Cleaned: ${report.cleanedSizeMB}MB
- Reduction: ${Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)}%
- Files: ${report.totalFilesAnalyzed} analyzed, ${report.totalFilesRemoved} removed
- Duplicates: ${report.duplicateFiles} files (${report.duplicateSizeRemovedMB}MB saved)
- Screenshots: ${report.unwantedScreenshots} removed (${report.screenshotSizeMB}MB)
- Old files: ${report.archivedOldFiles} archived (${report.forgottenFileSizeMB}MB)

FILES BY TYPE:
${report.fileTypeBreakdown.map(item => `${item.type}: ${item.count} files, ${item.sizeMB}MB`).join('\n')}

Provide a brief analysis with:
1. Summary (2-3 sentences)
2. Top 3 recommendations
3. Key insights
4. Technical assessment

Keep response concise and professional.
      `

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      console.log(`[Gemini] Success with model: ${modelName}`)
      console.log(`[Gemini] Response length: ${text.length} characters`)

      return parseAIResponse(text, report, true)
        } catch (error: any) {
      console.log(`[Gemini] Model ${modelName} failed:`, error?.message || error)
      continue
    }
  }
  
  // If all AI models fail, generate a comprehensive fallback
  console.log("[Gemini] All AI models failed, using intelligent fallback")
  return generateIntelligentFallback(report)
}

function parseAIResponse(text: string, report: AnalysisReport, aiGenerated: boolean): GeminiAnalysisResult {
  try {
    // Simple parsing logic for AI response
    const sections = text.split(/\d+\.|Summary|Recommendations|Insights|Technical|Assessment/i)
    
    return {
      summary: extractSummary(text, report),
      recommendations: extractRecommendations(text, report),
      insights: extractInsights(text, report),
      technicalDetails: text,
      aiGenerated
    }
  } catch (error) {
    console.log("[Gemini] Failed to parse AI response, using fallback")
    return generateIntelligentFallback(report)
  }
}

function extractSummary(text: string, report: AnalysisReport): string {
  const reductionPercentage = Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)
  
  // Try to extract summary from AI response, fallback to generated
  const summaryMatch = text.match(/summary[:\-]?\s*(.*?)(?:\n|recommendation|insight)/i)
  if (summaryMatch && summaryMatch[1].length > 20) {
    return summaryMatch[1].trim()
  }
  
  return `Archive optimization achieved ${reductionPercentage}% size reduction, reducing ${report.originalSizeMB}MB to ${report.cleanedSizeMB}MB. Successfully removed ${report.totalFilesRemoved} unnecessary files including ${report.duplicateFiles} duplicates and ${report.unwantedScreenshots} screenshots. The cleanup process preserved essential files while maximizing storage efficiency.`
}

function extractRecommendations(text: string, report: AnalysisReport): string[] {  // Try to extract from AI response first
  const recMatch = text.match(/recommendation[s]?[:\-]?\s*([\s\S]*?)(?:\n\n|insight|technical)/i)
  if (recMatch) {
    const extracted = recMatch[1]
      .split(/[\n•\-\*]\s*/)
      .map(item => item.trim())
      .filter(item => item.length > 15)
      .slice(0, 5)
    
    if (extracted.length >= 2) {
      return extracted
    }
  }
  
  // Intelligent fallback based on analysis results
  const recommendations = []
  
  if (report.duplicateFiles > 10) {
    recommendations.push("Implement automated duplicate detection tools to prevent future file redundancy")
  }
  
  if (report.unwantedScreenshots > 5) {
    recommendations.push("Establish screenshot management policies to avoid accumulation of unnecessary images")
  }
  
  if (report.largeFileCount > 0) {
    recommendations.push("Review large files for compression opportunities or cloud storage migration")
  }
  
  if (report.archivedOldFiles > 0) {
    recommendations.push("Create regular archive maintenance schedules to identify outdated content")
  }
  
  recommendations.push("Use version control systems to reduce manual file versioning and duplicates")
  
  return recommendations.slice(0, 4)
}

function extractInsights(text: string, report: AnalysisReport): string[] {  // Try to extract from AI response first
  const insightMatch = text.match(/insight[s]?[:\-]?\s*([\s\S]*?)(?:\n\n|technical|assessment)/i)
  if (insightMatch) {
    const extracted = insightMatch[1]
      .split(/[\n•\-\*]\s*/)
      .map(item => item.trim())
      .filter(item => item.length > 15)
      .slice(0, 5)
    
    if (extracted.length >= 2) {
      return extracted
    }
  }
  
  // Generate insights based on data patterns
  const insights = []
  
  const duplicateRatio = (report.duplicateFiles / report.totalFilesAnalyzed) * 100
  if (duplicateRatio > 20) {
    insights.push(`High duplicate file ratio (${duplicateRatio.toFixed(1)}%) indicates poor file organization`)
  } else if (duplicateRatio > 10) {
    insights.push(`Moderate duplicate file presence (${duplicateRatio.toFixed(1)}%) suggests room for improvement`)
  } else {
    insights.push(`Low duplicate file ratio (${duplicateRatio.toFixed(1)}%) indicates good file management`)
  }
  
  const largestFileType = report.fileTypeBreakdown.reduce((max, current) => 
    current.sizeMB > max.sizeMB ? current : max
  )
  insights.push(`${largestFileType.type} files dominate storage usage (${largestFileType.sizeMB}MB, ${largestFileType.count} files)`)
  
  if (report.screenshotSizeMB > 0) {
    insights.push(`Screenshot cleanup recovered ${report.screenshotSizeMB}MB across ${report.unwantedScreenshots} files`)
  }
  
  const retentionRate = ((report.totalFilesAnalyzed - report.totalFilesRemoved) / report.totalFilesAnalyzed) * 100
  insights.push(`File retention rate of ${retentionRate.toFixed(1)}% indicates selective, effective cleanup`)
  
  return insights.slice(0, 4)
}

function generateIntelligentFallback(report: AnalysisReport): GeminiAnalysisResult {
  const reductionPercentage = Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)
  const spaceSaved = report.originalSizeMB - report.cleanedSizeMB
  
  return {
    summary: `Comprehensive archive analysis achieved ${reductionPercentage}% storage reduction, saving ${spaceSaved.toFixed(1)}MB of space. The cleanup process analyzed ${report.totalFilesAnalyzed} files and successfully removed ${report.totalFilesRemoved} unnecessary items while preserving essential content. Key optimizations included duplicate file removal (${report.duplicateFiles} files), screenshot cleanup (${report.unwantedScreenshots} items), and archival of outdated content.`,
    
    recommendations: extractRecommendations("", report),
    
    insights: extractInsights("", report),
    
    technicalDetails: generateTechnicalAnalysis(report),
    
    aiGenerated: false
  }
}

function generateTechnicalAnalysis(report: AnalysisReport): string {
  const reductionPercentage = Math.round(((report.originalSizeMB - report.cleanedSizeMB) / report.originalSizeMB) * 100)
  
  return `
CLARITY AI - TECHNICAL ANALYSIS REPORT
Generated: ${new Date().toISOString().split('T')[0]}

STORAGE OPTIMIZATION METRICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Initial Archive Size:     ${report.originalSizeMB} MB
Optimized Archive Size:   ${report.cleanedSizeMB} MB
Space Reduction:          ${reductionPercentage}% (${(report.originalSizeMB - report.cleanedSizeMB).toFixed(2)} MB saved)
Compression Efficiency:   ${((report.cleanedSizeMB / report.originalSizeMB) * 100).toFixed(1)}% retention ratio

FILE PROCESSING STATISTICS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Files Scanned:      ${report.totalFilesAnalyzed}
Files Successfully Removed: ${report.totalFilesRemoved}
Files Preserved:          ${report.totalFilesAnalyzed - report.totalFilesRemoved}
Removal Efficiency:       ${((report.totalFilesRemoved / report.totalFilesAnalyzed) * 100).toFixed(1)}%

CLEANUP CATEGORY BREAKDOWN:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Duplicate File Removal
   • Files Identified: ${report.duplicateFiles}
   • Space Recovered: ${report.duplicateSizeRemovedMB} MB
   • Impact: ${report.duplicateFiles > 0 ? ((report.duplicateSizeRemovedMB / (report.originalSizeMB - report.cleanedSizeMB)) * 100).toFixed(1) : 0}% of total savings

2. Screenshot Cleanup
   • Files Removed: ${report.unwantedScreenshots}
   • Space Recovered: ${report.screenshotSizeMB} MB
   • Impact: ${report.screenshotSizeMB > 0 ? ((report.screenshotSizeMB / (report.originalSizeMB - report.cleanedSizeMB)) * 100).toFixed(1) : 0}% of total savings

3. Archive Management
   • Old Files Archived: ${report.archivedOldFiles}
   • Space Optimized: ${report.forgottenFileSizeMB} MB
   • Impact: ${report.forgottenFileSizeMB > 0 ? ((report.forgottenFileSizeMB / (report.originalSizeMB - report.cleanedSizeMB)) * 100).toFixed(1) : 0}% of total savings

4. Large File Analysis
   • Large Files Detected: ${report.largeFileCount}
   • Total Size: ${report.largeFileSizeMB} MB
   • Average Size: ${report.largeFileCount > 0 ? (report.largeFileSizeMB / report.largeFileCount).toFixed(1) : 0} MB per file

FILE TYPE DISTRIBUTION ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${report.fileTypeBreakdown.map(item => {
  const percentage = ((item.sizeMB / report.cleanedSizeMB) * 100).toFixed(1)
  const avgSize = (item.sizeMB / item.count).toFixed(2)
  return `${item.type.padEnd(20)} │ ${item.count.toString().padStart(6)} files │ ${item.sizeMB.toString().padStart(8)} MB │ ${percentage.padStart(5)}% │ ${avgSize} MB avg`
}).join('\n')}

OPTIMIZATION RECOMMENDATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The analysis reveals significant optimization potential through systematic cleanup processes.
Current efficiency metrics demonstrate successful space recovery while maintaining data integrity.
Future optimization cycles should focus on preventing duplicate accumulation and implementing
automated cleanup protocols for sustained storage management.

Analysis completed using Clarity AI v1.0 - Advanced Archive Optimization System
  `
}
