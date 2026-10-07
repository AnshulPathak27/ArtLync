import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const briefSchema = z.object({
  title: z.string().min(1),
  campaignRequirements: z.string().min(1),
  contentType: z.string().min(1),
  style: z.string().min(1),
  formatAspectRatio: z.string().min(1),
  commercialUseRequirements: z.string().min(1),
  jobType: z.string().optional(),
  location: z.string().optional(),
  budget: z.number().optional()
})

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'BRAND') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const brandProfile = await prisma.brandProfile.findUnique({
    where: { userId: session.user.id }
  })

  if (!brandProfile) {
    return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 })
  }

  const body = await request.json()
  const validated = briefSchema.parse(body)

  const brief = await prisma.brief.create({
    data: {
      ...validated,
      brandId: brandProfile.id
    },
    include: {
      brand: {
        include: {
          user: { select: { id: true, email: true } }
        }
      }
    }
  })

  return NextResponse.json(brief, { status: 201 })
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const myBriefs = searchParams.get('my') === 'true'

  const where: any = {}
  if (status) where.status = status
  if (myBriefs) {
    const brandProfile = await prisma.brandProfile.findUnique({
      where: { userId: session.user.id }
    })
    if (brandProfile) where.brandId = brandProfile.id
  }

  const briefs = await prisma.brief.findMany({
    where,
    include: {
      brand: {
        include: {
          user: { select: { id: true, email: true } }
        }
      },
      _count: { select: { bids: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(briefs)
}