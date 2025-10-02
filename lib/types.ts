export interface AnalysisReport {
  originalSizeMB: number
  cleanedSizeMB: number
  reductionPercentage: number
  duplicateFiles: number
  duplicateSizeRemovedMB: number
  archivedOldFiles: number
  forgottenFileSizeMB: number
  unwantedScreenshots: number
  screenshotSizeMB: number
  largeFileCount: number
  largeFileSizeMB: number
  fileTypeBreakdown: FileTypeBreakdown[]
  totalFilesAnalyzed: number
  totalFilesRemoved: number
}

export interface FileTypeBreakdown {
  type: string
  count: number
  sizeMB: number
}

export interface FileMetadata {
  path: string
  size: number
  mtime: Date
  hash?: string
  isScreenshot?: boolean
  isLarge?: boolean
  isDuplicate?: boolean
  isOld?: boolean
}
