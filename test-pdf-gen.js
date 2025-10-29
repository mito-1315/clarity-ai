// Test file to verify the PDF generator function works
const { generatePDFReport } = require('./lib/pdf-generator.ts');

console.log('Testing PDF generator...');
console.log('Function exists:', typeof generatePDFReport);

const mockReport = {
  originalSizeMB: 100,
  cleanedSizeMB: 50,
  totalFilesAnalyzed: 1000,
  totalFilesRemoved: 200,
  duplicateFiles: 50,
  duplicateSizeRemovedMB: 10,
  unwantedScreenshots: 20,
  screenshotSizeMB: 5,
  archivedOldFiles: 30,
  forgottenFileSizeMB: 15,
  largeFileCount: 5,
  largeFileSizeMB: 20,
  fileTypeBreakdown: [
    { type: 'JavaScript', count: 100, sizeMB: 15 },
    { type: 'CSS', count: 50, sizeMB: 5 }
  ]
};

const mockAI = {
  summary: 'Test summary',
  recommendations: ['Test rec 1', 'Test rec 2'],
  insights: ['Test insight 1', 'Test insight 2'],
  technicalDetails: 'Test details',
  aiGenerated: false,
  provider: 'Test Provider'
};

try {
  const result = generatePDFReport(mockReport, mockAI);
  console.log('Function works! Buffer length:', result.length);
} catch (error) {
  console.error('Function failed:', error.message);
}
