import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const filterSchema = z.object({
  contentType: z.array(z.string()).optional(),
  jobType: z.array(z.string()).optional(),
  location: z.array(z.string()).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['newest', 'budget', 'title']).default('newest')
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CREATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams.entries())

  const parsed = filterSchema.safeParse({
    contentType: params.contentType ? params.contentType.split(',') : undefined,
    jobType: params.jobType ? params.jobType.split(',') : undefined,
    location: params.location ? params.location.split(',') : undefined,
    search: params.search,
    sortBy: params.sortBy
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid filters' }, { status: 400 })
  }

  const { contentType, jobType, location, search, sortBy } = parsed.data

  const where: any = {
    status: 'OPEN'
  }

  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { campaignRequirements: { contains: search, mode: 'insensitive' } },
      { style: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (contentType?.length) where.contentType = { in: contentType }
  if (jobType?.length) where.jobType = { in: jobType }
  if (location?.length) where.location = { in: location }

  let orderBy: any = { createdAt: 'desc' }
  if (sortBy === 'budget') orderBy = { budget: 'desc' }
  if (sortBy === 'title') orderBy = { title: 'asc' }

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
    orderBy
  })

  return NextResponse.json({ briefs })
}