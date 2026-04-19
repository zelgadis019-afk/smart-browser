import { NextRequest, NextResponse } from 'next/server'
import { openai, MODEL } from '@/app/lib/openai'
import { extractAll } from '@/app/utils/extractor'
import { checkRateLimit } from '@/app/utils/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { allowed } = checkRateLimit(`extract:${ip}`)
    
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 })
    }

    const body = await request.json()
    const { type, pageContent } = body

    if (!pageContent) {
      return NextResponse.json({ error: 'Page content is required' }, { status: 400 })
    }

    // Run regex-based extraction first
    const regexResults = extractAll(pageContent)

    if (type === 'emails') {
      let emails = regexResults.emails
      
      // AI fallback if regex finds nothing
      if (emails.length === 0) {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Extract all email addresses from this text. Return ONLY a JSON array of strings. If none found, return [].

TEXT:
${pageContent.slice(0, 8000)}

Return format: ["email@example.com", "other@site.com"]`
          }],
          temperature: 0,
        })
        
        try {
          const text = completion.choices[0]?.message?.content || '[]'
          const cleaned = text.replace(/```json|```/g, '').trim()
          emails = JSON.parse(cleaned)
        } catch {
          emails = []
        }
      }
      
      return NextResponse.json({ type: 'emails', data: emails, count: emails.length })
    }

    if (type === 'phones') {
      let phones = regexResults.phones
      
      // AI fallback
      if (phones.length === 0) {
        const completion = await openai.chat.completions.create({
          model: MODEL,
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Extract all phone numbers from this text. Return ONLY a JSON array of strings. If none found, return [].

TEXT:
${pageContent.slice(0, 8000)}

Return format: ["+1 (555) 555-5555", "555-1234"]`
          }],
          temperature: 0,
        })
        
        try {
          const text = completion.choices[0]?.message?.content || '[]'
          const cleaned = text.replace(/```json|```/g, '').trim()
          phones = JSON.parse(cleaned)
        } catch {
          phones = []
        }
      }
      
      return NextResponse.json({ type: 'phones', data: phones, count: phones.length })
    }

    if (type === 'tables') {
      const regexTables = regexResults.tables
      
      // Use AI to extract structured tables from content
      const completion = await openai.chat.completions.create({
        model: MODEL,
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Extract any tables or structured data from this content. Return a JSON array where each element is an array of objects (rows with column names as keys).

If no tables found, return any structured/list data as a table. If truly nothing structured exists, return [].

TEXT:
${pageContent.slice(0, 10000)}

Return format: [[{"col1": "val1", "col2": "val2"}, ...], ...]
Return ONLY valid JSON, no explanation.`
        }],
        temperature: 0,
      })
      
      let aiTables: Record<string, string>[][] = []
      try {
        const text = completion.choices[0]?.message?.content || '[]'
        const cleaned = text.replace(/```json|```/g, '').trim()
        aiTables = JSON.parse(cleaned)
      } catch {
        aiTables = []
      }
      
      const tables = [...regexTables, ...aiTables]
      return NextResponse.json({ type: 'tables', data: tables, count: tables.length })
    }

    if (type === 'all') {
      return NextResponse.json({
        type: 'all',
        data: regexResults,
        counts: {
          emails: regexResults.emails.length,
          phones: regexResults.phones.length,
          tables: regexResults.tables.length,
        }
      })
    }

    return NextResponse.json({ error: 'Invalid extraction type' }, { status: 400 })

  } catch (error) {
    console.error('extract error:', error)
    return NextResponse.json({ error: 'Extraction failed.' }, { status: 500 })
  }
}
