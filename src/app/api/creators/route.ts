import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { parseJsonArray } from '@/types'

const filterSchema = z.object({
  skills: z.array(z.string()).optional(),
  specialization: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  contentType: z.array(z.string()).optional(),
  jobType: z.array(z.string()).optional(),
  location: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(12),
  sortBy: z.enum(['rating', 'newest', 'name']).default('rating')
})

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const params = Object.fromEntries(searchParams.entries())

  const parsed = filterSchema.safeParse({
    skills: params.skills ? params.skills.split(',') : undefined,
    specialization: params.specialization ? params.specialization.split(',') : undefined,
    tools: params.tools ? params.tools.split(',') : undefined,
    contentType: params.contentType ? params.contentType.split(',') : undefined,
    jobType: params.jobType ? params.jobType.split(',') : undefined,
    location: params.location ? params.location.split(',') : undefined,
    search: params.search,
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid filters' }, { status: 400 })
  }

  const { skills, specialization, tools, contentType, jobType, location, search, page, limit, sortBy } = parsed.data

  const where: any = {}

  if (search) {
    where.OR = [
      { displayName: { contains: search, mode: 'insensitive' } },
      { bio: { contains: search, mode: 'insensitive' } }
    ]
  }

  if (skills?.length) where.skills = { contains: skills.join('","') }
  if (specialization?.length) where.specialization = { contains: specialization.join('","') }
  if (tools?.length) where.toolsUsed = { contains: tools.join('","') }
  if (jobType?.length) where.jobTypePreferences = { contains: jobType.join('","') }
  if (location?.length) where.location = { in: location }

  let orderBy: any = { ratingAvg: 'desc' }
  if (sortBy === 'newest') orderBy = { createdAt: 'desc' }
  if (sortBy === 'name') orderBy = { displayName: 'asc' }

  const [creators, total] = await Promise.all([
    prisma.creatorProfile.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, emailVerified: true } },
        portfolioItems: { take: 3, orderBy: { createdAt: 'desc' } },
        verificationSignals: { where: { verified: true } },
        socialLinks: true
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.creatorProfile.count({ where })
  ])

  const formattedCreators = creators.map(c => ({
    ...c,
    skills: parseJsonArray(c.skills),
    specialization: parseJsonArray(c.specialization),
    toolsUsed: parseJsonArray(c.toolsUsed),
    jobTypePreferences: parseJsonArray(c.jobTypePreferences),
    portfolioItems: c.portfolioItems.map(item => ({
      ...item,
      toolsUsed: parseJsonArray(item.toolsUsed),
      skillTags: parseJsonArray(item.skillTags)
    }))
  }))

  return NextResponse.json({
    creators: formattedCreators,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    },
    hasResults: creators.length > 0
  })
}