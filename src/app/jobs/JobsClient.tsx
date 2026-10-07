'use client'

import { useState, useEffect, Suspense } from 'react'
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
  createdAt: string | Date
  brand: {
    id: string
    user: { id: string; email: string }
    companyName: string | null
    companyWebsite: string | null
    verified: boolean
  }
  _count: { bids: number }
}

interface JobsClientProps {
  initialBriefs: Brief[]
  initialFilters: {
    contentType: string[]
    jobType: string[]
    location: string[]
    search: string
    sortBy: string
  }
}

function JobsClientContent({ initialBriefs, initialFilters }: JobsClientProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</Link>
              <Link href="/creators" className="text-gray-700 hover:text-indigo-600">Browse Creators</Link>
              <a href="/api/auth/signout" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Sign Out</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">Available Jobs</h1>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-gray-600">Jobs page - {initialBriefs.length} briefs loaded</p>
          <pre className="mt-4 text-sm bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(initialFilters, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default function JobsClient({ initialBriefs, initialFilters }: JobsClientProps) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <JobsClientContent initialBriefs={initialBriefs} initialFilters={initialFilters} />
    </Suspense>
  )
}