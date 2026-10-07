'use client'

import React from 'react'
import { useState } from 'react'
import { BidModal } from './BidModal'

interface BidActionProps {
  brief: any
  session: any
}

export function BidAction({ brief, session }: { brief: any; session: any }) {
  const [submittedBid, setSubmittedBid] = useState<any>(null)
  const [showBidModal, setShowBidModal] = useState(false)

  const handleBidSubmitted = (bid: any) => {
    setSubmittedBid(bid)
    setShowBidModal(false)
  }

  const isCreator = session?.user?.role === 'CREATOR'

  if (!isCreator || brief.status !== 'OPEN') {
    return null
  }

  const ApplySection = React.createElement(
    'div',
    { className: 'p-6 bg-indigo-50 border-t border-gray-200' },
    React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-3' }, 'Apply to Brief'),
    React.createElement('p', { className: 'text-gray-600 mb-4' }, 'Submit your proposal to work on this brief.'),
    React.createElement('button', {
      onClick: () => setShowBidModal(true),
      className: 'w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors'
    }, 'Submit Bid')
  )

  const SubmittedBidDisplay = ({ submittedBid, onClear }: { submittedBid: any; onClear: () => void }) => {
    if (!submittedBid) return null

    return React.createElement(
      'div',
      { className: 'mt-6 p-4 border border-green-200 bg-green-50 rounded-xl' },
      React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
        React.createElement('div', { className: 'w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center' },
          React.createElement('svg', { className: 'w-6 h-6 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2 }, React.createElement('path', { d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }))
        ),
        React.createElement('div', null,
          React.createElement('h3', { className: 'font-semibold text-green-800' }, 'Bid Submitted!'),
          React.createElement('p', { className: 'text-green-700 text-sm' }, 'Your bid has been submitted successfully.')
        )
      ),
      React.createElement('div', { className: 'bg-gray-50 rounded-xl p-4 mt-4' },
        React.createElement('h4', { className: 'font-semibold text-gray-900 mb-2' }, 'Submitted Bid Details'),
        React.createElement('div', { className: 'space-y-1 text-sm text-gray-600' },
          React.createElement('p', null, React.createElement('strong', null, 'Proposed Rate: '), '$', submittedBid.proposedRate.toLocaleString()),
          React.createElement('p', null, React.createElement('strong', null, 'Timeline: '), submittedBid.timeline),
          submittedBid.message && React.createElement('p', null, React.createElement('strong', null, 'Message: '), submittedBid.message)
        ),
        React.createElement('button', {
          onClick: () => setSubmittedBid(null),
          className: 'mt-4 w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors'
        }, 'Done')
      )
    )
  }

  return React.createElement(
    React.Fragment,
    null,
    React.createElement('div', { className: 'p-6 bg-indigo-50 border-t border-gray-200' },
      React.createElement('h2', { className: 'text-lg font-semibold text-gray-900 mb-3' }, 'Apply to Brief'),
      React.createElement('p', { className: 'text-gray-600 mb-4' }, 'Submit your proposal to work on this brief.'),
      React.createElement('button', {
        onClick: () => setShowBidModal(true),
        className: 'w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors'
      }, 'Submit Bid')
    ),
    showBidModal && React.createElement(BidModal, {
      brief: brief,
      onClose: () => setShowBidModal(false),
      onBidSubmitted: (bid: any) => {
        setSubmittedBid(bid)
        setShowBidModal(false)
      }
    }),
    submittedBid && React.createElement(
      'div',
      { className: 'mt-6 p-4 border border-green-200 bg-green-50 rounded-xl' },
      React.createElement('div', { className: 'flex items-center gap-3 mb-3' },
        React.createElement('div', { className: 'w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center' },
          React.createElement('svg', { className: 'w-6 h-6 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2 }, React.createElement('path', { d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }))
        ),
        React.createElement('div', null,
          React.createElement('h3', { className: 'font-semibold text-green-800' }, 'Bid Submitted!'),
          React.createElement('p', { className: 'text-green-700 text-sm' }, 'Your bid has been submitted successfully.')
        )
      ),
      React.createElement('div', { className: 'bg-gray-50 rounded-xl p-4 mt-4' },
        React.createElement('h4', { className: 'font-semibold text-gray-900 mb-2' }, 'Submitted Bid Details'),
        React.createElement('div', { className: 'space-y-1 text-sm text-gray-600' },
          React.createElement('p', null, React.createElement('strong', null, 'Proposed Rate: '), '$', submittedBid.proposedRate.toLocaleString()),
          React.createElement('p', null, React.createElement('strong', null, 'Timeline: '), submittedBid.timeline),
          submittedBid.message && React.createElement('p', null, React.createElement('strong', null, 'Message: '), submittedBid.message)
        ),
        React.createElement('button', {
          onClick: () => setSubmittedBid(null),
          className: 'mt-4 w-full bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors'
        }, 'Done')
      )
    )
  )
}