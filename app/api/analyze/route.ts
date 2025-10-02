import { type NextRequest, NextResponse } from "next/server"
import { analyzeZipFile } from "@/lib/zip-analyzer"
import { randomBytes } from "crypto"
import { analysisResults } from "@/lib/analysis-storage"

const MAX_FILE_SIZE = 200 * 1024 * 1024 // 200MB

export async function POST(request: NextRequest) {
  try {
    console.log('[v0] Received analysis request')
    
    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.zip') && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a ZIP file.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 200MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      )
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'File is empty' },
        { status: 400 }
      )
    }

    console.log('[v0] File validated:', file.name, `(${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log('[v0] Starting ZIP analysis...')

    // Analyze the ZIP file
    const { report, cleanedZipBuffer } = await analyzeZipFile(buffer, file.name)

    console.log('[v0] Analysis complete:', {
      originalSize: report.originalSizeMB,
      cleanedSize: report.cleanedSizeMB,
      reduction: report.reductionPercentage
    })

    // Generate a secure download token
    const downloadToken = randomBytes(32).toString('hex')    // Store the results temporarily
    analysisResults.set(downloadToken, {
      report,
      cleanedZipBuffer,
      timestamp: Date.now()
    })

    console.log('[v0] Stored analysis result with token:', downloadToken)
    console.log('[v0] Current storage size:', analysisResults.size)

    // Return the report with download token
    return NextResponse.json({
      ...report,
      downloadToken
    })
  } catch (error) {
    console.error('[v0] Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
