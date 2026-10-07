'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Brief {
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
  createdAt: string
  brand: {
    id: string
    user: { id: string; email: string }
    companyName: string | null
    companyWebsite: string | null
    verified: boolean
  }
  _count: { bids: number }
}

export default function BriefsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('my')

  useEffect(() => {
    fetchBriefs()
  }, [activeTab])

  const fetchBriefs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeTab === 'my') params.set('my', 'true')
      const res = await fetch(`/api/briefs?${params.toString()}`)
      const data = await res.json()
      setBriefs(data)
    } catch {
      console.error('Failed to fetch briefs')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-green-100 text-green-800'
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800'
      case 'COMPLETED': return 'bg-purple-100 text-purple-800'
      case 'CLOSED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (!session || session.user.role !== 'BRAND') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Only brands can view briefs.</p>
          <Link href="/signup?role=BRAND" className="text-indigo-600 hover:underline">Sign up as a Brand</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/briefs/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">New Brief</Link>
              <Link href="/creators" className="text-gray-700 hover:text-indigo-600">Browse Creators</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Briefs</h1>
          <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'my' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
            >
              My Briefs
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'all' ? 'bg-white text-indigo-600 shadow' : 'text-gray-600 hover:text-gray-900'}`}
            >
              All Briefs
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : briefs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No briefs found</h3>
            <p className="text-gray-600 mb-4">{activeTab === 'my' ? 'You haven\'t created any briefs yet.' : 'No briefs published yet.'}</p>
            <Link href="/briefs/new" className="text-indigo-600 hover:underline font-medium">Create your first brief</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {briefs.map((brief) => (
              <Link key={brief.id} href={`/briefs/${brief.id}`} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{brief.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(brief.status)}`}>{brief.status}</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{brief.campaignRequirements}</p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-700">
                      <span>{brief.contentType} • {brief.style} • {brief.formatAspectRatio}</span>
                      {brief.jobType && <span>• {brief.jobType}</span>}
                      {brief.location && <span>• {brief.location}</span>}
                      {brief.budget && <span>• ${brief.budget.toLocaleString()}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <span className="flex items-center gap-1">💬 {brief._count.bids} bids</span>
                    <span className="text-gray-600">Created {new Date(brief.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}