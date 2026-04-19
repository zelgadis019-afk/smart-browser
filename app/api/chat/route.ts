import { NextRequest, NextResponse } from 'next/server'
import { openai, MODEL, MAX_TOKENS, buildContext } from '@/app/lib/openai'
import { checkRateLimit } from '@/app/utils/rateLimit'

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { allowed } = checkRateLimit(`chat:${ip}`)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { question, pageContent, pageTitle, history = [] } = body

    if (!question) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    }

    if (!pageContent) {
      return NextResponse.json({ error: 'Page content is required' }, { status: 400 })
    }

    // Build relevant context using RAG-like chunking
    const context = buildContext(pageContent, question)
    
    const systemPrompt = `You are an intelligent assistant helping users understand and analyze webpage content. You have been given the content of a webpage titled "${pageTitle || 'Unknown Page'}".

Answer questions accurately based on the provided content. If information is not in the content, say so clearly. Be concise but thorough.

WEBPAGE CONTENT:
---
${context}
---

Guidelines:
- Answer based on the content above
- If something isn't in the content, say "This information isn't available in the provided content"
- Format responses with markdown when helpful (lists, bold, etc.)
- Be conversational and helpful`

    // Build messages array with history
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10), // Keep last 10 exchanges for context
      { role: 'user', content: question }
    ]

    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages,
      temperature: 0.7,
    })

    const answer = completion.choices[0]?.message?.content || 'I could not generate a response.'
    
    return NextResponse.json({ 
      answer,
      usage: completion.usage,
    })

  } catch (error: unknown) {
    console.error('chat error:', error)
    
    // Handle OpenAI specific errors
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number; message: string }
      if (apiError.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI rate limit reached. Please try again in a moment.' },
          { status: 429 }
        )
      }
      if (apiError.status === 401) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key. Check your configuration.' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate response. Please try again.' },
      { status: 500 }
    )
  }
}
