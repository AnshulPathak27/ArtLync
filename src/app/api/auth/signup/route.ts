import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['CREATOR', 'BRAND']),
  companyName: z.string().optional(),
  companyWebsite: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = signupSchema.safeParse(body)

  if (!validated.success) {
    return NextResponse.json({ error: 'Invalid input', details: validated.error.flatten() }, { status: 400 })
  }

  const { email, password, role, companyName, companyWebsite } = validated.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const verificationToken = randomUUID()

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      emailVerified: false,
      verificationToken
    }
  })

  if (role === 'CREATOR') {
    await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: email.split('@')[0],
        skills: '[]',
        specialization: '[]',
        toolsUsed: '[]',
        jobTypePreferences: '[]'
      }
    })
  } else {
    await prisma.brandProfile.create({
      data: {
        userId: user.id,
        companyName,
        companyWebsite,
        verified: false
      }
    })
  }

  const verifyUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`

  return NextResponse.json({
    id: user.id,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    devVerifyUrl: verifyUrl
  }, { status: 201 })
}