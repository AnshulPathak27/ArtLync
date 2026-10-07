import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { parseJsonArray } from '@/types'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

async function getCreatorProfile(id: string) {
  const profile = await prisma.creatorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, role: true, emailVerified: true } },
      portfolioItems: { orderBy: { createdAt: 'desc' } },
      verificationSignals: { orderBy: { createdAt: 'desc' } },
      socialLinks: true,
      engagements: {
        where: {
          status: { in: ['IN_PROGRESS', 'DELIVERED'] }
        },
        include: {
          brief: {
            include: {
              brand: {
                include: { user: { select: { id: true, email: true } } }
              }
            }
          },
          creator: {
            include: {
              portfolioItems: { take: 1, orderBy: { createdAt: 'desc' } }
            }
          }
        },
        orderBy: { startedAt: 'desc' }
      }
    }
  })
  return profile
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const profile = await getCreatorProfile(id)
  if (!profile) return { title: 'Creator Not Found' }
  return { title: `${profile.displayName} | AI Creator Marketplace` }
}

function SocialIcon({ platform, url }: { platform: string; url: string }) {
  const icons: Record<string, string> = {
    INSTAGRAM: '📷',
    YOUTUBE: '▶️',
    BEHANCE: '🎨',
    LINKEDIN: '💼',
    VIMEO: '📹',
    WEBSITE: '🌐',
    OTHER: '🔗'
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-xl hover:bg-gray-200 transition" title={platform}>
      {icons[platform] || '🔗'}
    </a>
  )
}

