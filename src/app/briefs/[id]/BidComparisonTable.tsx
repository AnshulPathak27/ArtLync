'use client'

import React from 'react'
import { getBidderDisplayValue, getBidderDetailValue } from './compareBidders'

interface BidComparisonTableProps {
  compareData: ReturnType<typeof import('./compareBidders').compareBidders>
  selectedBidId: string | null
  onSelectBid: (bidId: string | null) => void
}

export function BidComparisonTable({ compareData, selectedBidId, onSelectBid }: BidComparisonTableProps) {
  if (!compareData) return null

  const { bids, strongest, categoryKeys } = compareData

  return (
    <div className="p-6 overflow-x-auto">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-white z-10">
              Category
            </th>
            {bids.map((item: any) => {
              const isSelected = selectedBidId === item.bid.id
              return (
                <th key={item.bid.id} className={`px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-white sticky bg-white z-10 ${isSelected ? 'bg-indigo-50' : ''}`}>
                  <div className="flex flex-col items-center gap-2 mb-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      {item.details.portfolio?.[0] && (
                        <img
                          src={item.details.portfolio[0].mediaUrl}
                          alt={item.creator.displayName}
                          className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                        />
                      )}
                      <span className="font-medium truncate max-w-[120px]">{item.creator.displayName}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-sm">
                      <span className="text-yellow-600 font-bold">{((item.creator.ratingAvg || 0) * 2).toFixed(1)}</span>
                      <span className="text-gray-600">/ 10</span>
                    </div>
                    <div className="text-xs text-gray-600">★ {item.creator.ratingAvg || 0} ({item.creator.ratingCount || 0} reviews)</div>
                    <button
                      onClick={() => onSelectBid(isSelected ? null : item.bid.id)}
                      className={`mt-2 px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
                      }`}
                      aria-label={isSelected ? `Deselect ${item.creator.displayName}` : `Select ${item.creator.displayName}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {isSelected ? 'Selected' : 'Select'}
                    </button>
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categoryKeys.map((categoryKey, categoryIndex) => {
            const categoryLabel = compareData.categories[categoryIndex]
            return (
              <tr key={categoryKey} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm font-medium text-gray-700 sticky left-0 bg-white z-10">{categoryLabel}</td>
                {bids.map((item: any) => {
                  const score = item.scores[categoryKey] || 0
                  const isBest = strongest[categoryKey]?.creatorId === item.bid.id
                  const isSelected = selectedBidId === item.bid.id
                  return (
                    <td key={item.bid.id} className={`px-4 py-4 text-center ${isBest ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-gray-700'} ${isSelected ? 'ring-2 ring-indigo-200' : ''}`}>
                      <span className={isBest ? 'inline-flex items-center justify-center gap-1' : ''}>
                        {isBest && (
                          <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {getBidderDisplayValue(categoryKey, score, item.details)}
                      </span>
                      <div className="text-xs text-gray-600 mt-1 max-w-xs mx-auto truncate" title={getBidderDetailValue(categoryKey, item.details)}>
                        {getBidderDetailValue(categoryKey, item.details)}
                      </div>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}