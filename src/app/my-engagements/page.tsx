'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Engagement {
  id: string
  briefId: string
  creatorId: string
  brandId: string
  status: string
  startedAt: string
  completedAt: string | null
  brief: {
    id: string
    title: string
    campaignRequirements: string
    contentType: string
    style: string
    formatAspectRatio: string
    commercialUseRequirements: string
    jobType: string | null
    location: string | null
    budget: number | null
    status: string
    brand: {
      id: string
      user: { id: string; email: string }
      companyName: string | null
      companyWebsite: string | null
      verified: boolean
    }
  }
  creator: {
    id: string
    displayName: string
    user: { id: string; email: string }
  }
  review?: {
    id: string
    rating: number
    comment: string
    createdAt: string
  }
  deliverableFiles: Array<{ id: string; filename: string; createdAt: string }>
}

function MyEngagementsContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [engagements, setEngagements] = useState<Engagement[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [showReviewModal, setShowReviewModal] = useState<Engagement | null>(null)
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' })
  const [reviewLoading, setReviewLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== 'BRAND') {
      router.push('/')
      return
    }
    fetchEngagements()
  }, [session, router])

  const fetchEngagements = async () => {
    try {
      const res = await fetch('/api/engagements?my=true')
      const data = await res.json()
      setEngagements(data)
    } catch {
      console.error('Failed to fetch engagements')
    } finally {
      setLoading(false)
    }
  }

  const filteredEngagements = engagements.filter(e => 
    activeTab === 'active' ? ['IN_PROGRESS', 'DELIVERED'].includes(e.status) : e.status === 'COMPLETED'
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'DELIVERED': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showReviewModal) return

    setReviewLoading(true)
    try {
      const res = await fetch(`/api/engagements/${showReviewModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: reviewForm })
      })

      if (res.ok) {
        setShowReviewModal(null)
        setReviewForm({ rating: 5, comment: '' })
        fetchEngagements()
      } else {
        const data = await res.json()
        alert(data.error || 'Failed to submit review')
      }
    } catch {
      alert('An error occurred')
    } finally {
      setReviewLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</Link>
              <Link href="/briefs" className="text-indigo-600 font-medium">My Briefs</Link>
              <a href="/api/auth/signout" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Sign Out</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">My Engagements</h1>
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'active' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Active ({engagements.filter(e => ['IN_PROGRESS', 'DELIVERED'].includes(e.status)).length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'completed' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            >
              Completed ({engagements.filter(e => e.status === 'COMPLETED').length})
            </button>
          </div>
        </div>

        {filteredEngagements.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">{activeTab === 'active' ? '🔄' : '✅'}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {activeTab === 'active' ? 'No active engagements' : 'No completed engagements'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'active' 
                ? 'Accept bids on your briefs to start engagements.' 
                : 'Completed engagements will appear here after you leave a review.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEngagements.map((engagement) => (
              <div key={engagement.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                  <div>
                    <Link href={`/briefs/${engagement.briefId}`} className="text-lg font-semibold text-gray-900 hover:text-indigo-600">
                      {engagement.brief.title}
                    </Link>
                    <p className="text-gray-600 text-sm mt-1">Creator: {engagement.creator.displayName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(engagement.status)}`}>
                    {engagement.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mb-4">
                  <div><span className="text-gray-700">Budget:</span> <span className="font-medium ml-1">${engagement.brief.budget?.toLocaleString() || 'N/A'}</span></div>
                  <div><span className="text-gray-700">Started:</span> <span className="font-medium ml-1">{new Date(engagement.startedAt).toLocaleDateString()}</span></div>
                  {engagement.completedAt && (
                    <div><span className="text-gray-700">Completed:</span> <span className="font-medium ml-1">{new Date(engagement.completedAt).toLocaleDateString()}</span></div>
                  )}
                </div>

                {engagement.status === 'DELIVERED' && !engagement.review && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800 mb-3">Creator has delivered work. Please review to complete the engagement.</p>
                    <button
                      onClick={() => setShowReviewModal(engagement)}
                      className="bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700"
                    >
                      Leave Review
                    </button>
                  </div>
                )}

                {engagement.review && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">Review Submitted</span>
                      <span className="text-yellow-600">★ {engagement.review.rating}</span>
                    </div>
                    <p className="text-gray-700">{engagement.review.comment}</p>
                  </div>
                )}

                {engagement.deliverableFiles.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Deliverables:</p>
                    <div className="space-y-2">
                      {engagement.deliverableFiles.map((file) => (
                        <div key={file.id} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                          <span className="text-sm">{file.filename}</span>
                          <span className="text-xs text-gray-600">{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link href={`/engagements/${engagement.id}`} className="text-indigo-600 hover:underline text-sm font-medium">
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}

        {showReviewModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Review: {showReviewModal.brief.title}</h2>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Below Average</option>
                    <option value={1}>1 - Poor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
                  <textarea
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, comment: e.target.value }))}
                    rows={4}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe your experience working with this creator..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowReviewModal(null)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reviewLoading}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {reviewLoading ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyEngagementsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MyEngagementsContent />
    </Suspense>
  )
}