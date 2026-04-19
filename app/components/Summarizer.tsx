'use client'

import { useState } from 'react'
import { Loader2, Copy, Check, Zap, List, Baby, Star, HelpCircle } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { Summary } from '@/app/types'

interface SummarizerProps {
  pageContent: string
  pageTitle: string
}

type SummaryType = 'tldr' | 'bullets' | 'eli5' | 'keypoints' | 'questions'

const SUMMARY_OPTIONS: {
  type: SummaryType
  label: string
  description: string
  icon: React.ReactNode
  color: string
}[] = [
  {
    type: 'tldr',
    label: 'TL;DR',
    description: 'Quick 2-4 sentence summary',
    icon: <Zap size={14} />,
    color: 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800',
  },
  {
    type: 'bullets',
    label: 'Bullet Points',
    description: 'Key points as bullets',
    icon: <List size={14} />,
    color: 'text-blue-600 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-900/20 dark:border-blue-800',
  },
  {
    type: 'eli5',
    label: 'Explain Like I\'m 10',
    description: 'Simple language explanation',
    icon: <Baby size={14} />,
    color: 'text-green-600 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800',
  },
  {
    type: 'keypoints',
    label: 'Key Takeaways',
    description: 'Important insights & facts',
    icon: <Star size={14} />,
    color: 'text-purple-600 bg-purple-50 border-purple-200 dark:text-purple-400 dark:bg-purple-900/20 dark:border-purple-800',
  },
  {
    type: 'questions',
    label: 'Key Questions',
    description: 'Questions this content raises',
    icon: <HelpCircle size={14} />,
    color: 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-900/20 dark:border-rose-800',
  },
]

export default function Summarizer({ pageContent, pageTitle }: SummarizerProps) {
  const [summaries, setSummaries] = useState<Record<SummaryType, Summary | null>>({
    tldr: null,
    bullets: null,
    eli5: null,
    keypoints: null,
    questions: null,
  })
  const [loading, setLoading] = useState<SummaryType | null>(null)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<SummaryType | null>(null)
  const [copied, setCopied] = useState(false)

  const generateSummary = async (type: SummaryType) => {
    if (loading) return
    
    // Return cached
    if (summaries[type]) {
      setActiveTab(type)
      return
    }

    setLoading(type)
    setError('')

    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, pageContent, pageTitle }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to generate summary')
        return
      }

      const summary: Summary = {
        type,
        content: data.summary,
        generatedAt: new Date(),
      }

      setSummaries(prev => ({ ...prev, [type]: summary }))
      setActiveTab(type)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  const copyActive = async () => {
    if (!activeTab || !summaries[activeTab]) return
    await navigator.clipboard.writeText(summaries[activeTab]!.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const activeSummary = activeTab ? summaries[activeTab] : null

  return (
    <div className="space-y-4">
      {/* Summary Type Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {SUMMARY_OPTIONS.map(option => {
          const isLoaded = !!summaries[option.type]
          const isActive = activeTab === option.type
          const isCurrentlyLoading = loading === option.type

          return (
            <button
              key={option.type}
              onClick={() => generateSummary(option.type)}
              disabled={!!loading || !pageContent}
              className={`relative flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all ${
                !pageContent
                  ? 'opacity-40 cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  : isActive
                  ? `${option.color} border-2 ring-1 ring-current/20`
                  : isLoaded
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10'
              }`}
            >
              <span className={`${isActive ? '' : 'text-slate-500 dark:text-slate-400'}`}>
                {isCurrentlyLoading ? <Loader2 size={14} className="animate-spin" /> : option.icon}
              </span>
              <div>
                <div className={`text-xs font-semibold ${isActive ? '' : 'text-slate-700 dark:text-slate-300'}`}>
                  {option.label}
                </div>
                <div className={`text-xs leading-tight mt-0.5 ${isActive ? 'opacity-70' : 'text-slate-400 dark:text-slate-500'}`}>
                  {option.description}
                </div>
              </div>

              {/* Cached indicator */}
              {isLoaded && !isActive && (
                <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-green-400" title="Cached" />
              )}
            </button>
          )
        })}
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Active Summary */}
      {activeSummary && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {SUMMARY_OPTIONS.find(o => o.type === activeTab)?.label}
            </span>
            <button
              onClick={copyActive}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div className="p-4 text-sm text-slate-700 dark:text-slate-300 prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 leading-relaxed">
            <ReactMarkdown>{activeSummary.content}</ReactMarkdown>
          </div>
        </div>
      )}

      {!pageContent && (
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-2">
          Load a page above to generate summaries
        </p>
      )}
    </div>
  )
}
