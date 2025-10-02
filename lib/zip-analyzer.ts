import JSZip from "jszip"
import { createHash } from "crypto"
import type { AnalysisReport, FileMetadata, FileTypeBreakdown } from "./types"

const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024 // 50MB
const OLD_FILE_THRESHOLD = 730 // 2 years in days
const SCREENSHOT_PATTERNS = [/screenshot/i, /screen shot/i, /^img_\d+/i, /^image_\d+/i, /^photo_\d+/i]

export async function analyzeZipFile(
  buffer: Buffer,
  filename: string,
): Promise<{ report: AnalysisReport; cleanedZipBuffer: Buffer }> {
  console.log("[v0] Loading ZIP file...")

  // Load the ZIP file
  const zip = await JSZip.loadAsync(buffer)

  const files: FileMetadata[] = []
  const hashMap = new Map<string, string[]>() // hash -> file paths

  console.log("[v0] Analyzing files...")

  // First pass: collect metadata and calculate hashes
  for (const [path, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue // Skip directories

    const content = await zipEntry.async("nodebuffer")
    const size = content.length
    const mtime = zipEntry.date

    // Calculate SHA-256 hash for duplicate detection
    const hash = createHash("sha256").update(content).digest("hex")

    // Track files by hash for duplicate detection
    if (!hashMap.has(hash)) {
      hashMap.set(hash, [])
    }
    hashMap.get(hash)!.push(path)

    // Check if file is a screenshot
    const isScreenshot = SCREENSHOT_PATTERNS.some((pattern) => pattern.test(path))

    // Check if file is large
    const isLarge = size > LARGE_FILE_THRESHOLD

    // Check if file is old (forgotten)
    const daysSinceModified = (Date.now() - mtime.getTime()) / (1000 * 60 * 60 * 24)
    const isOld = daysSinceModified > OLD_FILE_THRESHOLD

    files.push({
      path,
      size,
      mtime,
      hash,
      isScreenshot,
      isLarge,
      isOld,
      isDuplicate: false, // Will be set in next pass
    })
  }

  console.log("[v0] Detected", files.length, "files")

  // Second pass: mark duplicates (keep first occurrence, mark rest as duplicates)
  for (const [hash, paths] of hashMap.entries()) {
    if (paths.length > 1) {
      // Keep the first file, mark others as duplicates
      for (let i = 1; i < paths.length; i++) {
        const file = files.find((f) => f.path === paths[i])
        if (file) {
          file.isDuplicate = true
        }
      }
    }
  }

  // Calculate statistics
  const originalSizeMB = files.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)

  const duplicateFiles = files.filter((f) => f.isDuplicate)
  const duplicateSizeRemovedMB = duplicateFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)

  const archivedOldFiles = files.filter((f) => f.isOld && !f.isDuplicate)
  const forgottenFileSizeMB = archivedOldFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)

  const unwantedScreenshots = files.filter((f) => f.isScreenshot && !f.isDuplicate)
  const screenshotSizeMB = unwantedScreenshots.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)

  const largeFiles = files.filter((f) => f.isLarge && !f.isDuplicate)
  const largeFileSizeMB = largeFiles.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)

  // Determine which files to keep (not duplicate, not old, not screenshot)
  const filesToKeep = files.filter((f) => !f.isDuplicate && !f.isOld && !f.isScreenshot)
  const filesToRemove = files.filter((f) => f.isDuplicate || f.isOld || f.isScreenshot)

  const cleanedSizeMB = filesToKeep.reduce((sum, f) => sum + f.size, 0) / (1024 * 1024)
  const reductionPercentage = ((originalSizeMB - cleanedSizeMB) / originalSizeMB) * 100

  // File type breakdown
  const fileTypeBreakdown = calculateFileTypeBreakdown(filesToKeep)

  console.log("[v0] Creating cleaned ZIP...")

  // Create cleaned ZIP
  const cleanedZip = new JSZip()
  for (const file of filesToKeep) {
    const zipEntry = zip.files[file.path]
    if (zipEntry && !zipEntry.dir) {
      const content = await zipEntry.async("nodebuffer")
      cleanedZip.file(file.path, content)
    }
  }

  const cleanedZipBuffer = await cleanedZip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  })

  console.log("[v0] Cleaned ZIP created")

  const report: AnalysisReport = {
    originalSizeMB: Number.parseFloat(originalSizeMB.toFixed(2)),
    cleanedSizeMB: Number.parseFloat(cleanedSizeMB.toFixed(2)),
    reductionPercentage: Number.parseFloat(reductionPercentage.toFixed(1)),
    duplicateFiles: duplicateFiles.length,
    duplicateSizeRemovedMB: Number.parseFloat(duplicateSizeRemovedMB.toFixed(2)),
    archivedOldFiles: archivedOldFiles.length,
    forgottenFileSizeMB: Number.parseFloat(forgottenFileSizeMB.toFixed(2)),
    unwantedScreenshots: unwantedScreenshots.length,
    screenshotSizeMB: Number.parseFloat(screenshotSizeMB.toFixed(2)),
    largeFileCount: largeFiles.length,
    largeFileSizeMB: Number.parseFloat(largeFileSizeMB.toFixed(2)),
    fileTypeBreakdown,
    totalFilesAnalyzed: files.length,
    totalFilesRemoved: filesToRemove.length,
  }

  return { report, cleanedZipBuffer }
}

function calculateFileTypeBreakdown(files: FileMetadata[]): FileTypeBreakdown[] {
  const typeMap = new Map<string, { count: number; size: number }>()

  for (const file of files) {
    const ext = file.path.split(".").pop()?.toLowerCase() || "unknown"
    const category = categorizeFileType(ext)

    if (!typeMap.has(category)) {
      typeMap.set(category, { count: 0, size: 0 })
    }

    const stats = typeMap.get(category)!
    stats.count++
    stats.size += file.size
  }

  const breakdown: FileTypeBreakdown[] = []
  for (const [type, stats] of typeMap.entries()) {
    breakdown.push({
      type,
      count: stats.count,
      sizeMB: Number.parseFloat((stats.size / (1024 * 1024)).toFixed(2)),
    })
  }

  // Sort by size descending
  breakdown.sort((a, b) => b.sizeMB - a.sizeMB)

  return breakdown
}

function categorizeFileType(ext: string): string {
  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "heic", "heif"]
  const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv", "m4v"]
  const audioExts = ["mp3", "wav", "flac", "aac", "m4a", "ogg", "wma"]
  const documentExts = ["pdf", "doc", "docx", "txt", "rtf", "odt", "pages"]
  const spreadsheetExts = ["xls", "xlsx", "csv", "ods", "numbers"]
  const presentationExts = ["ppt", "pptx", "key", "odp"]
  const archiveExts = ["zip", "rar", "7z", "tar", "gz", "bz2"]
  const codeExts = [
    "js",
    "ts",
    "jsx",
    "tsx",
    "py",
    "java",
    "cpp",
    "c",
    "h",
    "css",
    "html",
    "json",
    "xml",
    "yaml",
    "yml",
  ]

  if (imageExts.includes(ext)) return "Images"
  if (videoExts.includes(ext)) return "Videos"
  if (audioExts.includes(ext)) return "Audio"
  if (documentExts.includes(ext)) return "Documents"
  if (spreadsheetExts.includes(ext)) return "Spreadsheets"
  if (presentationExts.includes(ext)) return "Presentations"
  if (archiveExts.includes(ext)) return "Archives"
  if (codeExts.includes(ext)) return "Code"

  return "Other"
}
