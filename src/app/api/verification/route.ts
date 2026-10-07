import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const verificationSignalSchema = z.object({
  type: z.enum(['TOOL', 'WORKFLOW', 'PAST_WORK']),
  label: z.string().min(1),
  verified: z.boolean().default(false),
  evidenceNote: z.string().optional()
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
  const validated = verificationSignalSchema.parse(body)

  const signal = await prisma.verificationSignal.create({
    data: {
      ...validated,
      creatorId: creatorProfile.id
    }
  })

  return NextResponse.json(signal, { status: 201 })
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

  const signals = await prisma.verificationSignal.findMany({
    where: { creatorId: creatorProfile.id }
  })

  return NextResponse.json(signals)
}