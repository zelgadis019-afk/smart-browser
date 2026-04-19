'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Loader2, Bot, User, Trash2, Copy, Check } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { ChatMessage } from '@/app/types'

interface ChatPanelProps {
  pageContent: string
  pageTitle: string
  pageId?: string
}

let messageCounter = 0

export default function ChatPanel({ pageContent, pageTitle, pageId }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMessages([])
    setError('')
  }, [pageId, pageContent])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const copyMessage = async (content: string, id: string) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const sendMessage = useCallback(async () => {
    const question = input.trim()
    if (!question || isLoading) return
    if (!pageContent) {
      setError('Load a page first before chatting.')
      return
    }

    const userMsg: ChatMessage = {
      id: `msg-${++messageCounter}`,
      role: 'user',
      content: question,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)
    setError('')

    // Resize textarea back
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const history = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          pageContent,
          pageTitle,
          history,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to get response')
        setMessages(prev => prev.filter(m => m.id !== userMsg.id))
        return
      }

      const assistantMsg: ChatMessage = {
        id: `msg-${++messageCounter}`,
        role: 'assistant',
        content: data.answer,
        timestamp: new Date(),
      }

      setMessages(prev => [...prev, assistantMsg])
    } catch {
      setError('Network error. Please try again.')
      setMessages(prev => prev.filter(m => m.id !== userMsg.id))
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, pageContent, pageTitle, messages])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  const clearChat = () => {
    setMessages([])
    setError('')
  }

  const suggestedQuestions = [
    'What is this page about?',
    'Summarize the main points',
    'What are the key takeaways?',
    'Who is this written for?',
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Bot size={14} className="text-white" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">AI Chat</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {pageContent ? `Chatting about: ${pageTitle?.slice(0, 30)}...` : 'Load a page to start'}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            {pageContent ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Bot size={24} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Ready to chat!</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ask anything about the page</p>
                </div>
                <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                  {suggestedQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(q); textareaRef.current?.focus() }}
                      className="text-left px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-400 hover:border-indigo-300 hover:text-indigo-600 dark:hover:border-indigo-700 dark:hover:text-indigo-400 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Bot size={24} className="text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No page loaded</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Enter a URL or paste content to begin</p>
                </div>
              </>
            )}
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
              msg.role === 'user'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>

            {/* Bubble */}
            <div className={`group relative max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-sm'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>

              {/* Copy button */}
              <button
                onClick={() => copyMessage(msg.content, msg.id)}
                className="absolute -bottom-5 right-0 opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
              >
                {copiedId === msg.id ? <Check size={10} /> : <Copy size={10} />}
                {copiedId === msg.id ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
              <Bot size={12} className="text-slate-600 dark:text-slate-400" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-700 dark:text-red-400 animate-fade-in">
            <span>{error}</span>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-end gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3 py-2 focus-within:border-indigo-400 focus-within:ring-1 focus-within:ring-indigo-400 transition-all">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={pageContent ? 'Ask about this page...' : 'Load a page first...'}
            disabled={!pageContent || isLoading}
            rows={1}
            className="flex-1 resize-none bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none leading-relaxed max-h-[120px] disabled:cursor-not-allowed"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || !pageContent || isLoading}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-700 text-white disabled:text-slate-400 rounded-xl transition-colors mb-0.5"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 text-center">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  )
}
