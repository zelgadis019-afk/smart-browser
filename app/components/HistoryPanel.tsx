'use client'

import { useState, useEffect } from 'react'
import { Clock, Search, Tag, ExternalLink, Loader2, Globe, FileText } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { HistoryEntry } from '@/app/types'

interface HistoryPanelProps {
  onSelect: (entry: HistoryEntry) => void
  refreshTrigger?: number
}

export default function HistoryPanel({ onSelect, refreshTrigger }: HistoryPanelProps) {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState('')

  const fetchHistory = async () => {
    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      let query = supabase
        .from('pages')
        .select('id, url, title, tags, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,url.ilike.%${searchQuery}%`)
      }

      const { data, error: dbError } = await query

      if (dbError) throw dbError

      setEntries(data || [])
    } catch (err) {
      console.error(err)
      setError('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger])

  useEffect(() => {
    const timeout = setTimeout(fetchHistory, 300)
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)
    const days = hours / 24

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${Math.floor(hours)}h ago`
    if (days < 7) return `${Math.floor(days)}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search history..."
          className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 size={16} className="animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <p className="text-xs text-center text-red-500 py-4">{error}</p>
      ) : entries.length === 0 ? (
        <div className="text-center py-6 space-y-2">
          <Clock size={20} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {searchQuery ? 'No results found' : 'No saved pages yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {entries.map(entry => (
            <button
              key={entry.id}
              onClick={() => onSelect(entry)}
              className="w-full text-left p-3 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 border border-slate-100 dark:border-slate-700 rounded-xl transition-colors group"
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex-shrink-0">
                  {entry.url ? (
                    <Globe size={13} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  ) : (
                    <FileText size={13} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate transition-colors">
                    {entry.title}
                  </p>
                  {entry.url && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                      {entry.url.replace(/^https?:\/\//, '').slice(0, 45)}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(entry.created_at)}
                    </span>
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {entry.tags.slice(0, 2).map(tag => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-xs"
                          >
                            <Tag size={9} />
                            {tag}
                          </span>
                        ))}
                        {entry.tags.length > 2 && (
                          <span className="text-xs text-slate-400">+{entry.tags.length - 2}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <ExternalLink size={11} className="flex-shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400 transition-colors mt-1" />
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
