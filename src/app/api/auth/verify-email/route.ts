import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const verifySchema = z.object({
  token: z.string().min(1)
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = verifySchema.safeParse(body)

  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const { token } = validated.data

  const user = await prisma.user.findFirst({
    where: { verificationToken: token }
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationToken: null }
  })

  return NextResponse.json({ success: true, message: 'Email verified successfully' })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const verificationToken = randomUUID()

  await prisma.user.update({
    where: { id: user.id },
    data: { verificationToken }
  })

  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`

  return NextResponse.json({
    message: 'Verification email sent (simulated)',
    devVerifyUrl: verifyUrl
  })
}