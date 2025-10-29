import { type NextRequest, NextResponse } from "next/server"
import { analysisResults } from "@/lib/analysis-storage"

export async function GET(request: NextRequest, context: { params: { token: string } }) {
  try {
    const { token } = context.params

    console.log("[v0] Download request for token:", token)
    console.log("[v0] Available tokens in storage:", analysisResults.keys())

    // Retrieve the analysis result
    const result = analysisResults.get(token)

    if (!result) {
      return NextResponse.json({ error: "Invalid or expired download token" }, { status: 404 })
    }

    const { cleanedZipBuffer } = result

    // Delete the result after retrieval (one-time download)
    analysisResults.delete(token)
    console.log("[v0] Cleaned up analysis result after download:", token)

    // Return the cleaned ZIP file
    return new NextResponse(cleanedZipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="clarity-cleaned.zip"',
        "Content-Length": cleanedZipBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error("[v0] Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}
