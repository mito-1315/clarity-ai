/**
 * Utility functions for validating API keys and handling AI service limitations
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

/**
 * Validates API key format for different AI providers
 */
export function validateAIApiKey(apiKey: string, provider: 'huggingface' | 'openai' = 'huggingface'): ValidationResult {
  if (!apiKey || apiKey.trim().length === 0) {
    return {
      isValid: false,
      error: "API key is required",
      suggestion: `Please enter your ${provider === 'huggingface' ? 'Hugging Face' : 'OpenAI'} API key`
    }
  }

  const trimmedKey = apiKey.trim()

  // Provider-specific validation
  if (provider === 'huggingface') {
    return validateHuggingFaceKey(trimmedKey)
  } else if (provider === 'openai') {
    return validateOpenAIKey(trimmedKey)
  }

  return { isValid: true }
}

function validateHuggingFaceKey(apiKey: string): ValidationResult {
  // Hugging Face tokens start with "hf_"
  if (!apiKey.startsWith('hf_')) {
    return {
      isValid: false,
      error: "Invalid Hugging Face API key format",
      suggestion: "Hugging Face API keys should start with 'hf_'. Please check your token."
    }
  }

  if (apiKey.length < 10) {
    return {
      isValid: false,
      error: "Hugging Face API key appears to be too short",
      suggestion: "Please check that you copied the complete token from Hugging Face."
    }
  }

  return { isValid: true }
}

function validateOpenAIKey(apiKey: string): ValidationResult {
  // OpenAI keys start with "sk-"
  if (!apiKey.startsWith('sk-')) {
    return {
      isValid: false,
      error: "Invalid OpenAI API key format",
      suggestion: "OpenAI API keys should start with 'sk-'. Please check your key."
    }
  }

  if (apiKey.length < 20) {
    return {
      isValid: false,
      error: "OpenAI API key appears to be too short",
      suggestion: "Please check that you copied the complete key from OpenAI."
    }
  }

  return { isValid: true }
}

/**
 * Provides helpful suggestions for common API errors
 */
export function getApiErrorSuggestion(error: string, provider: string = 'huggingface'): string {
  const lowerError = error.toLowerCase()

  if (lowerError.includes('api key') || lowerError.includes('invalid') || lowerError.includes('unauthorized')) {
    if (provider === 'huggingface') {
      return "Double-check your Hugging Face token. Make sure it has the right permissions and is active."
    } else if (provider === 'openai') {
      return "Verify your OpenAI API key. Check that it's active and has sufficient credits."
    }
    return "Please verify your API key is correct and active."
  }

  if (lowerError.includes('quota') || lowerError.includes('limit') || lowerError.includes('rate')) {
    if (provider === 'huggingface') {
      return "You've hit the rate limit. Hugging Face Inference API is free but has usage limits. Try again in a few minutes."
    } else if (provider === 'openai') {
      return "API quota exceeded. Check your OpenAI billing or wait for the limit to reset."
    }
    return "API rate limit reached. Please try again later."
  }

  if (lowerError.includes('model') || lowerError.includes('not found') || lowerError.includes('404')) {
    return "The AI model is temporarily unavailable. Please try again in a few minutes."
  }

  if (lowerError.includes('network') || lowerError.includes('connection')) {
    return "Check your internet connection and try again."
  }

  if (lowerError.includes('timeout')) {
    return "The request timed out. The service may be busy - try again in a moment."
  }

  return "Please check your API key and internet connection, then try again."
}

/**
 * Gets the appropriate user-friendly error message for display
 */
export function getUserFriendlyError(error: any, provider: string = 'huggingface'): string {
  if (typeof error === 'string') {
    return error
  }

  if (error?.message) {
    const suggestion = getApiErrorSuggestion(error.message, provider)
    return `${error.message}. ${suggestion}`
  }

  return "An unexpected error occurred. Please try again."
}

/**
 * Information about AI service free tiers and best practices
 */
export const AI_SERVICE_INFO = {
  huggingface: {
    name: "Hugging Face",
    cost: "Completely Free",
    rateLimits: {
      requestsPerHour: 1000,
      note: "Generous free tier with no billing required"
    },
    setup: [
      "Visit huggingface.co",
      "Create a free account",
      "Go to Settings → Access Tokens",
      "Create a new token with 'Read' permission",
      "Copy the token (starts with 'hf_')"
    ],
    benefits: [
      "No credit card required",
      "Completely free forever",
      "Good for personal projects",
      "Multiple AI models available"
    ]
  },
  openai: {
    name: "OpenAI",
    cost: "Free credits + Pay-per-use",
    rateLimits: {
      newUsers: "$5 free credits",
      note: "Higher quality but requires billing setup"
    },
    setup: [
      "Visit platform.openai.com",
      "Create an account",
      "Add billing information",
      "Go to API Keys section",
      "Create a new API key",
      "Copy the key (starts with 'sk-')"
    ],
    benefits: [
      "Higher quality responses",
      "More reliable service",
      "Better understanding",
      "Faster response times"
    ]
  }
}
