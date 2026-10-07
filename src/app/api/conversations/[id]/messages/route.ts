import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const messageSchema = z.object({
  ciphertext: z.string().min(1),
  iv: z.string().min(1)
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const conversation = await prisma.conversation.findUnique({ where: { id } })

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const isParticipant = conversation.brandUserId === session.user.id ||
    conversation.creatorId === (await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id }
    }))?.id

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = parseInt(searchParams.get('limit') || '50')

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 })
  })

  let nextCursor: string | undefined
  if (messages.length > limit) {
    const next = messages.pop()
    nextCursor = next!.id
  }

  return NextResponse.json({ messages: messages.reverse(), nextCursor })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const conversation = await prisma.conversation.findUnique({ where: { id } })

  if (!conversation) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
  }

  const isParticipant = conversation.brandUserId === session.user.id ||
    conversation.creatorId === (await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id }
    }))?.id

  if (!isParticipant) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const validated = messageSchema.parse(body)

  const message = await prisma.message.create({
    data: {
      conversationId: id,
      senderId: session.user.id,
      ciphertext: validated.ciphertext,
      iv: validated.iv
    }
  })

  return NextResponse.json(message, { status: 201 })
}