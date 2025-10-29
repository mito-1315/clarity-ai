"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { validateAIApiKey, getUserFriendlyError, AI_SERVICE_INFO } from "@/lib/api-validation"
import { AlertCircle, Info, ExternalLink, CheckCircle, Loader2, Cpu, Zap } from "lucide-react"

interface AIApiModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (apiKey: string, provider: 'huggingface' | 'openai') => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function GeminiApiModal({ isOpen, onClose, onSubmit, isLoading = false, error: externalError }: AIApiModalProps) {
  const [apiKey, setApiKey] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [showInfo, setShowInfo] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'huggingface' | 'openai'>('huggingface')

  // Display external error or internal error
  const displayError = externalError || error
  const handleSubmit = async () => {
    // Allow empty API key for fallback analysis
    if (apiKey.trim() === '') {
      setError(null)
      try {
        await onSubmit('', selectedProvider)
      } catch (err) {
        setError(getUserFriendlyError(err, selectedProvider))
      }
      return
    }

    // Validate API key format if provided
    const validation = validateAIApiKey(apiKey, selectedProvider)
    if (!validation.isValid) {
      setError(validation.error + (validation.suggestion ? ` ${validation.suggestion}` : ''))
      return
    }

    setError(null)
    try {
      await onSubmit(apiKey.trim(), selectedProvider)
    } catch (err) {
      setError(getUserFriendlyError(err, selectedProvider))
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setApiKey("")
      setError(null)
      setShowInfo(false)
      onClose()
    }
  }

  const currentServiceInfo = AI_SERVICE_INFO[selectedProvider]

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-blue-600" />
            Choose AI Provider
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Select an AI service to generate intelligent insights for your archive analysis.
          </p>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label>AI Provider</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedProvider('huggingface')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedProvider === 'huggingface' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-500" />
                  <strong>Hugging Face</strong>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">FREE</span>
                </div>
                <p className="text-sm text-gray-600">Completely free, no billing required</p>
              </button>
              
              <button
                onClick={() => setSelectedProvider('openai')}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  selectedProvider === 'openai' 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                disabled={isLoading}
              >
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <strong>OpenAI GPT</strong>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">PREMIUM</span>
                </div>
                <p className="text-sm text-gray-600">Higher quality, $5 free credits</p>
              </button>
            </div>
          </div>          <div className="space-y-2">
            <Label htmlFor="apiKey">{currentServiceInfo.name} API Key (Optional)</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder={`Enter your ${currentServiceInfo.name} API key or leave empty for fallback analysis...`}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                if (error) setError(null)
              }}
              className={displayError ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Leave empty to use built-in analysis without external AI services
            </p>
          </div>
          
          {displayError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{displayError}</AlertDescription>
            </Alert>
          )}

          {/* Service Info Section */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowInfo(!showInfo)}
              className="w-full flex items-center gap-2"
              disabled={isLoading}
            >
              <Info className="h-4 w-4" />
              {showInfo ? 'Hide' : 'Show'} Setup Instructions
            </Button>

            {showInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">How to get your {currentServiceInfo.name} API key:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    {currentServiceInfo.setup.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 mt-2 text-blue-600"
                    onClick={() => {
                      const url = selectedProvider === 'huggingface' 
                        ? 'https://huggingface.co/settings/tokens'
                        : 'https://platform.openai.com/api-keys'
                      window.open(url, '_blank')
                    }}
                  >
                    Open {currentServiceInfo.name} <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Service Benefits:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    {currentServiceInfo.benefits.map((benefit, index) => (
                      <li key={index}>• {benefit}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Privacy & Security:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your API key is never stored</li>
                    <li>• Only file metadata is analyzed</li>
                    <li>• No file content is sent to AI</li>
                    <li>• Secure, temporary usage only</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>          <Button 
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Report...
              </>
            ) : (
              apiKey.trim() ? 'Generate AI Report' : 'Generate Standard Report'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
