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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const item = await prisma.portfolioItem.findUnique({ where: { id } })

  if (!item || item.creatorId !== creatorProfile.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json()
  const validated = portfolioItemSchema.parse(body)

  const updated = await prisma.portfolioItem.update({
    where: { id },
    data: {
      ...validated,
      toolsUsed: stringifyJsonArray(validated.toolsUsed),
      skillTags: stringifyJsonArray(validated.skillTags)
    }
  })

  return NextResponse.json({
    ...updated,
    toolsUsed: parseJsonArray(updated.toolsUsed),
    skillTags: parseJsonArray(updated.skillTags)
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const item = await prisma.portfolioItem.findUnique({ where: { id } })

  if (!item || item.creatorId !== creatorProfile.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.portfolioItem.delete({ where: { id } })

  return NextResponse.json({ success: true })
}