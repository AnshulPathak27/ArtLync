import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import JobsClient from './JobsClient'

const JOB_TYPES = ['Social Ad', 'Explainer Video', 'Brand Film', 'Product Demo', 'Music Video', 'Educational Content', 'Game Cinematic', 'VFX Shot']
const LOCATIONS = ['Remote', 'New York', 'Los Angeles', 'London', 'San Francisco', 'Tokyo', 'Berlin', 'Paris', 'Sydney', 'Toronto']
const CONTENT_TYPES = ['video', 'animation', 'graphic', 'other']

async function getBriefs(filters: {
  contentType?: string[]
  jobType?: string[]
  location?: string[]
  search?: string
  sortBy?: string
}) {
  const { contentType, jobType, location, search, sortBy = 'newest' } = filters

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

  return briefs
}

export default async function JobsPage({
  searchParams
}: {
  searchParams: Promise<{
    contentType?: string
    jobType?: string
    location?: string
    search?: string
    sortBy?: string
  }>
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CREATOR') {
    redirect('/')
  }

  const params = await searchParams
  const filters = {
    contentType: params.contentType?.split(',').filter(Boolean) || [],
    jobType: params.jobType?.split(',').filter(Boolean) || [],
    location: params.location?.split(',').filter(Boolean) || [],
    search: params.search || '',
    sortBy: params.sortBy || 'newest'
  }

  const briefs = await getBriefs(filters)

  return <JobsClient initialBriefs={briefs} initialFilters={filters} />
}