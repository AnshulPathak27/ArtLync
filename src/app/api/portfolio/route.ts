import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { parseJsonArray, stringifyJsonArray } from '@/types'

const portfolioItemSchema = z.object({
  title: z.string().min(1),
  mediaUrl: z.string().url(),
  mediaType: z.enum(['IMAGE', 'VIDEO_LINK']),
  toolsUsed: z.array(z.string()),
  skillTags: z.array(z.string()),
  workflowNote: z.string().optional()
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CREATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id }
  })

  if (!creatorProfile) {
    return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
  }

  const body = await request.json()
  const validated = portfolioItemSchema.parse(body)

  const item = await prisma.portfolioItem.create({
    data: {
      ...validated,
      toolsUsed: stringifyJsonArray(validated.toolsUsed),
      skillTags: stringifyJsonArray(validated.skillTags),
      creatorId: creatorProfile.id
    }
  })

  return NextResponse.json({
    ...item,
    toolsUsed: parseJsonArray(item.toolsUsed),
    skillTags: parseJsonArray(item.skillTags)
  }, { status: 201 })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CREATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id }
  })

  if (!creatorProfile) {
    return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
  }

  const items = await prisma.portfolioItem.findMany({
    where: { creatorId: creatorProfile.id },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(items.map(item => ({
    ...item,
    toolsUsed: parseJsonArray(item.toolsUsed),
    skillTags: parseJsonArray(item.skillTags)
  })))
}