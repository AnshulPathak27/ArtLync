'use client'

import { useState } from 'react'
import { compareBidders } from './compareBidders'
import { BidComparisonTable } from './BidComparisonTable'
import { BidComparisonHeader } from './BidComparisonHeader'
import { BidBestMatchCard } from './BidBestMatchCard'

interface BidComparisonViewProps {
  brief: any
  shortlistedBids: any[]
  onClose: () => void
}

export function BidComparisonView({ brief, shortlistedBids, onClose }: BidComparisonViewProps) {
  const [compareData, setCompareData] = useState<ReturnType<typeof compareBidders> | null>(null)
  const [selectedBidId, setSelectedBidId] = useState<string | null>(null)

  if (shortlistedBids.length < 2) return null

  if (!compareData) {
    setCompareData(compareBidders(brief, shortlistedBids))
  }

  const selectedBid = compareData?.bids?.find((b: any) => b.bid.id === selectedBidId)

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <BidComparisonHeader compareData={compareData!} onClose={onClose} briefTitle={brief.title} />
        <BidBestMatchCard compareData={compareData!} />
        <BidComparisonTable 
          compareData={compareData!} 
          selectedBidId={selectedBidId}
          onSelectBid={setSelectedBidId}
        />
        {selectedBid && (
          <div className="p-4 border-t border-gray-200 bg-green-50">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800">Selected — {selectedBid.creator?.displayName}</p>
                  <p className="text-sm text-green-700">
                    Proposed: ${selectedBid.details?.proposedRate?.toLocaleString() || 'N/A'} • 
                    Timeline: {selectedBid.details?.timeline || 'N/A'} • 
                    Brief Match: {selectedBid.scores?.briefMatch || 0}%
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBidId(null)}
                className="text-sm text-green-700 hover:underline font-medium"
              >
                Clear selection
              </button>
            </div>
          </div>
        )}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to bidders
          </button>
        </div>
      </div>
    </div>
  )
}