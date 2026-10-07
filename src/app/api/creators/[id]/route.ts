import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { parseJsonArray, stringifyJsonArray } from '@/types'

const creatorProfileSchema = z.object({
  displayName: z.string().min(1),
  bio: z.string().optional(),
  skills: z.array(z.string()),
  specialization: z.array(z.string()),
  toolsUsed: z.array(z.string()),
  location: z.string().optional(),
  jobTypePreferences: z.array(z.string())
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const profile = await prisma.creatorProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: { id: true, email: true, role: true, emailVerified: true }
      },
      portfolioItems: {
        orderBy: { createdAt: 'desc' }
      },
      verificationSignals: true,
      socialLinks: true
    }
  })

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...profile,
    skills: parseJsonArray(profile.skills),
    specialization: parseJsonArray(profile.specialization),
    toolsUsed: parseJsonArray(profile.toolsUsed),
    jobTypePreferences: parseJsonArray(profile.jobTypePreferences),
    portfolioItems: profile.portfolioItems.map(item => ({
      ...item,
      toolsUsed: parseJsonArray(item.toolsUsed),
      skillTags: parseJsonArray(item.skillTags)
    })),
    verificationSignals: profile.verificationSignals,
    socialLinks: profile.socialLinks
  })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'CREATOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const profile = await prisma.creatorProfile.findUnique({ where: { id } })

  if (!profile || profile.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const validated = creatorProfileSchema.parse(body)

  const updated = await prisma.creatorProfile.update({
    where: { id },
    data: {
      displayName: validated.displayName,
      bio: validated.bio,
      skills: stringifyJsonArray(validated.skills),
      specialization: stringifyJsonArray(validated.specialization),
      toolsUsed: stringifyJsonArray(validated.toolsUsed),
      location: validated.location,
      jobTypePreferences: stringifyJsonArray(validated.jobTypePreferences)
    }
  })

  return NextResponse.json({
    ...updated,
    skills: parseJsonArray(updated.skills),
    specialization: parseJsonArray(updated.specialization),
    toolsUsed: parseJsonArray(updated.toolsUsed),
    jobTypePreferences: parseJsonArray(updated.jobTypePreferences)
  })
}