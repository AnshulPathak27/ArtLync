import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const socialLinkSchema = z.object({
  platform: z.enum(['INSTAGRAM', 'YOUTUBE', 'BEHANCE', 'LINKEDIN', 'VIMEO', 'WEBSITE', 'OTHER']),
  url: z.string().url()
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
  const validated = socialLinkSchema.parse(body)

  const link = await prisma.socialLink.create({
    data: {
      ...validated,
      creatorId: creatorProfile.id
    }
  })

  return NextResponse.json(link, { status: 201 })
}

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

  const links = await prisma.socialLink.findMany({
    where: { creatorId: creatorProfile.id }
  })

  return NextResponse.json(links)
}