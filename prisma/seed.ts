import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const CREATOR_SKILLS = [
  'AI Video Generation', 'AI Animation', 'AI Image Generation', 'Prompt Engineering',
  'Video Editing', 'Motion Graphics', '3D Animation', 'Character Design',
  'Storyboarding', 'Sound Design', 'Color Grading', 'Compositing'
]

const SPECIALIZATIONS = [
  'AI Filmmaking', 'Generative Art', 'AI Animation', 'Music Videos',
  'Commercial Ads', 'Social Media Content', 'Explainer Videos', 'Brand Films',
  'Product Demos', 'Educational Content', 'Game Cinematics', 'VFX'
]

const TOOLS = [
  'Midjourney', 'Runway Gen-2', 'Runway Gen-3', 'Pika Labs', 'Sora',
  'Stable Video Diffusion', 'Kaiber', 'Luma Dream Machine', 'Hailuo',
  'Kling', 'Suno', 'Udio', 'ElevenLabs', 'Topaz Video AI', 'DaVinci Resolve',
  'After Effects', 'Blender', 'ComfyUI', 'Automatic1111', 'Leonardo.ai'
]

const LOCATIONS = [
  'Remote', 'New York', 'Los Angeles', 'London', 'San Francisco',
  'Tokyo', 'Berlin', 'Paris', 'Sydney', 'Toronto'
]

const JOB_TYPES = [
  'Social Ad', 'Explainer Video', 'Brand Film', 'Product Demo',
  'Music Video', 'Educational Content', 'Game Cinematic', 'VFX Shot'
]

const SOCIAL_PLATFORMS = [
  'INSTAGRAM', 'YOUTUBE', 'BEHANCE', 'LINKEDIN', 'VIMEO', 'WEBSITE', 'OTHER'
]

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomItems<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, count)
}

