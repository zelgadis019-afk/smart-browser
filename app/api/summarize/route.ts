import { NextRequest, NextResponse } from 'next/server'
import { openai, MODEL, buildContext } from '@/app/lib/openai'
import { checkRateLimit } from '@/app/utils/rateLimit'

const SUMMARY_PROMPTS = {
  tldr: `Provide a TL;DR (Too Long; Didn't Read) summary of this content. Write 2-4 concise sentences that capture the most important points. Start with "TL;DR:"`,
  
  bullets: `Summarize the key points of this content as bullet points. 
- Use 5-10 bullet points
- Each point should be clear and actionable/informative
- Start each point with a relevant emoji
- Cover the most important aspects`,
  
  eli5: `Explain this content as if you're talking to a 10-year-old child. 
- Use simple, everyday words
- Use analogies and examples they'd understand  
- Keep it fun and engaging
- Avoid jargon completely
- Break complex ideas into simple concepts`,
  
  keypoints: `Extract and list the most important key points, facts, and takeaways from this content. Focus on actionable insights and notable information.`,
  
  questions: `Generate 5 insightful questions that this content raises or answers. These should be questions a curious reader might have.`,
}

export type SummaryType = keyof typeof SUMMARY_PROMPTS

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const { allowed } = checkRateLimit(`summarize:${ip}`)
    
    if (!allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { type, pageContent, pageTitle } = body

    if (!type || !SUMMARY_PROMPTS[type as SummaryType]) {
      return NextResponse.json({ error: 'Invalid summary type' }, { status: 400 })
    }

    if (!pageContent) {
      return NextResponse.json({ error: 'Page content is required' }, { status: 400 })
    }

    const context = buildContext(pageContent)
    const prompt = SUMMARY_PROMPTS[type as SummaryType]

    const completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1000,
      messages: [
        {
          role: 'system',
          content: `You are an expert content summarizer. Analyze the following webpage content titled "${pageTitle || 'Unknown'}" and provide the requested summary format.

CONTENT:
---
${context}
---`
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
      temperature: 0.5,
    })

    const summary = completion.choices[0]?.message?.content || 'Could not generate summary.'

    return NextResponse.json({ 
      summary,
      type,
      usage: completion.usage,
    })

  } catch (error: unknown) {
    console.error('summarize error:', error)
    
    if (error && typeof error === 'object' && 'status' in error) {
      const apiError = error as { status: number }
      if (apiError.status === 429) {
        return NextResponse.json(
          { error: 'OpenAI rate limit reached.' },
          { status: 429 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to generate summary.' },
      { status: 500 }
    )
  }
}
