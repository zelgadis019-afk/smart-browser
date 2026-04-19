/**
 * Data extraction utilities for emails, phones, tables, links
 */

export interface ExtractedData {
  emails: string[]
  phones: string[]
  links: { text: string; url: string }[]
  tables: Record<string, string>[][]
}

/**
 * Extract email addresses from text
 */
export function extractEmails(text: string): string[] {
  const emailRegex = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/g
  const matches = text.match(emailRegex) || []
  // Deduplicate and filter out common false positives
  return [...new Set(matches)].filter(email => 
    !email.includes('example.com') && 
    !email.includes('@2x') &&
    !email.endsWith('.png') &&
    !email.endsWith('.jpg')
  )
}

/**
 * Extract phone numbers from text
 */
export function extractPhones(text: string): string[] {
  const phonePatterns = [
    /\+?1?\s*[\-.]?\s*\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/g,  // US/CA
    /\+\d{1,3}\s*\(?\d{2,4}\)?\s*\d{3,4}[\s\-.]?\d{4}/g,          // International
    /\(\d{3}\)\s*\d{3}[\-.]?\d{4}/g,                                // (555) 555-5555
    /\d{3}[\-.]?\d{3}[\-.]?\d{4}/g,                                 // 555-555-5555
  ]
  
  const allPhones: string[] = []
  for (const pattern of phonePatterns) {
    const matches = text.match(pattern) || []
    allPhones.push(...matches)
  }
  
  // Clean and deduplicate
  const cleaned = allPhones
    .map(p => p.trim())
    .filter(p => p.replace(/\D/g, '').length >= 10)
  
  return [...new Set(cleaned)]
}

/**
 * Parse simple table-like structures from text
 */
export function extractTablesFromText(text: string): Record<string, string>[][] {
  const tables: Record<string, string>[][] = []
  
  // Look for tab-separated or pipe-separated tables
  const lines = text.split('\n')
  let currentTable: string[][] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    
    // Detect pipe-separated tables (markdown style)
    if (trimmed.includes('|')) {
      const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 2) {
        // Skip separator lines like |---|---|
        if (!trimmed.replace(/[|\-\s]/g, '')) continue
        currentTable.push(cells)
        continue
      }
    }
    
    // Detect tab-separated tables
    if (trimmed.includes('\t')) {
      const cells = trimmed.split('\t').map(c => c.trim()).filter(Boolean)
      if (cells.length >= 2) {
        currentTable.push(cells)
        continue
      }
    }
    
    // End of table
    if (currentTable.length >= 2) {
      const headers = currentTable[0]
      const rows = currentTable.slice(1)
        .filter(row => !row.every(cell => cell.replace(/-/g, '').trim() === ''))
        .map(row => {
          const obj: Record<string, string> = {}
          headers.forEach((header, i) => {
            obj[header] = row[i] || ''
          })
          return obj
        })
      
      if (rows.length > 0) {
        tables.push(rows)
      }
    }
    
    currentTable = []
  }
  
  return tables
}

/**
 * Extract links from HTML content
 */
export function extractLinksFromHTML(html: string): { text: string; url: string }[] {
  const linkRegex = /<a\s+[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  const links: { text: string; url: string }[] = []
  let match
  
  while ((match = linkRegex.exec(html)) !== null) {
    const url = match[1]
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    
    if (url && !url.startsWith('javascript:') && !url.startsWith('#')) {
      links.push({ text: text || url, url })
    }
  }
  
  return links.slice(0, 100) // Limit to 100 links
}

/**
 * Run all extractions on content
 */
export function extractAll(content: string): {
  emails: string[]
  phones: string[]
  tables: Record<string, string>[][]
} {
  return {
    emails: extractEmails(content),
    phones: extractPhones(content),
    tables: extractTablesFromText(content),
  }
}
