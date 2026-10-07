'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

const CONTENT_TYPES = ['video', 'animation', 'graphic', 'other']
const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:5', '21:9']
const JOB_TYPES = ['Social Ad', 'Explainer Video', 'Brand Film', 'Product Demo', 'Music Video', 'Educational Content', 'Game Cinematic', 'VFX Shot']
const LOCATIONS = ['Remote', 'New York', 'Los Angeles', 'London', 'San Francisco', 'Tokyo', 'Berlin', 'Paris', 'Sydney', 'Toronto']

export default function NewBriefPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    title: '',
    campaignRequirements: '',
    contentType: 'video',
    style: '',
    formatAspectRatio: '16:9',
    commercialUseRequirements: '',
    jobType: '',
    location: '',
    budget: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleAiAssist = async () => {
    if (!formData.campaignRequirements.trim()) {
      setError('Please enter a rough idea first')
      return
    }

    setAiLoading(true)
    setError('')

    try {
      const res = await fetch('/api/ai/brief-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: formData.campaignRequirements })
      })

      const data = await res.json()

      if (res.ok) {
        setFormData(prev => ({
          ...prev,
          contentType: data.contentType || prev.contentType,
          style: data.style || prev.style,
          formatAspectRatio: data.formatAspectRatio || prev.formatAspectRatio,
          commercialUseRequirements: data.commercialUseRequirements || prev.commercialUseRequirements,
          jobType: data.jobType || prev.jobType,
          location: data.location || prev.location
        }))
      }
    } catch {
      setError('AI assist failed. Please fill manually.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: formData.budget ? parseFloat(formData.budget) : undefined
        })
      })

      const data = await res.json()

      if (res.ok) {
        router.push(`/briefs/${data.id}`)
        router.refresh()
      } else {
        setError(data.error || 'Failed to create brief')
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!session || session.user.role !== 'BRAND') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">Only brands can create briefs.</p>
          <Link href="/signup?role=BRAND" className="text-indigo-600 hover:underline">Sign up as a Brand</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/briefs" className="text-gray-700 hover:text-indigo-600">My Briefs</Link>
              <Link href="/creators" className="text-gray-700 hover:text-indigo-600">Browse Creators</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create New Brief</h1>
            <p className="text-gray-600 mt-1">Define your project requirements to attract the right AI creators</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Brief Title *</label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., 30s Product Video for Instagram - Anime Style"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rough Idea / Campaign Requirements *</label>
              <textarea
                name="campaignRequirements"
                required
                rows={4}
                value={formData.campaignRequirements}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Describe your project in your own words... e.g., 'Need a 30s product video, anime style, for Instagram showcasing our new eco-friendly water bottle...'"
              />
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiLoading || !formData.campaignRequirements.trim()}
                className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
              >
                {aiLoading ? '✨ Analyzing...' : '✨ AI Assist - Structure this brief'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">Content Type *</label>
                <select
                  id="contentType"
                  name="contentType"
                  required
                  value={formData.contentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {CONTENT_TYPES.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="style" className="block text-sm font-medium text-gray-700 mb-1">Style *</label>
                <input
                  id="style"
                  name="style"
                  type="text"
                  required
                  value={formData.style}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., anime, cinematic, minimalist, 3d, vibrant"
                />
              </div>

              <div>
                <label htmlFor="formatAspectRatio" className="block text-sm font-medium text-gray-700 mb-1">Format / Aspect Ratio *</label>
                <select
                  id="formatAspectRatio"
                  name="formatAspectRatio"
                  required
                  value={formData.formatAspectRatio}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {ASPECT_RATIOS.map(ratio => (
                    <option key={ratio} value={ratio}>{ratio}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                <select
                  id="jobType"
                  name="jobType"
                  value={formData.jobType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select job type</option>
                  {JOB_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <select
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">Select location</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">Budget (USD)</label>
                <input
                  id="budget"
                  name="budget"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.budget}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="e.g., 5000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Commercial Use Requirements *</label>
              <textarea
                name="commercialUseRequirements"
                required
                rows={3}
                value={formData.commercialUseRequirements}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Full commercial rights, worldwide, perpetual, exclusive for 12 months. Territory: North America. Duration: 2 years."
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Publish Brief'}
              </button>
              <Link href="/briefs" className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold text-center hover:bg-gray-200 transition">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}