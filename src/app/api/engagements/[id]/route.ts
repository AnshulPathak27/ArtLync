import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const engagement = await prisma.engagement.findUnique({
    where: { id },
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
      deliverableFiles: { orderBy: { createdAt: 'desc' } }
    }
  })

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

  return NextResponse.json(engagement)
}