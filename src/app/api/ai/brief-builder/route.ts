import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SYSTEM_PROMPT = `You are an AI assistant that extracts structured brief information from a rough idea.
Extract the following fields and return as JSON:
- contentType: "video" | "animation" | "graphic" | "other"
- style: string (e.g., "anime", "minimalist", "cinematic", "3d")
- formatAspectRatio: string (e.g., "16:9", "9:16", "1:1", "4:5")
- commercialUseRequirements: string (usage rights, territory, duration, exclusivity)
- jobType: string (optional, e.g., "social ad", "explainer video", "brand film")
- location: string (optional, e.g., "remote", "New York", "London")

If a field cannot be determined, use a sensible default or empty string.`

async function callLocalLLM(prompt: string): Promise<any> {
  const endpoint = process.env.LLM_ENDPOINT || 'http://localhost:11434/v1'
  const model = process.env.LLM_MODEL || 'llama3'

  try {
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      }),
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) throw new Error('LLM request failed')

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) throw new Error('No content from LLM')

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error('No JSON found in response')
  } catch {
    throw new Error('LLM unavailable')
  }
}

function ruleBasedExtractor(prompt: string): any {
  const lower = prompt.toLowerCase()

  let contentType = 'video'
  if (lower.includes('animation') || lower.includes('animate')) contentType = 'animation'
  else if (lower.includes('graphic') || lower.includes('image') || lower.includes('illustration')) contentType = 'graphic'

  let style = ''
  const styles = ['anime', 'minimalist', 'cinematic', '3d', 'cartoon', 'realistic', 'abstract', 'vintage', 'modern', 'cyberpunk']
  for (const s of styles) {
    if (lower.includes(s)) { style = s; break }
  }

  let formatAspectRatio = '16:9'
  if (lower.includes('9:16') || lower.includes('vertical') || lower.includes('reel') || lower.includes('tiktok') || lower.includes('story')) formatAspectRatio = '9:16'
  else if (lower.includes('1:1') || lower.includes('square') || lower.includes('instagram post')) formatAspectRatio = '1:1'
  else if (lower.includes('4:5') || lower.includes('portrait')) formatAspectRatio = '4:5'

  let jobType = ''
  const jobTypes = ['social ad', 'explainer video', 'brand film', 'product demo', 'music video', 'educational']
  for (const j of jobTypes) {
    if (lower.includes(j)) { jobType = j; break }
  }

  let location = ''
  if (lower.includes('remote')) location = 'remote'
  else {
    const cities = ['new york', 'london', 'los angeles', 'san francisco', 'tokyo', 'paris', 'berlin', 'sydney']
    for (const c of cities) {
      if (lower.includes(c)) { location = c; break }
    }
  }

  return {
    contentType,
    style: style || 'modern',
    formatAspectRatio,
    commercialUseRequirements: 'Standard commercial license, worldwide, perpetual, non-exclusive',
    jobType: jobType || undefined,
    location: location || undefined
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'BRAND') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { prompt } = await request.json()

  if (!prompt || typeof prompt !== 'string') {
    return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
  }

  let extracted: any

  try {
    extracted = await callLocalLLM(prompt)
  } catch {
    extracted = ruleBasedExtractor(prompt)
  }

  return NextResponse.json(extracted)
}