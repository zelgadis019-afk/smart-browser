import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const MODEL = 'gpt-4o-mini'
export const MAX_TOKENS = 2000
export const CHUNK_SIZE = 3000  // chars per chunk
export const MAX_CHUNKS = 5     // max chunks to send

/**
 * Split content into chunks for context window management
 */
export function chunkContent(content: string, chunkSize = CHUNK_SIZE): string[] {
  const chunks: string[] = []
  
  // Try to split on paragraph boundaries
  const paragraphs = content.split(/\n\n+/)
  let current = ''
  
  for (const para of paragraphs) {
    if ((current + para).length > chunkSize && current.length > 0) {
      chunks.push(current.trim())
      current = para
    } else {
      current += (current ? '\n\n' : '') + para
    }
  }
  
  if (current.trim()) {
    chunks.push(current.trim())
  }
  
  return chunks
}

/**
 * Find most relevant chunks for a query using simple keyword matching
 * (Basic RAG - no embeddings required)
 */
export function retrieveRelevantChunks(
  chunks: string[],
  query: string,
  maxChunks = MAX_CHUNKS
): string[] {
  if (chunks.length <= maxChunks) return chunks
  
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  
  const scored = chunks.map((chunk, i) => {
    const lower = chunk.toLowerCase()
    let score = 0
    
    // Score based on query word matches
    for (const word of queryWords) {
      const matches = (lower.match(new RegExp(word, 'g')) || []).length
      score += matches
    }
    
    // Slight boost for first and last chunks (intro/conclusion)
    if (i === 0) score += 2
    if (i === chunks.length - 1) score += 1
    
    return { chunk, score, index: i }
  })
  
  // Sort by score, take top maxChunks, re-sort by original index to maintain order
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks)
    .sort((a, b) => a.index - b.index)
    .map(s => s.chunk)
}

/**
 * Build context string from page content for AI
 */
export function buildContext(content: string, query?: string): string {
  const chunks = chunkContent(content)
  const relevant = query 
    ? retrieveRelevantChunks(chunks, query)
    : chunks.slice(0, MAX_CHUNKS)
  
  return relevant.join('\n\n---\n\n')
}

/**
 * Estimate token count (rough: ~4 chars per token)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
