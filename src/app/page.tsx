import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseJsonArray } from '@/types'

async function getFeaturedCreators() {
  const creators = await prisma.creatorProfile.findMany({
    take: 6,
    orderBy: { ratingAvg: 'desc' },
    include: {
      user: { select: { id: true, email: true, emailVerified: true } },
      portfolioItems: { take: 1, orderBy: { createdAt: 'desc' } },
      verificationSignals: { where: { verified: true } }
    }
  })
  return creators.map(c => ({
    ...c,
    skills: parseJsonArray<string>(c.skills),
    specialization: parseJsonArray<string>(c.specialization),
    toolsUsed: parseJsonArray<string>(c.toolsUsed),
    portfolioItems: c.portfolioItems.map(item => ({
      ...item,
      toolsUsed: parseJsonArray<string>(item.toolsUsed),
      skillTags: parseJsonArray<string>(item.skillTags)
    }))
  }))
}

export default async function Home() {
  const session = await getServerSession(authOptions)
  const featuredCreators = await getFeaturedCreators()

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              {session ? (
                <>
                  <Link 
                    href={session.user.role === 'CREATOR' ? '/jobs' : '/briefs'} 
                    className="text-gray-700 hover:text-indigo-600"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    href={session.user.role === 'CREATOR' ? '/jobs' : '/creators'} 
                    className="text-gray-700 hover:text-indigo-600"
                  >
                    {session.user.role === 'CREATOR' ? 'Find Work' : 'Hire a Creator'}
                  </Link>
                  <a href="/api/auth/signout" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Sign Out</a>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-gray-700 hover:text-indigo-600">Sign In</Link>
                  <Link href="/signup" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <section className="relative bg-gradient-to-b from-indigo-600 via-indigo-700 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Hire the World&apos;s Best <span className="text-yellow-300">AI Creators</span>
            </h1>
            <p className="text-xl sm:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Discover AI filmmakers, animators, and generative artists. Post briefs, review portfolios, and collaborate on cutting-edge content.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup?role=BRAND" className="bg-yellow-300 text-indigo-900 px-8 py-3 rounded-lg font-semibold hover:bg-yellow-400 transition text-lg">
                I'm a Brand - Post a Brief
              </Link>
              <Link href="/signup?role=CREATOR" className="border-2 border-yellow-300 text-yellow-300 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-800 transition text-lg">
                I'm a Creator - Join Now
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      <section className="py-16" style={{ backgroundColor: '#F5F7FF' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">
              <span style={{ color: '#111827' }}>Featured</span>
              <span style={{ color: '#4F46E5' }}> AI Creators</span>
            </h2>
            <div className="w-16 h-1 bg-yellow-300 mx-auto mt-3 rounded" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCreators.map((creator) => (
              <Link key={creator.id} href={`/creators/${creator.id}`} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                {creator.portfolioItems[0] && (
                  <img src={creator.portfolioItems[0].mediaUrl} alt={creator.portfolioItems[0].title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{creator.displayName}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{creator.bio}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {creator.specialization.slice(0, 3).map((spec) => (
                      <span key={spec} className="px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded">{spec}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-3 text-sm text-gray-600">
                    <span className="flex items-center gap-1">★ {creator.ratingAvg}</span>
                    <span>({creator.ratingCount} reviews)</span>
                    {creator.verificationSignals.length > 0 && (
                      <span className="text-green-600 flex items-center gap-1">✓ Verified</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            {session ? (
              <Link 
                href={session.user.role === 'CREATOR' ? '/jobs' : '/creators'} 
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                {session.user.role === 'CREATOR' ? 'View All Jobs →' : 'View All Creators →'}
              </Link>
            ) : (
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Sign in to view all
              </Link>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">1</div>
              <h3 className="text-xl font-semibold mb-2">Post a Brief</h3>
              <p className="text-gray-600">Define your project requirements, style, format, and commercial terms. Use AI-assist to structure your brief.</p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">2</div>
              <h3 className="text-xl font-semibold mb-2">Discover Creators</h3>
              <p className="text-gray-600">Filter by skills, tools, specialization, and content type. View rich portfolios with workflow details.</p>
            </div>
            <div className="bg-white p-6 rounded-xl text-center">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">3</div>
              <h3 className="text-xl font-semibold mb-2">Collaborate & Deliver</h3>
              <p className="text-gray-600">Accept bids, manage engagements, share encrypted files, and leave reviews to build reputation.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>AI Creator Marketplace - Built for the Hackathon</p>
        </div>
      </footer>
    </div>
  )
}