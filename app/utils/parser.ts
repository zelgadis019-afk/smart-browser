/**
 * Clean and extract text content from raw HTML
 * Removes scripts, styles, ads, nav elements, etc.
 */
export function cleanHTML(html: string): { title: string; content: string } {
  // Remove script tags and their content
  let cleaned = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
  
  // Extract title
  const titleMatch = cleaned.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch 
    ? titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
    : 'Untitled Page'
  
  // Remove nav, header, footer, sidebar, ads (common patterns)
  cleaned = cleaned
    .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<header\b[^>]*>[\s\S]*?<\/header>/gi, '')
    .replace(/<footer\b[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside\b[^>]*>[\s\S]*?<\/aside>/gi, '')
    .replace(/<[^>]*class="[^"]*(?:ad|advertisement|sidebar|nav|menu|cookie|popup|modal|banner)[^"]*"[^>]*>[\s\S]*?<\/[^>]+>/gi, '')
  
  // Convert block elements to newlines
  cleaned = cleaned
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/ul>/gi, '\n')
    .replace(/<\/ol>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>/gi, '\t')
    .replace(/<\/th>/gi, '\t')
  
  // Strip all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '')
  
  // Decode HTML entities
  cleaned = cleaned
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x([0-9A-Fa-f]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
  
  // Clean up whitespace
  cleaned = cleaned
    .replace(/\t+/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim()
  
  // Limit content size (roughly 50k chars = ~12k tokens)
  const MAX_CONTENT = 50000
  if (cleaned.length > MAX_CONTENT) {
    cleaned = cleaned.slice(0, MAX_CONTENT) + '\n\n[Content truncated for token optimization...]'
  }
  
  return { title, content: cleaned }
}

/**
 * Extract raw text from pasted content (user paste)
 */
export function cleanPastedContent(text: string): { title: string; content: string } {
  // Try to detect if it's HTML
  if (text.trim().startsWith('<') && text.includes('</')) {
    return cleanHTML(text)
  }
  
  // Plain text - just clean it up
  const lines = text.split('\n')
  const title = lines[0]?.trim().slice(0, 100) || 'Pasted Content'
  const content = text.trim().slice(0, 50000)
  
  return { title, content }
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Normalize URL (add https if missing)
 */
export function normalizeUrl(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`
  }
  return url
}
