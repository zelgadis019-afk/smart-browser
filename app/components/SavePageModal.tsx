'use client'

import { useState } from 'react'
import { X, Save, Tag, Loader2, Check } from 'lucide-react'
import { supabase } from '@/app/lib/supabase'
import { PageData } from '@/app/types'

interface SavePageModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  pageData: PageData
}

export default function SavePageModal({ isOpen, onClose, onSaved, pageData }: SavePageModalProps) {
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to save pages')
        return
      }

      const tagList = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(Boolean)

      const { error: dbError } = await supabase.from('pages').insert({
        user_id: user.id,
        url: pageData.url || null,
        title: pageData.title,
        content: pageData.content.slice(0, 100000), // Limit to 100k chars
        tags: tagList,
      })

      if (dbError) throw dbError

      setSaved(true)
      setTimeout(() => {
        onSaved()
        onClose()
        setSaved(false)
        setTags('')
      }, 1200)
    } catch (err) {
      console.error(err)
      setError('Failed to save page. Try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Save size={13} className="text-white" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Save Page</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Page info */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{pageData.title}</p>
            {pageData.url && (
              <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{pageData.url}</p>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {pageData.content.length.toLocaleString()} characters
            </p>
          </div>

          {/* Tags input */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <Tag size={11} />
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g. research, ai, article"
              className="w-full px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl transition-colors"
          >
            {saved ? (
              <>
                <Check size={13} />
                Saved!
              </>
            ) : saving ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={13} />
                Save Page
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
