import { NextRequest, NextResponse } from 'next/server'
import { cleanHTML, isValidUrl, normalizeUrl } from '@/app/utils/parser'
import { checkRateLimit } from '@/app/utils/rateLimit'

// Simple in-memory cache (use Redis in production)
const pageCache = new Map<string, { title: string; content: string; cachedAt: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 minutes

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { allowed, remaining } = checkRateLimit(`fetch:${ip}`)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { url, pastedContent } = body

    // Handle pasted content
    if (pastedContent) {
      const { title, content } = cleanHTML(pastedContent)
      return NextResponse.json({ title, content, source: 'paste' })
    }

    // Validate URL
    if (!url) {
      return NextResponse.json({ error: 'URL or content is required' }, { status: 400 })
    }

    const normalizedUrl = normalizeUrl(url)
    
    if (!isValidUrl(normalizedUrl)) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 })
    }

    // Check cache
    const cached = pageCache.get(normalizedUrl)
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL) {
      return NextResponse.json({ 
        title: cached.title, 
        content: cached.content, 
        source: 'cache',
        url: normalizedUrl 
      })
    }

    // Fetch the page
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000) // 15s timeout

    let html: string
    try {
      const response = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AISmartBrowser/1.0; +https://aismartbrowser.com)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      })
      
      clearTimeout(timeout)
      
      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to fetch page: HTTP ${response.status}` },
          { status: 422 }
        )
      }

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('html') && !contentType.includes('text')) {
        return NextResponse.json(
          { error: 'URL does not point to a webpage (not HTML)' },
          { status: 422 }
        )
      }

      html = await response.text()
    } catch (fetchError) {
      clearTimeout(timeout)
      if ((fetchError as Error).name === 'AbortError') {
        return NextResponse.json({ error: 'Request timed out (15s)' }, { status: 408 })
      }
      return NextResponse.json(
        { error: 'Could not reach the URL. Check if it\'s accessible.' },
        { status: 422 }
      )
    }

    // Clean and parse HTML
    const { title, content } = cleanHTML(html)

    if (!content || content.length < 50) {
      return NextResponse.json(
        { error: 'Page content is too short or empty' },
        { status: 422 }
      )
    }

    // Cache the result
    pageCache.set(normalizedUrl, { title, content, cachedAt: Date.now() })
    
    // Limit cache size
    if (pageCache.size > 100) {
      const firstKey = pageCache.keys().next().value
      if (firstKey) pageCache.delete(firstKey)
    }

    return NextResponse.json({ 
      title, 
      content, 
      source: 'fetch',
      url: normalizedUrl,
      stats: {
        chars: content.length,
        estimatedTokens: Math.ceil(content.length / 4),
      }
    })

  } catch (error) {
    console.error('fetch-page error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
