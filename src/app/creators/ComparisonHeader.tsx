'use client'

import Link from 'next/link'

interface ComparisonHeaderProps {
  compareCreators: any
  onClose: () => void
}

export function ComparisonHeader({ compareCreators, onClose }: ComparisonHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10 rounded-t-2xl">
      <div className="flex items-center gap-4">
        <Link
          href="/creators"
          onClick={(e) => { e.preventDefault(); onClose(); }}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span className="hidden sm:inline">Back to creators</span>
        </Link>
        <div className="hidden sm:block w-px h-8 bg-gray-200" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Compare Creators</h2>
          <p className="text-gray-600 text-sm mt-0.5">{compareCreators?.creators.length} creators selected</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Close comparison"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  )
}