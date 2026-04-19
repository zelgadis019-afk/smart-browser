'use client'

import { useState, useRef, useCallback } from 'react'
import { Globe, ClipboardPaste, Loader2, X, Search } from 'lucide-react'

interface UrlInputProps {
  onPageLoaded: (title: string, content: string, url?: string) => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export default function UrlInput({ onPageLoaded, isLoading, setIsLoading }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'url' | 'paste'>('url')
  const [pastedText, setPastedText] = useState('')
  const debounceRef = useRef<NodeJS.Timeout>()

  const fetchPage = useCallback(async (urlToFetch: string) => {
    if (!urlToFetch.trim()) {
      setError('Please enter a URL')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/fetch-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToFetch }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch page')
        return
      }

      onPageLoaded(data.title, data.content, data.url)
    } catch {
      setError('Network error. Check your connection.')
    } finally {
      setIsLoading(false)
    }
  }, [onPageLoaded, setIsLoading])

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPage(url)
  }

  const handlePasteSubmit = async () => {
    if (!pastedText.trim()) {
      setError('Please paste some content')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/fetch-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pastedContent: pastedText }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to process content')
        return
      }

      onPageLoaded(data.title, data.content)
    } catch {
      setError('Processing failed. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUrl(value)
    setError('')

    // Auto-fetch on valid URL after debounce
    if (debounceRef.current) clearTimeout(debounceRef.current)
  }

  const clearUrl = () => {
    setUrl('')
    setError('')
  }

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
        <button
          onClick={() => { setMode('url'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'url'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Globe size={14} />
          URL
        </button>
        <button
          onClick={() => { setMode('paste'); setError('') }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            mode === 'paste'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <ClipboardPaste size={14} />
          Paste
        </button>
      </div>

      {/* URL Input */}
      {mode === 'url' && (
        <form onSubmit={handleUrlSubmit} className="space-y-2">
          <div className="relative flex items-center">
            <Globe size={16} className="absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={url}
              onChange={handleUrlChange}
              placeholder="https://example.com/article..."
              className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            {url && (
              <button
                type="button"
                onClick={clearUrl}
                className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Fetching page...
              </>
            ) : (
              <>
                <Search size={14} />
                Analyze Page
              </>
            )}
          </button>
        </form>
      )}

      {/* Paste Mode */}
      {mode === 'paste' && (
        <div className="space-y-2">
          <textarea
            value={pastedText}
            onChange={(e) => { setPastedText(e.target.value); setError('') }}
            placeholder="Paste webpage content, HTML, or any text here..."
            rows={6}
            className="w-full p-3 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all"
            disabled={isLoading}
          />
          <button
            onClick={handlePasteSubmit}
            disabled={isLoading || !pastedText.trim()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <ClipboardPaste size={14} />
                Process Content
              </>
            )}
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 animate-fade-in">
          <X size={14} className="mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
