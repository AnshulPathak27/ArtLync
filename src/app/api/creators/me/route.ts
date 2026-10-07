import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseJsonArray } from '@/types'

export async function GET(request: NextRequest) {
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

  return NextResponse.json({
    ...creatorProfile,
    skills: parseJsonArray(creatorProfile.skills),
    specialization: parseJsonArray(creatorProfile.specialization),
    toolsUsed: parseJsonArray(creatorProfile.toolsUsed),
    jobTypePreferences: parseJsonArray(creatorProfile.jobTypePreferences)
  })
}