'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Bid {
  id: string
  briefId: string
  creatorId: string
  proposedRate: number
  timeline: string
  message: string | null
  status: string
  createdAt: string
  brief: {
    id: string
    title: string
    contentType: string
    style: string
    formatAspectRatio: string
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
}

function MyBidsContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [bids, setBids] = useState<Bid[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user?.role !== 'CREATOR') {
      router.push('/')
      return
    }
    fetchBids()
  }, [session, router])

  const fetchBids = async () => {
    try {
      const res = await fetch('/api/bids?my=true')
      const data = await res.json()
      setBids(data)
    } catch {
      console.error('Failed to fetch bids')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
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
              <Link href="/jobs" className="text-indigo-600 font-medium">Browse Jobs</Link>
              <a href="/api/auth/signout" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Sign Out</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My Bids ({bids.length})</h1>

        {bids.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bids submitted yet</h3>
            <p className="text-gray-600 mb-4">Start browsing jobs and submit your first bid!</p>
            <Link href="/jobs" className="text-indigo-600 hover:underline font-medium">Browse Jobs</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => (
              <Link key={bid.id} href={`/briefs/${bid.briefId}`} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{bid.brief.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(bid.status)}`}>{bid.status}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-1">{bid.brief.brand.companyName || 'Unknown Brand'}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                      <span>{bid.brief.contentType} • {bid.brief.style} • {bid.brief.formatAspectRatio}</span>
                      {bid.brief.budget && <span>• ${bid.brief.budget.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <div className="text-right">
                      <p className="font-semibold">${bid.proposedRate.toLocaleString()}</p>
                      <p className="text-gray-600">Your rate</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{bid.timeline}</p>
                      <p className="text-gray-600">Timeline</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{new Date(bid.createdAt).toLocaleDateString()}</p>
                      <p className="text-gray-600">Submitted</p>
                    </div>
                  </div>
                </div>
                {bid.message && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{bid.message}</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function MyBidsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MyBidsContent />
    </Suspense>
  )
}