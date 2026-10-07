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

  const brief = await prisma.brief.findUnique({
    where: { id },
    include: {
      brand: {
        include: {
          user: { select: { id: true, email: true } }
        }
      },
      bids: {
        include: {
          creator: {
            include: {
              user: { select: { id: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      engagement: {
        include: {
          creator: {
            include: { user: { select: { id: true, email: true } } }
          }
        }
      }
    }
  })

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  // Authorization: brand can access own brief; creator can access if they bid or are engaged
  const isBrandOwner = brief.brand.userId === session.user.id
  const creatorProfile = session.user.role === 'CREATOR' 
    ? await prisma.creatorProfile.findUnique({ where: { userId: session.user.id } })
    : null
  const isBidder = creatorProfile && brief.bids.some(b => b.creatorId === creatorProfile.id)
  const isEngaged = creatorProfile && brief.engagement && brief.engagement.creatorId === creatorProfile.id

  if (!isBrandOwner && !isBidder && !isEngaged) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(brief)
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
  const brief = await prisma.brief.findUnique({
    where: { id },
    include: { brand: true }
  })

  if (!brief) {
    return NextResponse.json({ error: 'Brief not found' }, { status: 404 })
  }

  if (brief.brand.userId !== session.user.id && session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status, ...data } = body

  const updated = await prisma.brief.update({
    where: { id },
    data: { ...data, ...(status && { status }) }
  })

  return NextResponse.json(updated)
}