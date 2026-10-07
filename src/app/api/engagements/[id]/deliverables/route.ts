import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const deliverableSchema = z.object({
  storageKey: z.string(),
  iv: z.string(),
  filename: z.string()
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const engagement = await prisma.engagement.findUnique({ where: { id } })

  if (!engagement) {
    return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
  }

  const isParticipant = engagement.brandId === session.user.id ||
    engagement.creatorId === (await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id }
    }))?.id

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const validated = deliverableSchema.parse(body)

  const deliverable = await prisma.deliverableFile.create({
    data: {
      ...validated,
      engagementId: id,
      uploaderId: session.user.id
    }
  })

  return NextResponse.json(deliverable, { status: 201 })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const engagement = await prisma.engagement.findUnique({ where: { id } })

  if (!engagement) {
    return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
  }

  const isParticipant = engagement.brandId === session.user.id ||
    engagement.creatorId === (await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id }
    }))?.id

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const deliverables = await prisma.deliverableFile.findMany({
    where: { engagementId: id },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(deliverables)
}