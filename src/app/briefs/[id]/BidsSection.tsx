'use client'

import React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { BidComparisonView } from './BidComparisonView'

interface BidsSectionProps {
  brief: any
  isOwner: boolean
  session: any
}

function BidCard({ bid, briefStatus, shortlistedIds, setShortlistedIds }: { bid: any; briefStatus: string; shortlistedIds: Set<string>; setShortlistedIds: (ids: Set<string>) => void }) {
  if (!bid) return null

  const creatorScore = (bid.creator?.ratingAvg || 0) * 2
  const isShortlisted = shortlistedIds.has(bid.id)

  return React.createElement(
    'div',
    { className: 'bg-white border border-gray-200 rounded-xl p-6' },
    React.createElement(
      'div',
      { className: 'flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4' },
      React.createElement(
        'div',
        null,
        bid.creator && React.createElement(
          Link,
          { href: `/creators/${bid.creator.id}`, className: 'font-semibold text-lg text-gray-900 hover:text-indigo-600' },
          bid.creator.displayName
        ),
        bid.creator && React.createElement(
          'p',
          { className: 'text-sm text-gray-600 mt-1' },
          '★ ',
          bid.creator.ratingAvg,
          ' (',
          bid.creator.ratingCount,
          ' reviews)'
        ),
        React.createElement(
          'p',
          { className: 'text-sm text-gray-600 mt-1' },
          'Creator Score: ',
          creatorScore,
          ' / 10'
        )
      ),
      React.createElement(
        'div',
        { className: 'flex items-center gap-2' },
        bid.status && React.createElement(
          'span',
          {
            className: `px-3 py-1 rounded-full text-sm font-medium ${
              bid.status === 'ACCEPTED'
                ? 'bg-green-100 text-green-800'
                : bid.status === 'REJECTED'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`,
          },
          bid.status
        ),
        React.createElement(
          'button',
          {
            onClick: () => {
              const next = new Set(shortlistedIds)
              if (next.has(bid.id)) {
                next.delete(bid.id)
              } else {
                next.add(bid.id)
              }
              setShortlistedIds(next)
            },
            className: `p-2 rounded-full transition-colors ${
              isShortlisted
                ? 'bg-yellow-100 text-yellow-600'
                : 'bg-gray-100 text-gray-600 hover:bg-yellow-50 hover:text-yellow-600'
            }`,
            'aria-label': isShortlisted ? 'Remove from shortlist' : 'Add to shortlist',
            title: isShortlisted ? 'Remove from shortlist' : 'Add to shortlist',
          },
          React.createElement(
            'svg',
            {
              className: 'w-5 h-5',
              fill: isShortlisted ? 'currentColor' : 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24',
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              strokeWidth: 2,
            },
            React.createElement('path', {
              d: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.54 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976-2.888c-.3.922-1.603.922-1.902 0l-1.519-4.674z',
            })
          )
        )
      )
    ),
    React.createElement(
        'div',
        { className: 'grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 text-sm' },
        React.createElement(
          'div',
          null,
          React.createElement('span', { className: 'text-gray-700' }, 'Proposed Rate:'),
          React.createElement('span', { className: 'font-medium ml-1' }, bid.proposedRate?.toLocaleString?.() || 'N/A')
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'text-gray-700' }, 'Timeline:'),
          React.createElement('span', { className: 'font-medium ml-1' }, bid.timeline || 'N/A')
        ),
        React.createElement('div', null,
          React.createElement('span', { className: 'text-gray-700' }, 'Bid Date:'),
          React.createElement('span', { className: 'font-medium ml-1' }, bid.createdAt ? new Date(bid.createdAt).toLocaleDateString() : 'N/A')
        )
      ),

    bid.message &&
      React.createElement(
        'div',
        { className: 'bg-gray-50 p-4 rounded-lg mb-4' },
        React.createElement('p', { className: 'text-sm text-gray-700' }, bid.message)
      ),

    briefStatus === 'OPEN' &&
      bid.status === 'PENDING' &&
      React.createElement(
        'div',
        { className: 'flex gap-3' },
        React.createElement(
          'form',
          { action: `/api/bids/${bid.id}`, method: 'POST' },
          React.createElement('input', { type: 'hidden', name: 'status', value: 'ACCEPTED' }),
          React.createElement(
            'button',
            {
              type: 'submit',
              className: 'bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition',
            },
            'Accept Bid'
          )
        ),
        React.createElement(
          'form',
          { action: `/api/bids/${bid.id}`, method: 'POST' },
          React.createElement('input', { type: 'hidden', name: 'status', value: 'REJECTED' }),
          React.createElement(
            'button',
            {
              type: 'submit',
              className: 'bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition',
            },
            'Reject'
          )
        )
      )
  )
}

export function BidsSection({
  brief,
  isOwner,
  session,
}: {
  brief: any
  isOwner: boolean
  session: any
}) {
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)

  if (!isOwner) return null

  const shortlistedBids = brief.bids?.filter((bid: any) => shortlistedIds.has(bid.id)) || []
  const canCompare = shortlistedBids.length >= 2

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'p-6 border-b border-gray-200' },
      React.createElement(
        'div',
        { className: 'flex items-center justify-between mb-4' },
        React.createElement('h2', { className: 'text-lg font-semibold text-gray-900' }, 'Creator Bids (', brief.bids?.length || 0, ')'),
        shortlistedIds.size > 0 &&
          React.createElement(
            'span',
            {
              className: `flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100 ${canCompare ? 'cursor-pointer hover:bg-indigo-100' : ''}`,
              onClick: canCompare ? () => setShowComparison(true) : undefined,
            },
            React.createElement(
              'svg',
              { className: 'w-4 h-4', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2 },
              React.createElement('path', { d: 'M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z' })
            ),
            React.createElement('span', null, 'Shortlisted · ', shortlistedIds.size)
          )
      ),
      !brief.bids?.length
        ? React.createElement(
            'div',
            { className: 'text-center py-8' },
            React.createElement('p', { className: 'text-gray-700 text-lg mb-2' }, 'No bids yet'),
            React.createElement('p', { className: 'text-gray-600 text-sm' }, 'Share your brief to attract creators to submit proposals.')
          )
        : React.createElement(
            'div',
            { className: 'space-y-4' },
            brief.bids.map((bid: any) =>
              React.createElement(BidCard, {
                key: bid.id,
                bid: bid,
                briefStatus: brief.status || '',
                shortlistedIds: shortlistedIds,
                setShortlistedIds: setShortlistedIds,
              })
            )
          )
    ),
    showComparison && React.createElement(BidComparisonView, {
      brief: brief,
      shortlistedBids: shortlistedBids,
      onClose: () => setShowComparison(false),
    })
  )
}

export default BidsSection