'use client'

interface BidBestMatchCardProps {
  compareData: ReturnType<typeof import('./compareBidders').compareBidders>
}

export function BidBestMatchCard({ compareData }: BidBestMatchCardProps) {
  if (!compareData?.bestMatch) return null

  const { bestMatch, bestMatchDetails, reasons } = compareData

  return (
    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-white to-yellow-50 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-yellow-100 rounded-full opacity-50 blur-3xl" />
      </div>

      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25 flex-shrink-0">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.062-.382-3.016z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L2 9.27l6.91-1.01L12 2z" /></svg>
              Best Match
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
              {bestMatchDetails.ratingAvg ? ((bestMatchDetails.ratingAvg * 2).toFixed(1) + ' / 10') : 'Not rated'}
            </span>
            {bestMatchDetails.proposedRate && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                $${bestMatchDetails.proposedRate.toLocaleString()}
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{bestMatch.creator?.displayName || bestMatch.creator?.displayName}</h3>
          <p className="text-gray-600 text-sm">
            {reasons.length > 0
              ? reasons.join(', ') + '.'
              : 'Best overall match based on weighted scoring.'}
          </p>
        </div>
      </div>
    </div>
  )
}