'use client'

import { useState } from 'react'
import { compareCreators as compareCreatorsUtil } from './compareCreators'
import { ComparisonTable } from './ComparisonTable'
import { ComparisonHeader } from './ComparisonHeader'
import { BestMatchCard } from './BestMatchCard'

interface ComparisonViewProps {
  compareCreators: ReturnType<typeof compareCreatorsUtil>
  onClose: () => void
}

export function ComparisonView({ compareCreators, onClose }: ComparisonViewProps) {
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null)

  if (!compareCreators || !compareCreators.bestMatch) return null

  const handleSelectCreator = (creatorId: string) => {
    setSelectedCreatorId(selectedCreatorId === creatorId ? null : creatorId)
  }

  const handleClose = () => {
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => onClose()}>
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <ComparisonHeader compareCreators={compareCreators} onClose={onClose} />
        <BestMatchCard compareCreators={compareCreators} />
        <ComparisonTable 
          compareCreators={compareCreators} 
          selectedCreatorId={selectedCreatorId}
          onSelectCreator={handleSelectCreator}
        />
        {selectedCreatorId && (
          <div className="p-4 border-t border-gray-200 bg-green-50 flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-800">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="font-medium">Selected — {compareCreators.creators.find(c => c.creator.id === selectedCreatorId)?.creator?.displayName}</span>
            </div>
            <button
              onClick={() => setSelectedCreatorId(null)}
              className="text-sm text-green-700 hover:underline"
            >
              Clear selection
            </button>
          </div>
        )}
        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Back to creators
          </button>
        </div>
      </div>
    </div>
  )
}