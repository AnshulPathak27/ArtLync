import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params
  const link = await prisma.socialLink.findUnique({ where: { id } })

  if (!link || link.creatorId !== creatorProfile.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.socialLink.delete({ where: { id } })

  return NextResponse.json({ success: true })
}