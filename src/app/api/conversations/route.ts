import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const where: any = {}
  if (session.user.role === 'CREATOR') {
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id }
    })
    if (creatorProfile) where.creatorId = creatorProfile.id
  } else {
    where.brandUserId = session.user.id
  }

  const conversations = await prisma.conversation.findMany({
    where,
    include: {
      brief: { select: { id: true, title: true } },
      creator: {
        include: { user: { select: { id: true, email: true } } }
      },
      brandUser: { select: { id: true, email: true } },
      messages: { take: 1, orderBy: { createdAt: 'desc' } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(conversations)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { briefId, creatorId, engagementId } = await request.json()

  if (!briefId && !engagementId) {
    return NextResponse.json({ error: 'briefId or engagementId required' }, { status: 400 })
  }

  let conversation

  if (engagementId) {
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId },
      include: { brief: true }
    })
    if (!engagement) return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })

    conversation = await prisma.conversation.findUnique({
      where: { engagementId }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          engagementId,
          briefId: engagement.briefId,
          creatorId: engagement.creatorId,
          brandUserId: session.user.id
        }
      })
    }
  } else {
    conversation = await prisma.conversation.findUnique({
      where: { briefId }
    })

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          briefId,
          creatorId: creatorId!,
          brandUserId: session.user.id
        }
      })
    }
  }

  return NextResponse.json(conversation)
}