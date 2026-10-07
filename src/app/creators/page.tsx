'use client'

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { compareCreators } from './compareCreators'
import { ComparisonView } from './ComparisonView'

const ALL_SKILLS = ['AI Video Generation', 'AI Animation', 'AI Image Generation', 'Prompt Engineering', 'Video Editing', 'Motion Graphics', '3D Animation', 'Character Design', 'Storyboarding', 'Sound Design', 'Color Grading', 'Compositing']
const ALL_SPECIALIZATIONS = ['AI Filmmaking', 'Generative Art', 'AI Animation', 'Music Videos', 'Commercial Ads', 'Social Media Content', 'Explainer Videos', 'Brand Films', 'Product Demos', 'Educational Content', 'Game Cinematics', 'VFX']
const ALL_TOOLS = ['Midjourney', 'Runway Gen-2', 'Runway Gen-3', 'Pika Labs', 'Sora', 'Stable Video Diffusion', 'Kaiber', 'Luma Dream Machine', 'Hailuo', 'Kling', 'Suno', 'Udio', 'ElevenLabs', 'Topaz Video AI', 'DaVinci Resolve', 'After Effects', 'Blender', 'ComfyUI', 'Automatic1111', 'Leonardo.ai']
const ALL_JOB_TYPES = ['Social Ad', 'Explainer Video', 'Brand Film', 'Product Demo', 'Music Video', 'Educational Content', 'Game Cinematic', 'VFX Shot']
const ALL_LOCATIONS = ['Remote', 'New York', 'Los Angeles', 'London', 'San Francisco', 'Tokyo', 'Berlin', 'Paris', 'Sydney', 'Toronto']

interface Creator {
  id: string
  displayName: string
  bio: string | null
  skills: string[]
  specialization: string[]
  toolsUsed: string[]
  location: string | null
  jobTypePreferences: string[]
  ratingAvg: number
  ratingCount: number
  portfolioItems: Array<{ id: string; title: string; mediaUrl: string; mediaType: string; toolsUsed: string[]; skillTags: string[]; workflowNote: string | null }>
  verificationSignals: Array<{ id: string; type: string; label: string; verified: boolean }>
  socialLinks: Array<{ id: string; platform: string; url: string }>
  user: { id: string; email: string; emailVerified: boolean }
}

interface CreatorsResponse {
  creators: Creator[]
  pagination: { page: number; limit: number; total: number; totalPages: number }
  hasResults: boolean
}

function CreatorsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [creators, setCreators] = useState<Creator[]>([])
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 0 })
  const [hasResults, setHasResults] = useState(true)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    skills: [] as string[],
    specialization: [] as string[],
    tools: [] as string[],
    jobType: [] as string[],
    location: [] as string[],
    search: '',
    sortBy: 'rating' as 'rating' | 'newest' | 'name'
  })
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(0)
  const [shortlistedIds, setShortlistedIds] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)

  // Load shortlist from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('creatorShortlist')
      if (saved) {
        setShortlistedIds(new Set(JSON.parse(saved)))
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  // Save shortlist to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('creatorShortlist', JSON.stringify(Array.from(shortlistedIds)))
    } catch {
      // Ignore save errors
    }
  }, [shortlistedIds])

  const toggleShortlist = (creatorId: string) => {
    setShortlistedIds(prev => {
      const next = new Set(prev)
      if (next.has(creatorId)) {
        next.delete(creatorId)
      } else {
        next.add(creatorId)
      }
      return next
    })
  }

  const isShortlisted = (creatorId: string) => shortlistedIds.has(creatorId)

  // Get shortlisted creators
  const shortlistedCreators = useMemo(() => 
    creators.filter(c => shortlistedIds.has(c.id)), 
    [creators, shortlistedIds]
  )

  // Comparison logic (imported from utility)
  const comparisonResult = useMemo(() => 
    compareCreators(shortlistedCreators), 
    [shortlistedCreators]
  )

  const fetchCreators = useCallback(async (page = 1) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.skills.length) params.set('skills', filters.skills.join(','))
    if (filters.specialization.length) params.set('specialization', filters.specialization.join(','))
    if (filters.tools.length) params.set('tools', filters.tools.join(','))
    if (filters.jobType.length) params.set('jobType', filters.jobType.join(','))
    if (filters.location.length) params.set('location', filters.location.join(','))
    if (filters.search) params.set('search', filters.search)
    params.set('page', page.toString())
    params.set('limit', '12')
    params.set('sortBy', filters.sortBy)

    try {
      const res = await fetch(`/api/creators?${params.toString()}`)
      const data: CreatorsResponse = await res.json()
      setCreators(data.creators)
      setPagination(data.pagination)
      setHasResults(data.hasResults)
      setCurrentCreatorIndex(0)
    } catch (error) {
      console.error('Failed to fetch creators:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    const initialFilters = {
      skills: searchParams.get('skills')?.split(',').filter(Boolean) || [],
      specialization: searchParams.get('specialization')?.split(',').filter(Boolean) || [],
      tools: searchParams.get('tools')?.split(',').filter(Boolean) || [],
      jobType: searchParams.get('jobType')?.split(',').filter(Boolean) || [],
      location: searchParams.get('location')?.split(',').filter(Boolean) || [],
      search: searchParams.get('search') || '',
      sortBy: (searchParams.get('sortBy') as 'rating' | 'newest' | 'name') || 'rating'
    }
    setFilters(initialFilters)
    fetchCreators(1)
  }, [])

  useEffect(() => {
    fetchCreators(pagination.page)
  }, [fetchCreators, pagination.page])

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
    setCurrentCreatorIndex(0)
  }

  const toggleFilter = (category: keyof typeof filters, value: string) => {
    if (category === 'search' || category === 'sortBy') return
    const arr = filters[category] as string[]
    setFilters(prev => ({
      ...prev,
      [category]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      skills: [],
      specialization: [],
      tools: [],
      jobType: [],
      location: [],
      search: '',
      sortBy: 'rating'
    })
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const hasActiveFilters = filters.skills.length + filters.specialization.length + filters.tools.length + filters.jobType.length + filters.location.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/creators" className="text-indigo-600 font-medium">Browse Creators</Link>
              <Link href="/briefs/new" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Post a Brief</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Filters</h2>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-sm text-indigo-600 hover:underline">Clear all</button>
                )}
              </div>

              <div className="space-y-6">
                <FilterSection
                  title="Search"
                  items={[]}
                  selected={[]}
                  onToggle={() => {}}
                  customInput={
                    <input
                      type="text"
                      placeholder="Search creators..."
                      value={filters.search}
                      onChange={(e) => updateFilters({ search: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  }
                />

                <FilterSection
                  title="Skills"
                  items={ALL_SKILLS}
                  selected={filters.skills}
                  onToggle={(v) => toggleFilter('skills', v)}
                />

                <FilterSection
                  title="Specialization"
                  items={ALL_SPECIALIZATIONS}
                  selected={filters.specialization}
                  onToggle={(v) => toggleFilter('specialization', v)}
                />

                <FilterSection
                  title="Tools"
                  items={ALL_TOOLS}
                  selected={filters.tools}
                  onToggle={(v) => toggleFilter('tools', v)}
                />

                <FilterSection
                  title="Job Type"
                  items={ALL_JOB_TYPES}
                  selected={filters.jobType}
                  onToggle={(v) => toggleFilter('jobType', v)}
                />

                <FilterSection
                  title="Location"
                  items={ALL_LOCATIONS}
                  selected={filters.location}
                  onToggle={(v) => toggleFilter('location', v)}
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => updateFilters({ sortBy: e.target.value as 'rating' | 'newest' | 'name' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="rating">Rating (High to Low)</option>
                    <option value="newest">Newest First</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">Creators ({pagination.total})</h1>
              <div className="flex items-center gap-4">
                {hasActiveFilters && (
                  <span className="text-sm text-gray-600">
                    {filters.skills.length} skills, {filters.specialization.length} specializations, {filters.tools.length} tools
                  </span>
                )}
                {shortlistedIds.size > 0 && (
                  <span 
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium border ${
                      shortlistedIds.size >= 2 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-100 cursor-pointer hover:bg-indigo-100' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}
                    onClick={() => shortlistedIds.size >= 2 && setShowComparison(true)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                    <span>Shortlisted · {shortlistedIds.size}</span>
                    {shortlistedIds.size >= 2 && (
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 002 2v-2a2 2 0 012-2h2a2 2 0 012 2v6M16 19v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 002-2V5a2 2 0 012-2h2a2 2 0 002 2v-2a2 2 0 012-2h2a2 2 0 012 2v6M16 19h6a2 2 0 002-2v-6a2 2 0 00-2-2h-2a2 2 0 00-2-2V5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 012 2v6" /></svg>
                    )}
                  </span>
                )}
              </div>
            </div>

            {!hasResults && !loading && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">No creators match these filters</h3>
                <p className="text-yellow-700 mb-4">Try removing some filters to see more results</p>
                <button onClick={clearFilters} className="text-indigo-600 hover:underline font-medium">Clear all filters</button>
              </div>
            )}

            {loading ? (
              <div className="animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-2xl mb-6" />
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-4" />
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ) : (
              creators.length > 0 && (
                <>
                  <div className="relative">
                    {/* Left navigation arrow - vertically centered on the profile */}
                    <button
                      onClick={() => setCurrentCreatorIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentCreatorIndex === 0}
                      className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 p-2 rounded-full bg-white/90 border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/90 transition-all duration-200 shadow-lg"
                      aria-label="Previous creator"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>

                    {/* Right navigation arrow - vertically centered on the profile */}
                    <button
                      onClick={() => setCurrentCreatorIndex(prev => Math.min(creators.length - 1, prev + 1))}
                      disabled={currentCreatorIndex === creators.length - 1}
                      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 p-2 rounded-full bg-white/90 border border-gray-200 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white/90 transition-all duration-200 shadow-lg"
                      aria-label="Next creator"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>

                    {/* Progress indicator near the top */}
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-sm text-white/90">
                      <span className="font-medium">{currentCreatorIndex + 1} of {creators.length}</span>
                      <span className="w-16 h-1 bg-white/30 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white transition-all duration-300"
                          style={{ width: `${((currentCreatorIndex + 1) / creators.length) * 100}%` }}
                        />
                      </span>
                    </div>

                    <Link
                      href={`/creators/${creators[currentCreatorIndex].id}`}
                      className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-200"
                    >
                      <div className="aspect-video relative overflow-hidden">
                        {creators[currentCreatorIndex].portfolioItems[0] && (
                          <img
                            src={creators[currentCreatorIndex].portfolioItems[0].mediaUrl}
                            alt={creators[currentCreatorIndex].portfolioItems[0].title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />
                        )}
                        {/* Shortlist/Bookmark Button - top right of image */}
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleShortlist(creators[currentCreatorIndex].id)
                          }}
                          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 backdrop-blur-sm border border-white/30 text-gray-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all duration-200 shadow-lg"
                          aria-label={isShortlisted(creators[currentCreatorIndex].id) ? 'Remove from shortlist' : 'Add to shortlist'}
                        >
                          {isShortlisted(creators[currentCreatorIndex].id) ? (
                            <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                          )}
                        </button>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h2 className="text-3xl font-bold text-white mb-2">{creators[currentCreatorIndex].displayName}</h2>
                          
                          {/* Creator Score - visually separate from review rating */}
                          <div className="mb-3 p-3 bg-white/15 backdrop-blur-sm rounded-xl border border-white/20">
                            <div className="flex items-baseline gap-2">
                              <span className="text-white/80 text-sm font-medium">Creator Score</span>
                              <span className="text-2xl font-bold text-yellow-300">{(creators[currentCreatorIndex].ratingAvg * 2).toFixed(1)}</span>
                              <span className="text-white/70 text-lg">/ 10</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-white/90 text-sm">
                            <span className="flex items-center gap-1">★ {creators[currentCreatorIndex].ratingAvg}</span>
                            <span>({creators[currentCreatorIndex].ratingCount} reviews)</span>
                            {creators[currentCreatorIndex].verificationSignals.length > 0 && (
                              <span className="flex items-center gap-1 bg-green-500/90 px-2 py-1 rounded-full text-xs">✓ Verified</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">About</h3>
                            <p className="text-gray-700 leading-relaxed">{creators[currentCreatorIndex].bio || 'No bio available'}</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Location</h3>
                            <p className="text-gray-700">{creators[currentCreatorIndex].location || 'Remote'}</p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Specializations</h3>
                            <div className="flex flex-wrap gap-2">
                              {creators[currentCreatorIndex].specialization.map((spec) => (
                                <span key={spec} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">{spec}</span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Skills</h3>
                            <div className="flex flex-wrap gap-2">
                              {creators[currentCreatorIndex].skills.map((skill) => (
                                <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{skill}</span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-2">Tools & Models</h3>
                            <div className="flex flex-wrap gap-2">
                              {creators[currentCreatorIndex].toolsUsed.map((tool) => (
                                <span key={tool} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{tool}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {creators[currentCreatorIndex].portfolioItems.length > 1 && (
                          <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Portfolio</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                              {creators[currentCreatorIndex].portfolioItems.slice(1).map((item) => (
                                <Link key={item.id} href={`/creators/${creators[currentCreatorIndex].id}`} className="group relative aspect-square rounded-xl overflow-hidden">
                                  <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                                    <span className="text-white text-sm font-medium truncate block">{item.title}</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}

                        {creators[currentCreatorIndex].verificationSignals.length > 0 && (
                          <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Verification</h3>
                            <div className="flex flex-wrap gap-2">
                              {creators[currentCreatorIndex].verificationSignals.map((signal) => (
                                <span key={signal.id} className={`px-3 py-1 rounded-full text-sm font-medium ${signal.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                                  {signal.verified ? '✓ ' : ''}{signal.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                </>
              )
            )}

            {!loading && pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => { setPagination(prev => ({ ...prev, page: prev.page - 1 })); setCurrentCreatorIndex(0); }}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous Page
                </button>
                <span className="flex items-center px-4 text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => { setPagination(prev => ({ ...prev, page: prev.page + 1 })); setCurrentCreatorIndex(0); }}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next Page
                </button>
              </div>
            )}

            {/* Comparison View */}
            {showComparison && shortlistedCreators.length >= 2 && (
              <ComparisonView
                compareCreators={comparisonResult}
                onClose={() => setShowComparison(false)}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function CreatorsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CreatorsContent />
    </Suspense>
  )
}

function FilterSection({ title, items, selected, onToggle, customInput }: {
  title: string
  items: string[]
  selected: string[]
  onToggle: (value: string) => void
  customInput?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(true)
  const displayItems = expanded ? items : items.slice(0, 5)

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-700">{title}</label>
        {items.length > 5 && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-indigo-600 hover:underline">
            {expanded ? 'Show less' : `Show all (${items.length})`}
          </button>
        )}
      </div>
      {customInput ? (
        customInput
      ) : (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {displayItems.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(item)}
                onChange={() => onToggle(item)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{item}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}