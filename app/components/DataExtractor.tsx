'use client'

import { useState } from 'react'
import { Loader2, Mail, Phone, Table, Download, Copy, Check, AlertCircle } from 'lucide-react'

interface ExtractorProps {
  pageContent: string
}

type ExtractType = 'emails' | 'phones' | 'tables'

interface ExtractResult {
  type: ExtractType
  data: unknown
  count: number
}

export default function DataExtractor({ pageContent }: ExtractorProps) {
  const [results, setResults] = useState<Record<ExtractType, ExtractResult | null>>({
    emails: null,
    phones: null,
    tables: null,
  })
  const [loading, setLoading] = useState<ExtractType | null>(null)
  const [activeTab, setActiveTab] = useState<ExtractType | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const extract = async (type: ExtractType) => {
    if (loading) return

    // Return cached
    if (results[type]) {
      setActiveTab(type)
      return
    }

    setLoading(type)
    setError('')

    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, pageContent }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Extraction failed')
        return
      }

      setResults(prev => ({ ...prev, [type]: data }))
      setActiveTab(type)
    } catch {
      setError('Network error')
    } finally {
      setLoading(null)
    }
  }

  const copyResult = async () => {
    if (!activeTab || !results[activeTab]) return
    const text = JSON.stringify(results[activeTab]!.data, null, 2)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadJSON = () => {
    if (!activeTab || !results[activeTab]) return
    const blob = new Blob([JSON.stringify(results[activeTab]!.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extracted-${activeTab}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const activeResult = activeTab ? results[activeTab] : null

  const EXTRACT_OPTIONS = [
    {
      type: 'emails' as ExtractType,
      label: 'Emails',
      icon: <Mail size={14} />,
      color: 'text-blue-600 dark:text-blue-400',
      bgActive: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700',
    },
    {
      type: 'phones' as ExtractType,
      label: 'Phone Numbers',
      icon: <Phone size={14} />,
      color: 'text-green-600 dark:text-green-400',
      bgActive: 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700',
    },
    {
      type: 'tables' as ExtractType,
      label: 'Tables / Data',
      icon: <Table size={14} />,
      color: 'text-purple-600 dark:text-purple-400',
      bgActive: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300 dark:border-purple-700',
    },
  ]

  const renderResult = (result: ExtractResult) => {
    const data = result.data

    if (result.type === 'emails' || result.type === 'phones') {
      const items = data as string[]
      if (!items || items.length === 0) {
        return (
          <div className="flex items-center gap-2 py-6 justify-center text-slate-400 dark:text-slate-500 text-sm">
            <AlertCircle size={14} />
            No {result.type} found on this page
          </div>
        )
      }

      return (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg group">
              <span className="text-sm text-slate-700 dark:text-slate-300 font-mono">{item}</span>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(item)
                }}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
              >
                <Copy size={12} />
              </button>
            </div>
          ))}
        </div>
      )
    }

    if (result.type === 'tables') {
      const tables = data as Record<string, string>[][]
      if (!tables || tables.length === 0) {
        return (
          <div className="flex items-center gap-2 py-6 justify-center text-slate-400 dark:text-slate-500 text-sm">
            <AlertCircle size={14} />
            No tables or structured data found
          </div>
        )
      }

      return (
        <div className="space-y-4">
          {tables.map((table, tableIndex) => {
            if (!table || table.length === 0) return null
            const headers = Object.keys(table[0] || {})

            return (
              <div key={tableIndex} className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                      {headers.map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        {headers.map(h => (
                          <td key={h} className="px-3 py-2 text-slate-700 dark:text-slate-300">
                            {row[h] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )
    }

    return null
  }

  return (
    <div className="space-y-4">
      {/* Extraction buttons */}
      <div className="grid grid-cols-3 gap-2">
        {EXTRACT_OPTIONS.map(option => {
          const isLoaded = !!results[option.type]
          const isActive = activeTab === option.type
          const isCurrentlyLoading = loading === option.type

          return (
            <button
              key={option.type}
              onClick={() => extract(option.type)}
              disabled={!!loading || !pageContent}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isActive
                  ? option.bgActive
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              <span className={isActive ? option.color : 'text-slate-500 dark:text-slate-400'}>
                {isCurrentlyLoading ? <Loader2 size={14} className="animate-spin" /> : option.icon}
              </span>
              <span className={`text-xs font-medium ${isActive ? option.color : 'text-slate-600 dark:text-slate-400'}`}>
                {option.label}
              </span>
              {isLoaded && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
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

      {/* Results */}
      {activeResult && (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden animate-slide-up">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {activeResult.count ?? 0} found
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyResult}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                JSON
              </button>
              <button
                onClick={downloadJSON}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
              >
                <Download size={11} />
                Download
              </button>
            </div>
          </div>
          <div className="p-4 max-h-64 overflow-y-auto">
            {renderResult(activeResult)}
          </div>
        </div>
      )}

      {!pageContent && (
        <p className="text-xs text-center text-slate-400 dark:text-slate-500 py-2">
          Load a page above to extract data
        </p>
      )}
    </div>
  )
}
