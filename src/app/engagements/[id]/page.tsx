import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

async function getEngagement(id: string) {
  const engagement = await prisma.engagement.findUnique({
    where: { id },
    include: {
      brief: {
        include: {
          brand: {
            include: { user: { select: { id: true, email: true } } }
          }
        }
      },
      creator: {
        include: { user: { select: { id: true, email: true } } }
      },
      review: true,
      deliverableFiles: { orderBy: { createdAt: 'desc' } }
    }
  })
  return engagement
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  if (!id) return { title: 'Engagement Not Found' }
  const engagement = await getEngagement(id)
  if (!engagement) return { title: 'Engagement Not Found' }
  return { title: `Engagement: ${engagement.brief.title} | AI Creator Marketplace` }
}

export default async function EngagementDetailPage({ params }: Props) {
  const { id } = await params
  if (!id) notFound()
  const session = await getServerSession(authOptions)
  const engagement = await getEngagement(id)

  if (!engagement) notFound()

  const isCreator = session?.user?.id === engagement.creator.userId
  const isBrand = session?.user?.id === engagement.brandId

  if (!isCreator && !isBrand) notFound()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'DELIVERED': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              {isBrand && <Link href="/my-engagements" className="text-gray-700 hover:text-indigo-600">← Back to Engagements</Link>}
              {isCreator && <Link href="/my-engagements" className="text-gray-700 hover:text-indigo-600">← Back to Engagements</Link>}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <Link href={`/briefs/${engagement.briefId}`} className="text-indigo-600 hover:underline text-sm mb-1 inline-block">
                  Brief: {engagement.brief.title}
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Engagement Details</h1>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(engagement.status)}`}>
                {engagement.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-700">Creator:</span> <span className="font-medium ml-1">{engagement.creator.displayName}</span></div>
              <div><span className="text-gray-700">Brand:</span> <span className="font-medium ml-1">{engagement.brief.brand.companyName || 'Unknown'}</span></div>
              <div><span className="text-gray-700">Started:</span> <span className="font-medium ml-1">{new Date(engagement.startedAt).toLocaleDateString()}</span></div>
              {engagement.completedAt && <div><span className="text-gray-700">Completed:</span> <span className="font-medium ml-1">{new Date(engagement.completedAt).toLocaleDateString()}</span></div>}
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Brief Requirements</h2>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-700">Content Type:</span> <span className="font-medium ml-1 capitalize">{engagement.brief.contentType}</span></div>
              <div><span className="text-gray-700">Style:</span> <span className="font-medium ml-1">{engagement.brief.style}</span></div>
              <div><span className="text-gray-700">Format:</span> <span className="font-medium ml-1">{engagement.brief.formatAspectRatio}</span></div>
              {engagement.brief.jobType && <div><span className="text-gray-700">Job Type:</span> <span className="font-medium ml-1">{engagement.brief.jobType}</span></div>}
              {engagement.brief.location && <div><span className="text-gray-700">Location:</span> <span className="font-medium ml-1">{engagement.brief.location}</span></div>}
              {engagement.brief.budget && <div><span className="text-gray-700">Budget:</span> <span className="font-medium ml-1">${engagement.brief.budget.toLocaleString()}</span></div>}
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Commercial Use Requirements</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{engagement.brief.commercialUseRequirements}</p>
          </div>

          {engagement.status !== 'COMPLETED' && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Actions</h2>
              <div className="flex flex-wrap gap-3">
                {engagement.status === 'IN_PROGRESS' && isCreator && (
                  <form action={`/api/engagements/${engagement.id}`} method="POST">
                    <input type="hidden" name="status" value="DELIVERED" />
                    <button type="submit" className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700">
                      Mark as Delivered
                    </button>
                  </form>
                )}
                {engagement.status === 'DELIVERED' && isBrand && !engagement.review && (
                  <>
                    <Link href={`/engagements/${engagement.id}/deliverables`} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700">
                      View Deliverables
                    </Link>
                    <button
                      onClick={() => { /* review modal would open */ }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700"
                    >
                      Complete & Review
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {engagement.review && (
            <div className="p-6 border-b border-gray-200 bg-green-50">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Review</h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">Rating:</span>
                <span className="text-yellow-600">★ {engagement.review.rating}</span>
              </div>
              <p className="text-gray-700">{engagement.review.comment}</p>
              <p className="text-sm text-gray-600 mt-2">Submitted: {new Date(engagement.review.createdAt).toLocaleDateString()}</p>
            </div>
          )}

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Deliverables ({engagement.deliverableFiles.length})</h2>
            {engagement.deliverableFiles.length === 0 ? (
              <p className="text-gray-600">No deliverables uploaded yet.</p>
            ) : (
              <div className="space-y-3">
                {engagement.deliverableFiles.map((file) => (
                  <div key={file.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">📄</div>
                      <div>
                        <p className="font-medium">{file.filename}</p>
                        <p className="text-sm text-gray-600">Uploaded {new Date(file.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">Encrypted</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4">
              <Link href={`/engagements/${engagement.id}/deliverables`} className="text-indigo-600 hover:underline font-medium">
                View All Deliverables →
              </Link>
            </div>
          </div>

          {engagement.status === 'COMPLETED' && (
            <div className="p-6 bg-green-50 border-t border-green-200">
              <div className="flex items-center gap-2 text-green-800">
                <span className="text-2xl">✓</span>
                <span className="font-semibold text-lg">Engagement Completed</span>
              </div>
              <p className="text-green-700 mt-1">This engagement has been completed and reviewed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}