import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(1)
})

const engagementUpdateSchema = z.object({
  status: z.enum(['IN_PROGRESS', 'DELIVERED', 'COMPLETED'])
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const myEngagements = searchParams.get('my') === 'true'

  const where: any = {}
  if (myEngagements) {
    if (session.user.role === 'CREATOR') {
      const creatorProfile = await prisma.creatorProfile.findUnique({
        where: { userId: session.user.id }
      })
      if (creatorProfile) where.creatorId = creatorProfile.id
    } else {
      where.brandId = session.user.id
    }
  }

  const engagements = await prisma.engagement.findMany({
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
      },
      review: true,
      deliverableFiles: true
    },
    orderBy: { startedAt: 'desc' }
  })

  return NextResponse.json(engagements)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()

  const engagement = await prisma.engagement.findUnique({
    where: { id },
    include: { brief: { include: { brand: true } } }
  })

  if (!engagement) {
    return NextResponse.json({ error: 'Engagement not found' }, { status: 404 })
  }

  const isBrand = engagement.brandId === session.user.id
  const creatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: session.user.id }
  })
  const isCreator = engagement.creatorId === creatorProfile?.id

  if (!isBrand && !isCreator) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (body.review && isBrand) {
    const validated = reviewSchema.parse(body.review)

    const existingReview = await prisma.review.findUnique({
      where: { engagementId: id }
    })

    if (existingReview) {
      return NextResponse.json({ error: 'Review already exists' }, { status: 400 })
    }

    await prisma.review.create({
      data: {
        engagementId: id,
        creatorId: engagement.creatorId,
        brandUserId: session.user.id,
        rating: validated.rating,
        comment: validated.comment
      }
    })

    const reviews = await prisma.review.findMany({
      where: { creatorId: engagement.creatorId }
    })

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length

    await prisma.creatorProfile.update({
      where: { id: engagement.creatorId },
      data: {
        ratingAvg: avgRating,
        ratingCount: reviews.length
      }
    })

    await prisma.engagement.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })
  }

  if (body.status) {
    const validated = engagementUpdateSchema.parse(body)
    await prisma.engagement.update({
      where: { id },
      data: { status: validated.status }
    })
  }

  const updated = await prisma.engagement.findUnique({
    where: { id },
    include: {
      brief: { include: { brand: { include: { user: { select: { id: true, email: true } } } } } },
      creator: { include: { user: { select: { id: true, email: true } } } },
      review: true,
      deliverableFiles: true
    }
  })

  return NextResponse.json(updated)
}