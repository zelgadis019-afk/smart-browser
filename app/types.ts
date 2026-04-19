export interface PageData {
  id?: string
  url?: string
  title: string
  content: string
  tags?: string[]
  createdAt?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Summary {
  type: 'tldr' | 'bullets' | 'eli5' | 'keypoints' | 'questions'
  content: string
  generatedAt?: Date
}

export interface ExtractedResult {
  type: 'emails' | 'phones' | 'tables' | 'all'
  data: unknown
  count?: number
  counts?: Record<string, number>
}

export interface HistoryEntry {
  id: string
  url?: string
  title: string
  tags: string[]
  created_at: string
}
