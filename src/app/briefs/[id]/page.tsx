import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'
import { BidModal } from './BidModal'
import { BidAction } from './BidAction'
import { BidsSection } from './BidsSection'

interface Props {
  params: Promise<{ id: string }>
}

async function getBrief(id: string) {
  const brief = await prisma.brief.findUnique({
    where: { id },
    include: {
      brand: {
        include: {
          user: { select: { id: true, email: true } }
        }
      },
      bids: {
        include: {
          creator: {
            include: {
              user: { select: { id: true, email: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      engagement: {
        include: {
          creator: {
            include: { user: { select: { id: true, email: true } } }
          }
        }
      }
    }
  })
  return brief
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const brief = await getBrief(id)
  if (!brief) return { title: 'Brief Not Found' }
  return { title: `${brief.title} | AI Creator Marketplace` }
}

function BidCard({ bid, briefStatus, isOwner, shortlistedIds, setShortlistedIds }: { bid: any; briefStatus: string; isOwner: boolean; shortlistedIds: Set<string>; setShortlistedIds: (ids: Set<string>) => void }) {
  if (!isOwner) return null

  const creatorScore = (bid.creator.ratingAvg || 0) * 2
  const isShortlisted = shortlistedIds.has(bid.id)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
<div>
            <Link href={`/creators/${bid.creator.id}`} className="font-semibold text-lg text-gray-900 hover:text-indigo-600">
              {bid.creator.displayName}
            </Link>
            <p className="text-sm text-gray-700 mt-1">★ {bid.creator.ratingAvg} ({bid.creator.ratingCount} reviews)</p>
            <p className="text-sm text-gray-700 mt-1">Creator Score: {creatorScore.toFixed(1)} / 10</p>
          </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${bid.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : bid.status === 'REJECTED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {bid.status}
          </span>
          <button
            onClick={() => {
              const next = new Set(shortlistedIds)
              if (next.has(bid.id)) {
                next.delete(bid.id)
              } else {
                next.add(bid.id)
              }
              setShortlistedIds(next)
            }}
            className={`p-2 rounded-full transition-colors ${shortlistedIds.has(bid.id) ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'}`}
            aria-label={shortlistedIds.has(bid.id) ? 'Remove from shortlist' : 'Add to shortlist'}
            title={shortlistedIds.has(bid.id) ? 'Remove from shortlist' : 'Add to shortlist'}
          >
            <svg className="w-5 h-5" fill={shortlistedIds.has(bid.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.3.922-1.603.922-1.902 0l-1.519-4.674a1 1 0 00-.95-.69H4.797a1 1 0 01-.95-.69L.575 8.77a1 1 0 01.363-1.118l1.519-4.674z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-700">Proposed Rate:</span>
          <span className="font-medium ml-1">${bid.proposedRate.toLocaleString()}</span>
        </div>
        <div>
          <span className="text-gray-700">Timeline:</span>
          <span className="font-medium ml-1">{bid.timeline}</span>
        </div>
        <div>
          <span className="text-gray-700">Bid Date:</span>
          <span className="font-medium ml-1">{new Date(bid.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      {bid.message && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700">{bid.message}</p>
        </div>
      )}

      {briefStatus === 'OPEN' && bid.status === 'PENDING' && (
        <div className="flex gap-3">
          <form action={`/api/bids/${bid.id}`} method="POST">
            <input type="hidden" name="status" value="ACCEPTED" />
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition">
              Accept Bid
            </button>
          </form>
          <form action={`/api/bids/${bid.id}`} method="POST">
            <input type="hidden" name="status" value="REJECTED" />
            <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition">
              Reject
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default async function BriefDetailPage({ params }: Props) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  const brief = await getBrief(id)

  if (!brief) notFound()

  const isOwner = session?.user?.id === brief.brand.userId

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/briefs" className="text-gray-700 hover:text-indigo-600">← Back to Briefs</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{brief.title}</h1>
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mt-2 ${brief.status === 'OPEN' ? 'bg-green-100 text-green-800' : brief.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : brief.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {brief.status}
                </span>
              </div>
              {isOwner && brief.status === 'OPEN' && (
                <Link href="/briefs/new" className="text-indigo-600 hover:underline text-sm">Edit Brief</Link>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-700">Content Type:</span> <span className="font-medium ml-1 capitalize">{brief.contentType}</span></div>
              <div><span className="text-gray-700">Style:</span> <span className="font-medium ml-1">{brief.style}</span></div>
              <div><span className="text-gray-700">Format:</span> <span className="font-medium ml-1">{brief.formatAspectRatio}</span></div>
              <div><span className="text-gray-700">Bids:</span> <span className="font-medium ml-1">{brief.bids.length}</span></div>
              {brief.jobType && <div><span className="text-gray-700">Job Type:</span> <span className="font-medium ml-1">{brief.jobType}</span></div>}
              {brief.location && <div><span className="text-gray-700">Location:</span> <span className="font-medium ml-1">{brief.location}</span></div>}
              {brief.budget && <div><span className="text-gray-700">Budget:</span> <span className="font-medium ml-1">${brief.budget.toLocaleString()}</span></div>}
              <div><span className="text-gray-700">Posted:</span> <span className="font-medium ml-1">{new Date(brief.createdAt).toLocaleDateString()}</span></div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Campaign Requirements</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{brief.campaignRequirements}</p>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Commercial Use Requirements</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{brief.commercialUseRequirements}</p>
          </div>

          {isOwner && (
            <BidsSection brief={brief} isOwner={isOwner} session={session} />
          )}

          {brief.engagement && (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <Link href={`/creators/${brief.engagement.creator.id}`} className="font-semibold text-gray-900 hover:text-indigo-600">
                      {brief.engagement.creator.displayName}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">Working on this project</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${brief.engagement.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : brief.engagement.status === 'DELIVERED' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                    {brief.engagement.status}
                  </span>
                </div>
                <div className="mt-4 text-sm text-gray-700">
                  <p>Started: {new Date(brief.engagement.startedAt).toLocaleDateString()}</p>
                  {brief.engagement.completedAt && <p>Completed: {new Date(brief.engagement.completedAt).toLocaleDateString()}</p>}
                </div>
                <Link href={`/engagements/${brief.engagement.id}`} className="mt-4 inline-block text-indigo-600 hover:underline font-medium">
                  View Engagement Details →
                </Link>
              </div>
            </div>
          )}

          {!isOwner && brief.status === 'OPEN' && session?.user?.role === 'CREATOR' && (
            <BidAction brief={brief} session={session} />
          )}
        </div>
      </div>
    </div>
  )
}