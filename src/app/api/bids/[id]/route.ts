import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateBidSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED'])
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'BRAND') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const validated = updateBidSchema.parse(body)

  const bid = await prisma.bid.findUnique({
    where: { id },
    include: { brief: { include: { brand: true } } }
  })

  if (!bid) {
    return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
  }

  if (bid.brief.brand.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (bid.brief.status !== 'OPEN') {
    return NextResponse.json({ error: 'Brief no longer open' }, { status: 400 })
  }

  const updatedBid = await prisma.bid.update({
    where: { id },
    data: { status: validated.status }
  })

  if (validated.status === 'ACCEPTED') {
    await prisma.brief.update({
      where: { id: bid.briefId },
      data: { status: 'IN_PROGRESS' }
    })

    await prisma.engagement.create({
      data: {
        briefId: bid.briefId,
        creatorId: bid.creatorId,
        brandId: session.user.id,
        status: 'IN_PROGRESS'
      }
    })

    await prisma.conversation.create({
      data: {
        briefId: bid.briefId,
        creatorId: bid.creatorId,
        brandUserId: session.user.id
      }
    })

    await prisma.bid.updateMany({
      where: {
        briefId: bid.briefId,
        id: { not: id }
      },
      data: { status: 'REJECTED' }
    })
  }

  return NextResponse.json(updatedBid)
}