async function main() {
  console.log('🌱 Starting seed...')

  await prisma.deliverableFile.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.review.deleteMany()
  await prisma.engagement.deleteMany()
  await prisma.bid.deleteMany()
  await prisma.brief.deleteMany()
  await prisma.socialLink.deleteMany()
  await prisma.verificationSignal.deleteMany()
  await prisma.portfolioItem.deleteMany()
  await prisma.creatorProfile.deleteMany()
  await prisma.brandProfile.deleteMany()
  await prisma.user.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 12)

  const creatorUsers = []
  for (let i = 0; i < 12; i++) {
    const user = await prisma.user.create({
      data: {
        email: `creator${i + 1}@example.com`,
        passwordHash,
        role: 'CREATOR',
        emailVerified: true
      }
    })
    creatorUsers.push(user)
  }

  const brandUsers = []
  for (let i = 0; i < 6; i++) {
    const user = await prisma.user.create({
      data: {
        email: `brand${i + 1}@example.com`,
        passwordHash,
        role: 'BRAND',
        emailVerified: true
      }
    })
    brandUsers.push(user)
  }

  const creators = []
  for (let i = 0; i < creatorUsers.length; i++) {
    const user = creatorUsers[i]
    const skills = randomItems(CREATOR_SKILLS, 4 + Math.floor(Math.random() * 4))
    const specialization = randomItems(SPECIALIZATIONS, 2 + Math.floor(Math.random() * 3))
    const tools = randomItems(TOOLS, 3 + Math.floor(Math.random() * 5))
    const jobTypes = randomItems(JOB_TYPES, 2 + Math.floor(Math.random() * 3))
    const location = randomItem(LOCATIONS)

    const creator = await prisma.creatorProfile.create({
      data: {
        userId: user.id,
        displayName: `AI Creator ${i + 1}`,
        bio: `Passionate AI content creator specializing in ${specialization.join(', ').toLowerCase()}. ${5 + Math.floor(Math.random() * 10)} years experience in digital content production.`,
        skills: JSON.stringify(skills),
        specialization: JSON.stringify(specialization),
        toolsUsed: JSON.stringify(tools),
        location,
        jobTypePreferences: JSON.stringify(jobTypes),
        ratingAvg: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        ratingCount: Math.floor(Math.random() * 20) + 1
      }
    })
    creators.push(creator)

    for (let j = 0; j < 3 + Math.floor(Math.random() * 4); j++) {
      const portfolioTools = randomItems(tools, 2 + Math.floor(Math.random() * 3))
      const portfolioSkills = randomItems(skills, 1 + Math.floor(Math.random() * 3))
      await prisma.portfolioItem.create({
        data: {
          creatorId: creator.id,
          title: `${randomItem(specialization)} Project ${j + 1}`,
          mediaUrl: `https://picsum.photos/seed/${creator.id}-${j}/800/600`,
          mediaType: 'IMAGE',
          toolsUsed: JSON.stringify(portfolioTools),
          skillTags: JSON.stringify(portfolioSkills),
          workflowNote: `${randomItem(portfolioTools)} for concept → ${randomItem(TOOLS.filter(t => !portfolioTools.includes(t)))} for animation → DaVinci for color grading`
        }
      })
    }

    if (i < 8) {
      for (let k = 0; k < 2 + Math.floor(Math.random() * 2); k++) {
        await prisma.verificationSignal.create({
          data: {
            creatorId: creator.id,
            type: randomItem(['TOOL', 'WORKFLOW', 'PAST_WORK']),
            label: randomItem([
              'Verified Midjourney Expert', 'Verified Runway Gen-3 User',
              'Verified ComfyUI Workflow', 'Verified Client Project',
              'Verified Commercial Delivery', 'Verified Brand Collaboration'
            ]),
            verified: true,
            evidenceNote: 'Verified via platform assessment and client feedback'
          }
        })
      }
    }

    for (const platform of randomItems(SOCIAL_PLATFORMS, 2 + Math.floor(Math.random() * 3))) {
      await prisma.socialLink.create({
        data: {
          creatorId: creator.id,
          platform,
          url: `https://${platform.toLowerCase()}.com/creator${i + 1}`
        }
      })
    }
  }

  const brands = []
  for (let i = 0; i < brandUsers.length; i++) {
    const user = brandUsers[i]
    const brand = await prisma.brandProfile.create({
      data: {
        userId: user.id,
        companyName: `Brand Co ${i + 1}`,
        companyWebsite: `https://brand${i + 1}.com`,
        verified: i < 4
      }
    })
    brands.push(brand)
  }

  const briefs = []
  const briefStatuses: Array<'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'> = ['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CLOSED']
  
  for (let i = 0; i < 10; i++) {
    const brand = randomItem(brands)
    const status = randomItem(briefStatuses)
    
    const brief = await prisma.brief.create({
      data: {
        brandId: brand.id,
        title: `${randomItem(JOB_TYPES)} for ${brand.companyName}`,
        campaignRequirements: `We need a ${randomItem(JOB_TYPES).toLowerCase()} showcasing our new product line. Target audience: ${randomItem(['Gen Z', 'Millennials', 'Professionals', 'General consumers'])}. Key message: Innovation meets sustainability.`,
        contentType: randomItem(['video', 'animation', 'graphic']),
        style: randomItem(['modern', 'cinematic', 'minimalist', 'anime', '3d', 'vibrant']),
        formatAspectRatio: randomItem(['16:9', '9:16', '1:1', '4:5']),
        commercialUseRequirements: 'Full commercial rights, worldwide, perpetual, exclusive for 12 months',
        jobType: randomItem(JOB_TYPES),
        location: randomItem(LOCATIONS),
        budget: Math.floor(Math.random() * 5000) + 1000,
        status
      }
    })
    briefs.push(brief)
  }

  for (const brief of briefs) {
    if (brief.status !== 'OPEN') continue
    
    const biddingCreators = randomItems(creators, 2 + Math.floor(Math.random() * 4))
    for (const creator of biddingCreators) {
      await prisma.bid.create({
        data: {
          briefId: brief.id,
          creatorId: creator.id,
          proposedRate: Math.floor(Math.random() * 3000) + 1500,
          timeline: `${Math.floor(Math.random() * 4) + 1} weeks`,
          message: `I'd love to work on this! My experience with ${randomItem(JSON.parse(creator.specialization))} makes me a great fit.`,
          status: 'PENDING'
        }
      })
    }
  }

  const inProgressBriefs = briefs.filter(b => b.status === 'IN_PROGRESS' || b.status === 'COMPLETED')
  for (const brief of inProgressBriefs) {
    const acceptedBid = await prisma.bid.findFirst({
      where: { briefId: brief.id, status: 'PENDING' }
    })
    
    if (acceptedBid) {
      await prisma.bid.update({
        where: { id: acceptedBid.id },
        data: { status: 'ACCEPTED' }
      })

      await prisma.bid.updateMany({
        where: { briefId: brief.id, id: { not: acceptedBid.id } },
        data: { status: 'REJECTED' }
      })

      const engagement = await prisma.engagement.create({
        data: {
          briefId: brief.id,
          creatorId: acceptedBid.creatorId,
          brandId: brief.brandId,
          status: brief.status === 'COMPLETED' ? 'COMPLETED' : 'IN_PROGRESS',
          startedAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000),
          completedAt: brief.status === 'COMPLETED' ? new Date() : null
        }
      })

      await prisma.conversation.create({
        data: {
          briefId: brief.id,
          creatorId: acceptedBid.creatorId,
          brandUserId: brief.brandId,
          engagementId: engagement.id
        }
      })

      if (brief.status === 'COMPLETED') {
        await prisma.review.create({
          data: {
            engagementId: engagement.id,
            creatorId: acceptedBid.creatorId,
            brandUserId: brief.brandId,
            rating: 4 + Math.floor(Math.random() * 2),
            comment: 'Excellent work! Delivered on time and exceeded expectations. Great communication throughout the project.'
          }
        })
      }
    }
  }

  const noMatchBrief = await prisma.brief.create({
    data: {
      brandId: brands[0].id,
      title: 'Rare Specialization Request',
      campaignRequirements: 'Need an expert in underwater basket weaving with AI-generated coral reefs.',
      contentType: 'animation',
      style: 'hyperrealistic',
      formatAspectRatio: '16:9',
      commercialUseRequirements: 'Standard commercial license',
      jobType: 'Brand Film',
      location: 'Antarctica',
      budget: 10000,
      status: 'OPEN'
    }
  })

  console.log('✅ Seed completed!')
  console.log(`Created ${creators.length} creators`)
  console.log(`Created ${brands.length} brands`)
  console.log(`Created ${briefs.length + 1} briefs (including 1 with zero matching creators)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })