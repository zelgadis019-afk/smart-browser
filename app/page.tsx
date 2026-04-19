'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/app/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Globe, Moon, Sun, Save, LogOut, ChevronRight, ChevronLeft, History, MessageSquare, Zap, Database, BookOpen } from 'lucide-react'
import UrlInput from '@/app/components/UrlInput'
import ChatPanel from '@/app/components/ChatPanel'
import Summarizer from '@/app/components/Summarizer'
import DataExtractor from '@/app/components/DataExtractor'
import HistoryPanel from '@/app/components/HistoryPanel'
import SavePageModal from '@/app/components/SavePageModal'
import AuthForm from '@/app/components/AuthForm'
import { PageData, HistoryEntry } from '@/app/types'
import toast, { Toaster } from 'react-hot-toast'

type RightTab = 'chat' | 'summarize' | 'extract'
type LeftSection = 'input' | 'history'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [isDark, setIsDark] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState<PageData | null>(null)
  const [rightTab, setRightTab] = useState<RightTab>('chat')
  const [leftSection, setLeftSection] = useState<LeftSection>('input')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Dark mode
  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const dark = stored === 'dark' || (!stored && prefersDark)
    setIsDark(dark)
    document.documentElement.classList.toggle('dark', dark)
  }, [])

  const toggleDark = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  const handlePageLoaded = useCallback((title: string, content: string, url?: string) => {
    setCurrentPage({ title, content, url })
    setRightTab('chat')
    toast.success(`Page loaded: ${title.slice(0, 40)}...`, {
      style: {
        background: isDark ? '#1e293b' : '#fff',
        color: isDark ? '#e2e8f0' : '#0f172a',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        fontSize: '13px',
      }
    })
  }, [isDark])

  const handleHistorySelect = async (entry: HistoryEntry) => {
    // Load from Supabase
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('id', entry.id)
      .single()

    if (error || !data) {
      toast.error('Failed to load page from history')
      return
    }

    setCurrentPage({
      id: data.id,
      url: data.url || undefined,
      title: data.title,
      content: data.content,
      tags: data.tags,
    })
    setLeftSection('input')
    setRightTab('chat')
    toast.success('Page loaded from history')
  }

  const handleSaved = () => {
    setHistoryRefresh(prev => prev + 1)
    toast.success('Page saved to history!')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setCurrentPage(null)
    toast.success('Signed out')
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  const RIGHT_TABS: { id: RightTab; label: string; icon: React.ReactNode }[] = [
    { id: 'chat', label: 'Chat', icon: <MessageSquare size={13} /> },
    { id: 'summarize', label: 'Summarize', icon: <Zap size={13} /> },
    { id: 'extract', label: 'Extract', icon: <Database size={13} /> },
  ]

  return (
    <div className={`h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden`}>
      <Toaster position="top-center" />

      {/* Top Nav */}
      <nav className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Globe size={14} className="text-white" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">AI Smart Browser</span>
          {currentPage && (
            <>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px] truncate">
                {currentPage.title}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {currentPage && user && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg transition-colors"
            >
              <Save size={11} />
              Save
            </button>
          )}
          <button
            onClick={toggleDark}
            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            {isDark ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => window.location.href = '/login'}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar */}
        <div className={`flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${sidebarCollapsed ? 'w-12' : 'w-80'}`}>
          {!sidebarCollapsed && (
            <>
              {/* Section Tabs */}
              <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setLeftSection('input')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                    leftSection === 'input'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <BookOpen size={12} />
                  Page Input
                </button>
                <button
                  onClick={() => { setLeftSection('history'); if (!user) toast('Sign in to view history') }}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                    leftSection === 'history'
                      ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400 -mb-px'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <History size={12} />
                  History
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {leftSection === 'input' ? (
                  <div className="space-y-4">
                    <UrlInput
                      onPageLoaded={handlePageLoaded}
                      isLoading={isLoading}
                      setIsLoading={setIsLoading}
                    />

                    {/* Page stats */}
                    {currentPage && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl space-y-2 animate-fade-in">
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Current Page</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{currentPage.title}</p>
                        {currentPage.url && (
                          <a
                            href={currentPage.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-indigo-500 dark:text-indigo-400 hover:underline truncate block"
                          >
                            {currentPage.url.slice(0, 50)}...
                          </a>
                        )}
                        <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
                          <span>{currentPage.content.length.toLocaleString()} chars</span>
                          <span>~{Math.ceil(currentPage.content.length / 4).toLocaleString()} tokens</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  user ? (
                    <HistoryPanel
                      onSelect={handleHistorySelect}
                      refreshTrigger={historyRefresh}
                    />
                  ) : (
                    <div className="text-center py-8 space-y-3">
                      <History size={24} className="mx-auto text-slate-300 dark:text-slate-600" />
                      <p className="text-xs text-slate-500 dark:text-slate-400">Sign in to save and view page history</p>
                      <button
                        onClick={() => window.location.href = '/login'}
                        className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
                      >
                        Sign In
                      </button>
                    </div>
                  )
                )}
              </div>
            </>
          )}

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex-shrink-0 flex items-center justify-center py-2 border-t border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Right Tabs */}
          <div className="flex-shrink-0 flex items-center gap-1 px-4 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
            {RIGHT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  rightTab === tab.id
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {rightTab === 'chat' && (
              <ChatPanel
                pageContent={currentPage?.content || ''}
                pageTitle={currentPage?.title || ''}
                pageId={currentPage?.id}
              />
            )}

            {rightTab === 'summarize' && (
              <div className="h-full overflow-y-auto p-4">
                <Summarizer
                  pageContent={currentPage?.content || ''}
                  pageTitle={currentPage?.title || ''}
                />
              </div>
            )}

            {rightTab === 'extract' && (
              <div className="h-full overflow-y-auto p-4">
                <DataExtractor pageContent={currentPage?.content || ''} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Modal */}
      {currentPage && (
        <SavePageModal
          isOpen={showSaveModal}
          onClose={() => setShowSaveModal(false)}
          onSaved={handleSaved}
          pageData={currentPage}
        />
      )}
    </div>
  )
}
