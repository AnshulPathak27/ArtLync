'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [portfolioItems, setPortfolioItems] = useState<any[]>([])
  const [verificationSignals, setVerificationSignals] = useState<any[]>([])
  const [socialLinks, setSocialLinks] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'profile' | 'portfolio' | 'verification' | 'social'>('profile')
  const [error, setError] = useState('')
  const [showPortfolioForm, setShowPortfolioForm] = useState(false)
  const [showVerificationForm, setShowVerificationForm] = useState(false)
  const [showSocialForm, setShowSocialForm] = useState(false)

  useEffect(() => {
    if (session?.user?.role !== 'CREATOR') {
      router.push('/')
      return
    }
    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      const [profileRes, portfolioRes, signalsRes, socialRes] = await Promise.all([
        fetch('/api/creators/me'),
        fetch('/api/portfolio'),
        fetch('/api/verification'),
        fetch('/api/social')
      ])
      
      if (profileRes.ok) {
        const data = await profileRes.json()
        setProfile({
          ...data,
          skills: JSON.parse(data.skills || '[]'),
          specialization: JSON.parse(data.specialization || '[]'),
          toolsUsed: JSON.parse(data.toolsUsed || '[]'),
          jobTypePreferences: JSON.parse(data.jobTypePreferences || '[]')
        })
      }
      if (portfolioRes.ok) setPortfolioItems(await portfolioRes.json())
      if (signalsRes.ok) setVerificationSignals(await signalsRes.json())
      if (socialRes.ok) setSocialLinks(await socialRes.json())
    } catch (e) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!profile) return <div className="min-h-screen flex items-center justify-center">Profile not found</div>

  const handleProfileUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      displayName: formData.get('displayName'),
      bio: formData.get('bio'),
      skills: formData.getAll('skills').filter(Boolean),
      specialization: formData.getAll('specialization').filter(Boolean),
      toolsUsed: formData.getAll('toolsUsed').filter(Boolean),
      location: formData.get('location'),
      jobTypePreferences: formData.getAll('jobTypePreferences').filter(Boolean)
    }

    try {
      const res = await fetch('/api/creators/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const updated = await res.json()
        setProfile(updated)
        update()
      } else {
        setError('Failed to update profile')
      }
    } catch {
      setError('An error occurred')
    }
  }

  const handlePortfolioAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      title: formData.get('title'),
      mediaUrl: formData.get('mediaUrl'),
      mediaType: formData.get('mediaType'),
      toolsUsed: formData.getAll('toolsUsed').filter(Boolean),
      skillTags: formData.getAll('skillTags').filter(Boolean),
      workflowNote: formData.get('workflowNote')
    }

    try {
      const res = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const item = await res.json()
        setPortfolioItems([item, ...portfolioItems])
        e.currentTarget.reset()
      }
    } catch {
      setError('Failed to add portfolio item')
    }
  }

  const handlePortfolioDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/portfolio/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPortfolioItems(portfolioItems.filter(item => item.id !== id))
      }
    } catch {
      setError('Failed to delete portfolio item')
    }
  }

  const handleVerificationAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      type: formData.get('type'),
      label: formData.get('label'),
      verified: false,
      evidenceNote: formData.get('evidenceNote')
    }

    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const signal = await res.json()
        setVerificationSignals([...verificationSignals, signal])
        e.currentTarget.reset()
      }
    } catch {
      setError('Failed to add verification signal')
    }
  }

  const handleSocialAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const data = {
      platform: formData.get('platform'),
      url: formData.get('url')
    }

    try {
      const res = await fetch('/api/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (res.ok) {
        const link = await res.json()
        setSocialLinks([...socialLinks, link])
        e.currentTarget.reset()
      }
    } catch {
      setError('Failed to add social link')
    }
  }

  const handleSocialDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/social/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setSocialLinks(socialLinks.filter(link => link.id !== id))
      }
    } catch {
      setError('Failed to delete social link')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/creators" className="text-gray-700 hover:text-indigo-600">Browse Creators</Link>
              <Link href="/jobs" className="text-gray-700 hover:text-indigo-600">Browse Jobs</Link>
              <a href="/api/auth/signout" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Sign Out</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Creator Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your profile, portfolio, and verification signals</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">{error}</div>}

        <div className="border-b border-gray-200 mb-6">
          <nav className="flex gap-8" aria-label="Dashboard tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'profile' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-700 hover:text-gray-900'}`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'portfolio' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-700 hover:text-gray-900'}`}
            >
              Portfolio ({portfolioItems.length})
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'verification' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-700 hover:text-gray-900'}`}
            >
              Verification ({verificationSignals.filter(s => s.verified).length} verified)
            </button>
            <button
              onClick={() => setActiveTab('social')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'social' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-700 hover:text-gray-900'}`}
            >
              Social Links ({socialLinks.length})
            </button>
          </nav>
        </div>

        {activeTab === 'profile' && (
          <form onSubmit={handleProfileUpdate} className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            <h2 className="text-lg font-semibold">Profile Information</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
              <input name="displayName" defaultValue={profile.displayName} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              <textarea name="bio" defaultValue={profile.bio || ''} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input name="location" defaultValue={profile.location || ''} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="e.g., Remote, New York, London" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm flex items-center gap-1">
                    {skill}
                    <input type="hidden" name="skills" value={skill} />
                    <button type="button" onClick={() => {}} className="text-gray-600 hover:text-red-500">×</button>
                  </span>
                ))}
              </div>
              <input type="text" placeholder="Add skill (press Enter)" className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specializations</label>
              <div className="flex flex-wrap gap-2">
                {profile.specialization.map((spec: string) => (
                  <span key={spec} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm flex items-center gap-1">
                    {spec}
                    <input type="hidden" name="specialization" value={spec} />
                  </span>
                ))}
              </div>
              <input type="text" placeholder="Add specialization" className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tools & Models</label>
              <div className="flex flex-wrap gap-2">
                {profile.toolsUsed.map((tool: string) => (
                  <span key={tool} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                    {tool}
                    <input type="hidden" name="toolsUsed" value={tool} />
                  </span>
                ))}
              </div>
              <input type="text" placeholder="Add tool" className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Job Types</label>
              <div className="flex flex-wrap gap-2">
                {profile.jobTypePreferences.map((jt: string) => (
                  <span key={jt} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm flex items-center gap-1">
                    {jt}
                    <input type="hidden" name="jobTypePreferences" value={jt} />
                  </span>
                ))}
              </div>
              <input type="text" placeholder="Add job type" className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700">Save Profile</button>
          </form>
        )}

        {activeTab === 'portfolio' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Portfolio Items</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" onClick={() => setShowPortfolioForm(true)}>Add Item</button>
            </div>
            {portfolioItems.length === 0 ? (
              <p className="text-gray-600">No portfolio items yet. Add your first project!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <img src={item.mediaUrl} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-2" />
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.mediaType}</p>
                    <button onClick={() => handlePortfolioDelete(item.id)} className="text-red-600 hover:underline text-sm mt-2">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'verification' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Verification Signals</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" onClick={() => setShowVerificationForm(true)}>Add Signal</button>
            </div>
            {verificationSignals.length === 0 ? (
              <p className="text-gray-600">No verification signals yet.</p>
            ) : (
              <div className="space-y-3">
                {verificationSignals.map((signal) => (
                  <div key={signal.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <span className={`font-medium ${signal.verified ? 'text-green-700' : 'text-gray-700'}`}>
                        {signal.verified ? '✓ ' : ''}{signal.label}
                      </span>
                      <p className="text-sm text-gray-600">Type: {signal.type}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded ${signal.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                      {signal.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'social' && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Social Links</h2>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700" onClick={() => setShowSocialForm(true)}>Add Link</button>
            </div>
            {socialLinks.length === 0 ? (
              <p className="text-gray-600">No social links yet.</p>
            ) : (
              <div className="space-y-3">
                {socialLinks.map((link) => (
                  <div key={link.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline">
                      <span className="text-xl">{link.platform === 'INSTAGRAM' ? '📷' : link.platform === 'YOUTUBE' ? '▶️' : link.platform === 'LINKEDIN' ? '💼' : link.platform === 'BEHANCE' ? '🎨' : link.platform === 'VIMEO' ? '📹' : link.platform === 'WEBSITE' ? '🌐' : '🔗'}</span>
                      <span>{link.platform}</span>
                    </a>
                    <button onClick={() => handleSocialDelete(link.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}