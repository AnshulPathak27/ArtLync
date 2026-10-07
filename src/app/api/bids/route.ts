import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const bidSchema = z.object({
  briefId: z.string(),
  proposedRate: z.number().positive(),
  timeline: z.string().min(1),
  message: z.string().optional()
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
  const validated = bidSchema.parse(body)

  const brief = await prisma.brief.findUnique({
    where: { id: validated.briefId }
  })

  if (!brief || brief.status !== 'OPEN') {
    return NextResponse.json({ error: 'Brief not open for bids' }, { status: 400 })
  }

  const existingBid = await prisma.bid.findUnique({
    where: {
      briefId_creatorId: {
        briefId: validated.briefId,
        creatorId: creatorProfile.id
      }
    }
  })

  if (existingBid) {
    return NextResponse.json({ error: 'Already bid on this brief' }, { status: 400 })
  }

  const bid = await prisma.bid.create({
    data: {
      ...validated,
      creatorId: creatorProfile.id
    },
    include: {
      creator: {
        include: { user: { select: { id: true, email: true } } }
      }
    }
  })

  return NextResponse.json(bid, { status: 201 })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const myBids = searchParams.get('my') === 'true'

  const where: any = {}
  if (myBids) {
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: session.user.id }
    })
    if (creatorProfile) where.creatorId = creatorProfile.id
  }

  const bids = await prisma.bid.findMany({
    where,
    include: {
      brief: {
        include: {
          brand: {
            include: { user: { select: { id: true, email: true } } }
          }
        }
      },
      creator: {
        include: { user: { select: { id: true, email: true } } }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(bids)
}