import { writeFileSync, readFileSync, existsSync, unlinkSync, mkdirSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

// Shared analysis results storage
// Using file-based storage to survive Next.js hot reloads in development
// In production, this should be replaced with Redis or a database

interface AnalysisData {
  report: any
  cleanedZipBuffer: Buffer
  timestamp: number
}

const STORAGE_DIR = join(tmpdir(), 'clarity-ai-storage')
const EXPIRY_TIME = 10 * 60 * 1000 // 10 minutes

// Ensure storage directory exists
if (typeof window === 'undefined') {
  try {
    if (!existsSync(STORAGE_DIR)) {
      mkdirSync(STORAGE_DIR, { recursive: true })
    }
  } catch (error) {
    console.error('[v0] Failed to create storage directory:', error)
  }
}

export const analysisResults = {
  set(token: string, data: AnalysisData) {
    if (typeof window !== 'undefined') return
    
    try {
      const filePath = join(STORAGE_DIR, `${token}.json`)
      const storageData = {
        report: data.report,
        cleanedZipBuffer: data.cleanedZipBuffer.toString('base64'),
        timestamp: data.timestamp
      }
      writeFileSync(filePath, JSON.stringify(storageData))
      console.log('[v0] Stored analysis result to file:', token)
    } catch (error) {
      console.error('[v0] Failed to store analysis result:', error)
    }
  },

  get(token: string): AnalysisData | undefined {
    if (typeof window !== 'undefined') return undefined
    
    try {
      const filePath = join(STORAGE_DIR, `${token}.json`)
      if (!existsSync(filePath)) {
        return undefined
      }
      
      const data = JSON.parse(readFileSync(filePath, 'utf-8'))
      
      // Check if expired
      if (Date.now() - data.timestamp > EXPIRY_TIME) {
        this.delete(token)
        return undefined
      }
      
      return {
        report: data.report,
        cleanedZipBuffer: Buffer.from(data.cleanedZipBuffer, 'base64'),
        timestamp: data.timestamp
      }
    } catch (error) {
      console.error('[v0] Failed to retrieve analysis result:', error)
      return undefined
    }
  },

  delete(token: string) {
    if (typeof window !== 'undefined') return
    
    try {
      const filePath = join(STORAGE_DIR, `${token}.json`)
      if (existsSync(filePath)) {
        unlinkSync(filePath)
        console.log('[v0] Deleted analysis result file:', token)
      }
    } catch (error) {
      console.error('[v0] Failed to delete analysis result:', error)
    }
  },
  keys(): string[] {
    if (typeof window !== 'undefined') return []
    
    try {
      if (!existsSync(STORAGE_DIR)) return []
      
      const { readdirSync } = require('fs')
      return readdirSync(STORAGE_DIR)
        .filter((file: string) => file.endsWith('.json'))
        .map((file: string) => file.replace('.json', ''))
    } catch (error) {
      console.error('[v0] Failed to list storage keys:', error)
      return []
    }
  },

  get size(): number {
    return this.keys().length
  }
}

// Cleanup old results every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      try {
        const tokens = analysisResults.keys()
        for (const token of tokens) {
          const data = analysisResults.get(token)
          if (data && Date.now() - data.timestamp > EXPIRY_TIME) {
            analysisResults.delete(token)
            console.log("[v0] Cleaned up expired analysis result:", token)
          }
        }
      } catch (error) {
        console.error('[v0] Error during cleanup:', error)
      }
    },
    5 * 60 * 1000,
  )
}
