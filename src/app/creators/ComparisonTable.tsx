'use client'

import React from 'react'
import { compareCreators, compareCreators as compareCreatorsUtil } from './compareCreators'

interface ComparisonTableProps {
  compareCreators: ReturnType<typeof compareCreatorsUtil>
  selectedCreatorId: string | null
  onSelectCreator: (creatorId: string) => void
}

export function ComparisonTable({
  compareCreators,
  selectedCreatorId,
  onSelectCreator,
}: ComparisonTableProps) {
  if (!compareCreators) {
    return null
  }
  const { creators, strongest, categories } = compareCreators

  const categoryKeys = [
    'creatorScore',
    'rating',
    'skills',
    'portfolio',
    'activeProjects',
    'experience',
  ]

  const getDisplayValue = (
    catKey: string,
    score: number,
    creator: any
  ): string => {
    switch (catKey) {
      case 'creatorScore':
        return `${score.toFixed(1)} / 10`

      case 'rating':
        return `★ ${score.toFixed(1)}`

      case 'skills':
        return `${creator.skills?.length || 0} skills`

      case 'portfolio':
        return `${creator.portfolioItems?.length || 0} projects`

      case 'activeProjects':
        return 'N/A'

      case 'experience':
        return `${creator.ratingCount || 0} reviews`

      default:
        return score.toFixed(1)
    }
  }

  return (
    <div className="p-6 overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-white z-10">
              Category
            </th>
            {creators.map((item: any) => (
              <th key={item.creator.id} className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-white sticky left-[33.33%] bg-white z-10">
                <div className="flex flex-col items-center gap-2 mb-2">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {item.creator.portfolioItems?.[0] && (
                      <img
                        src={item.creator.portfolioItems[0].mediaUrl}
                        alt={item.creator.displayName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-100"
                      />
                    )}
                    <span className="font-medium truncate max-w-[120px]">{item.creator.displayName}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <span className="text-yellow-600 font-bold">{(item.creator.ratingAvg || 0) * 2}.toFixed(1)</span>
                    <span className="text-gray-600">/ 10</span>
                  </div>
                  <div className="text-xs text-gray-600">★ {item.creator.ratingAvg || 0} ({item.creator.ratingCount || 0} reviews)</div>
                </div>

                {/* Select Creator button */}
                <button
                  onClick={() => onSelectCreator(item.creator.id)}
                  className={`mt-2 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                    selectedCreatorId === item.creator.id
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200'
                  }`}
                >
                  {selectedCreatorId === item.creator.id ? (
                    <>✓ Selected</>
                  ) : (
                    <>+ Select Creator</>
                  )}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {categories.map((categoryLabel: string, categoryIndex: number) => {
            const categoryKey = categoryKeys[categoryIndex]
            return (
              <tr key={categoryLabel} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm font-medium text-gray-700 sticky left-0 bg-white z-10">{categoryLabel}</td>
                {creators.map((item: any) => {
                  const score = item.scores[categoryKey] || 0
                  const isBest = strongest[categoryKey]?.creatorId === item.creator.id
                  return (
                    <td key={item.creator.id} className={`px-4 py-4 text-center ${isBest ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-gray-700'}`}>
                      <span className={isBest ? 'inline-flex items-center justify-center gap-1' : ''}>
                        {isBest && (
                          <svg className="w-4 h-4 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                        {getDisplayValue(categoryKey, item.scores[categoryKey], item.creator)}
                      </span>
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

export const categoryKeys = [
  'creatorScore',
  'rating',
  'skills',
  'portfolio',
  'activeProjects',
  'experience',
]

export function getDisplayValue(
  catKey: string,
  score: number,
  creator: any
): string {
  switch (catKey) {
    case 'creatorScore':
      return `${score.toFixed(1)} / 10`

    case 'rating':
      return `★ ${score.toFixed(1)}`

    case 'skills':
      return `${creator.skills?.length || 0} skills`

    case 'portfolio':
      return `${creator.portfolioItems?.length || 0} projects`

    case 'activeProjects':
      return 'N/A'

    case 'experience':
      return `${creator.ratingCount || 0} reviews`

    default:
      return score.toFixed(1)
  }
}