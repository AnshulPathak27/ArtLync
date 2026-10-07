'use client'

import React from 'react'
import { useState } from 'react'
import { Bid, BriefWithRelations } from '@/types'
import { BidAction } from './BidAction'

interface BidModalProps {
  brief: BriefWithRelations
  onClose: () => void
  onBidSubmitted?: (bid: any) => void
}

export function BidModal({ brief, onClose, onBidSubmitted }: { brief: BriefWithRelations; onClose: () => void; onBidSubmitted?: (bid: any) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    proposedRate: '',
    timeline: '',
    message: ''
  })
  const [submittedBid, setSubmittedBid] = useState<any>(null)
  const [error, setError] = useState('')

  const openModal = () => {
    setIsOpen(true)
    setFormData({ proposedRate: '', timeline: '', message: '' })
    setError('')
    setSubmittedBid(null)
  }

  const closeModal = () => {
    setIsOpen(false)
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.proposedRate || !formData.timeline) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const bid = {
      id: `bid-${Date.now()}`,
      briefId: brief.id,
      creatorId: 'current-user', // Would come from session in real app
      proposedRate: parseFloat(formData.proposedRate),
      timeline: formData.timeline,
      message: formData.message || undefined,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      creator: {
        id: 'current-user',
        displayName: 'You',
        ratingAvg: 0,
        ratingCount: 0
      }
    }

    setSubmittedBid(bid)
    setIsSubmitting(false)
    setIsOpen(false)

    if (onBidSubmitted) {
      onBidSubmitted(bid)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen && !submittedBid) return null

  return React.createElement(React.Fragment, null,
    isOpen && React.createElement('div', { className: 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4', onClick: closeModal },
      React.createElement('div', { className: 'bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto', onClick: (e: React.MouseEvent) => e.stopPropagation() },
        React.createElement('div', { className: 'flex items-center justify-between p-6 border-b border-gray-200' },
          React.createElement('h2', { className: 'text-xl font-bold text-gray-900' }, 'Submit Bid'),
          React.createElement('button', {
            onClick: closeModal,
            className: 'p-2 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-colors',
            ariaLabel: 'Close'
          },
            React.createElement('svg', { className: 'w-6 h-6', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2 }, React.createElement('path', { d: 'M6 18L18 6M6 6l12 12' }))
          )
        ),

        React.createElement('form', { onSubmit: handleSubmit, className: 'p-6 space-y-4' },
          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Proposed Rate (USD)'),
            React.createElement('input', {
              type: 'number',
              name: 'proposedRate',
              required: true,
              min: '1',
              step: '100',
              value: formData.proposedRate,
              onChange: handleChange,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              placeholder: 'e.g., 5000'
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Timeline'),
            React.createElement('input', {
              type: 'text',
              name: 'timeline',
              required: true,
              value: formData.timeline,
              onChange: handleChange,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              placeholder: 'e.g., 2 weeks'
            })
          ),

          React.createElement('div', null,
            React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Message (optional)'),
            React.createElement('textarea', {
              name: 'message',
              rows: 3,
              value: formData.message,
              onChange: handleChange,
              className: 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500',
              placeholder: 'Why are you a good fit for this project?'
            })
          ),

          error && React.createElement('div', { className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm' }, error),

          React.createElement('div', { className: 'flex gap-3 pt-4' },
            React.createElement('button', {
              type: 'button',
              onClick: closeModal,
              className: 'flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors'
            }, 'Cancel'),
            React.createElement('button', {
              type: 'submit',
              disabled: isSubmitting,
              className: 'flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            }, isSubmitting ? 'Submitting...' : 'Submit Bid')
          )
        )
      )
    ),

    submittedBid && React.createElement('div', { className: 'fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4', onClick: onClose },
      React.createElement('div', { className: 'bg-white rounded-2xl max-w-md w-full p-6 text-center', onClick: (e: React.MouseEvent) => e.stopPropagation() },
        React.createElement('div', { className: 'w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4' },
          React.createElement('svg', { className: 'w-8 h-8 text-green-600', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24', strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2 }, React.createElement('path', { d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' }))
        ),
        React.createElement('h2', { className: 'text-xl font-bold text-gray-900 mb-2' }, 'Bid Submitted!'),
        React.createElement('p', { className: 'text-gray-600 mb-4' }, 'Your bid has been submitted successfully.'),
        React.createElement('div', { className: 'bg-gray-50 rounded-xl p-4 mb-4 text-left text-sm' },
          React.createElement('p', { className: 'font-medium text-gray-900 mb-2' }, 'Submitted Bid Details'),
          React.createElement('p', { className: 'text-gray-600' }, React.createElement('strong', null, 'Rate:'), ' $', formData.proposedRate),
          React.createElement('p', { className: 'text-gray-600' }, React.createElement('strong', null, 'Timeline: '), formData.timeline),
          formData.message && React.createElement('p', { className: 'text-gray-600' }, React.createElement('strong', null, 'Message:'), formData.message)
        ),
        React.createElement('button', {
          onClick: onClose,
          className: 'w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors'
        }, 'Done')
      ),

      React.createElement('button', {
        onClick: () => setIsOpen(true),
        className: 'w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors'
      }, 'Submit Bid')
    )
  )
}

export default BidModal