function VerificationBadge({ signal }: { signal: { type: string; label: string; verified: boolean; evidenceNote: string | null } }) {
  return (
    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${signal.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
      {signal.verified && <span className="text-green-600">✓</span>}
      <span>{signal.label}</span>
      {!signal.verified && <span className="text-gray-600">(unverified)</span>}
    </div>
  )
}

export default async function CreatorProfilePage({ params }: Props) {
  const { id } = await params
  const profile = await getCreatorProfile(id)

  if (!profile) notFound()

  const skills = parseJsonArray<string>(profile.skills)
  const specialization = parseJsonArray<string>(profile.specialization)
  const toolsUsed = parseJsonArray<string>(profile.toolsUsed)
  const jobTypePreferences = parseJsonArray<string>(profile.jobTypePreferences)

  const portfolioItems = profile.portfolioItems.map(item => ({
    ...item,
    toolsUsed: parseJsonArray<string>(item.toolsUsed),
    skillTags: parseJsonArray<string>(item.skillTags)
  }))

  const activeProjects = profile.engagements || []

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href="/creators" className="text-gray-700 hover:text-indigo-600">← Back to Creators</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {portfolioItems[0] && (
            <img src={portfolioItems[0].mediaUrl} alt={portfolioItems[0].title} className="w-full h-64 sm:h-80 object-cover" />
          )}

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{profile.displayName}</h1>
                <p className="text-gray-600 mt-1">{profile.location || 'Remote'}</p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-yellow-600 font-semibold">
                    <span>★</span> {profile.ratingAvg}
                  </div>
                  <span className="text-gray-600">({profile.ratingCount} reviews)</span>
                  {profile.verificationSignals.some(s => s.verified) && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      ✓ Verified Creator
                    </span>
                  )}
                  {profile.user.emailVerified && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      ✓ Verified Email
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <Link href="/signup?role=BRAND" className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
                  Hire This Creator
                </Link>
              </div>
            </div>

            {profile.bio && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Specializations</h2>
                <div className="flex flex-wrap gap-2">
                  {specialization.map((spec) => (
                    <span key={spec} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm">{spec}</span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{skill}</span>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Tools & Models</h2>
                <div className="flex flex-wrap gap-2">
                  {toolsUsed.map((tool) => (
                    <span key={tool} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{tool}</span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">AI Capabilities</h2>
                <div className="space-y-3">
                  {(() => {
                    const allCapabilities = [
                      ...specialization.map(s => ({ type: 'specialization', label: s })),
                      ...skills.map(s => ({ type: 'skill', label: s })),
                      ...toolsUsed.map(s => ({ type: 'tool', label: s }))
                    ]
                    return allCapabilities.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {allCapabilities.map((cap) => {
                          const hasPortfolioEvidence = portfolioItems.some(item => {
                            const itemTools = item.toolsUsed?.map(t => t.toLowerCase()) || []
                            const itemSkills = item.skillTags?.map(s => s.toLowerCase()) || []
                            const capLower = cap.label.toLowerCase()
                            return itemTools.some(t => t.includes(capLower) || capLower.includes(t)) ||
                                   itemSkills.some(s => s.includes(capLower) || capLower.includes(s))
                          })
                          return (
                            <span key={`${cap.type}-${cap.label}`} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${
                              cap.type === 'specialization' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                              cap.type === 'skill' ? 'bg-gray-50 text-gray-700 border-gray-200' :
                              'bg-purple-50 text-purple-700 border-purple-200'
                            }">
                              {cap.label}
                              {hasPortfolioEvidence && (
                                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                  Portfolio Evidence
                                </span>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-600 text-sm">No AI capabilities listed</p>
                    )
                  })()}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Preferred Job Types</h2>
                <div className="flex flex-wrap gap-2">
                  {jobTypePreferences.map((jt) => (
                    <span key={jt} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">{jt}</span>
                  ))}
                </div>
              </div>
            </div>

            {profile.verificationSignals.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Verification Signals</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.verificationSignals.map((signal) => (
                    <VerificationBadge key={signal.id} signal={signal} />
                  ))}
                </div>
              </div>
            )}

            {profile.socialLinks.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Social Links</h2>
                <div className="flex gap-3">
                  {profile.socialLinks.map((link) => (
                    <SocialIcon key={link.id} platform={link.platform} url={link.url} />
                  ))}
                </div>
              </div>
            )}

            {/* Active Projects Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Projects ({activeProjects.length})</h2>
              {activeProjects.length === 0 ? (
                <p className="text-gray-600">No active projects</p>
              ) : (
                <div className="space-y-4">
                  {activeProjects.map((engagement) => (
                    <Link
                      key={engagement.id}
                      href={`/engagements/${engagement.id}`}
                      className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-indigo-300 transition-all duration-200"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{engagement.brief?.title || 'Untitled Project'}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-600">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                              {engagement.brief?.contentType || 'Project'}
                            </span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">
                              {engagement.brief?.jobType || engagement.brief?.style || 'General'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              engagement.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                              engagement.status === 'DELIVERED' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {engagement.status}
                            </span>
                          </div>
                          {engagement.brief?.brand && (
                            <p className="mt-2 text-sm text-gray-600">
                              Client: <span className="text-gray-700 font-medium">{engagement.brief.brand.companyName || 'Unknown Brand'}</span>
                            </p>
                          )}
                        </div>
                        {engagement.creator?.portfolioItems && engagement.creator.portfolioItems.length > 0 && (
                          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                            <img
                              src={engagement.creator.portfolioItems[0].mediaUrl}
                              alt={engagement.creator.portfolioItems[0].title}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
)}

            {/* Previous Projects Section */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Projects ({portfolioItems.length})</h2>
              {portfolioItems.length === 0 ? (
                <p className="text-gray-600">No previous projects yet</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition">
                      <img src={item.mediaUrl} alt={item.title} className="w-full h-48 object-cover" />
                      <div className="p-4">
                        <h3 className="font-semibold">{item.title}</h3>
                        {item.workflowNote && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.workflowNote}</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {item.toolsUsed.slice(0, 3).map((tool) => (
                            <span key={tool} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">{tool}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
          </div>
        </div>
      </div>
    </div>
  )
}