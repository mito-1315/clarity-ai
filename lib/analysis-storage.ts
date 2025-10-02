// Shared analysis results storage
// In production, this should be replaced with Redis or a database

export const analysisResults = new Map<
  string,
  {
    report: any
    cleanedZipBuffer: Buffer
    timestamp: number
  }
>()

// Cleanup old results every 5 minutes
const EXPIRY_TIME = 10 * 60 * 1000 // 10 minutes

// Only run cleanup in Node.js environment
if (typeof window === 'undefined') {
  setInterval(
    () => {
      const now = Date.now()

      for (const [token, data] of analysisResults.entries()) {
        if (now - data.timestamp > EXPIRY_TIME) {
          analysisResults.delete(token)
          console.log("[v0] Cleaned up expired analysis result:", token)
        }
      }
    },
    5 * 60 * 1000,
  )
}
