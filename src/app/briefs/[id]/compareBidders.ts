export function compareBidders(brief: any, shortlistedBids: any[]) {
  if (shortlistedBids.length < 2) {
    return null
  }

  const briefSkills = extractSkillsFromText(brief.campaignRequirements + ' ' + brief.commercialUseRequirements)
  const briefTools = extractToolsFromText(brief.campaignRequirements + ' ' + brief.commercialUseRequirements)
  const briefContentType = brief.contentType?.toLowerCase()
  const briefStyle = brief.style?.toLowerCase()
  const briefBudget = brief.budget
  const briefLocation = brief.location?.toLowerCase()
  const hasLocationRequirement = !!brief.location

  const categories = [
    { key: 'briefMatch', label: 'Brief Match', weight: 1.0 },
    { key: 'creatorScore', label: 'Creator Score', weight: 0.8 },
    { key: 'skillsMatch', label: 'Skills Match', weight: 0.9 },
    { key: 'toolsMatch', label: 'Tools Match', weight: 0.7 },
    { key: 'specializationMatch', label: 'Specialization Match', weight: 0.8 },
    { key: 'relevantProjects', label: 'Relevant Previous Work', weight: 0.9 },
    { key: 'budgetMatch', label: 'Budget Match', weight: 0.7 },
    { key: 'timelineMatch', label: 'Timeline Match', weight: 0.6 },
    { key: 'rating', label: 'Review Rating', weight: 0.5 },
    { key: 'locationMatch', label: 'Location Match', weight: hasLocationRequirement ? 0.5 : 0 },
  ].filter(c => c.weight > 0)

  const scored = shortlistedBids.map((bid: any) => {
    const creator = bid.creator || {}
    const creatorSkills = creator.skills || []
    const creatorTools = creator.toolsUsed || []
    const creatorSpecialization = creator.specialization || []
    const creatorLocation = creator.location?.toLowerCase()
    const creatorPortfolio = creator.portfolioItems || []

    const skillsMatch = calculateSkillsMatch(briefSkills, creatorSkills)
    const toolsMatch = calculateToolsMatch(briefTools, creatorTools)
    const specializationMatch = calculateSpecializationMatch(briefContentType, briefStyle, creatorSpecialization, creatorSkills)
    const relevantProjects = calculateRelevantProjects(briefContentType, briefStyle, briefSkills, creatorPortfolio)
    const budgetMatch = calculateBudgetMatch(briefBudget, bid.proposedRate)
    const timelineMatch = calculateTimelineMatch(brief, bid.timeline)
    const locationMatch = hasLocationRequirement ? calculateLocationMatch(briefLocation, creatorLocation) : 0

    const briefMatch = Math.round(
      (skillsMatch * 0.25 +
       toolsMatch * 0.15 +
       specializationMatch * 0.20 +
       relevantProjects * 0.20 +
       budgetMatch * 0.10 +
       timelineMatch * 0.05 +
       locationMatch * 0.05) * 100
    )

    return {
      bid,
      creator,
      scores: {
        briefMatch,
        creatorScore: (creator.ratingAvg || 0) * 2,
        skillsMatch: skillsMatch * 100,
        toolsMatch: toolsMatch * 100,
        specializationMatch: specializationMatch * 100,
        relevantProjects: relevantProjects * 100,
        budgetMatch: budgetMatch * 100,
        timelineMatch: timelineMatch * 100,
        rating: creator.ratingAvg || 0,
        locationMatch: locationMatch * 100,
      },
      details: {
        skills: creatorSkills,
        tools: creatorTools,
        specialization: creatorSpecialization,
        location: creator.location,
        portfolio: creatorPortfolio,
        proposedRate: bid.proposedRate,
        timeline: bid.timeline,
        ratingAvg: creator.ratingAvg,
        ratingCount: creator.ratingCount,
      }
    }
  })

  const strongest: Record<string, { creatorId: string; value: number }> = {}

  categories.forEach((category) => {
    let maxValue = -1
    let strongestCreatorId = ''

    scored.forEach((item: any) => {
      const value = item.scores[category.key]
      if (value > maxValue) {
        maxValue = value
        strongestCreatorId = item.bid.id
      }
    })

    strongest[category.key] = {
      creatorId: strongestCreatorId,
      value: maxValue,
    }
  })

  const totalScored = scored
    .map((item: any) => ({
      ...item,
      totalScore: categories.reduce(
        (sum: number, category) => sum + item.scores[category.key] * category.weight,
        0
      ),
    }))
    .sort((a: any, b: any) => b.totalScore - a.totalScore)

  const bestMatch = totalScored[0]

  const reasons: string[] = []

  categories.forEach((category) => {
    if (strongest[category.key]?.creatorId === bestMatch.bid.id) {
      switch (category.key) {
        case 'briefMatch':
          reasons.push('strongest overall brief match')
          break
        case 'creatorScore':
          reasons.push('higher Creator Score')
          break
        case 'skillsMatch':
          reasons.push('better skills match')
          break
        case 'toolsMatch':
          reasons.push('better tools match')
          break
        case 'specializationMatch':
          reasons.push('better specialization match')
          break
        case 'relevantProjects':
          reasons.push('more relevant previous work')
          break
        case 'budgetMatch':
          reasons.push('proposed rate aligns with budget')
          break
        case 'timelineMatch':
          reasons.push('timeline fits requirements')
          break
        case 'rating':
          reasons.push('higher review rating')
          break
        case 'locationMatch':
          reasons.push('location matches requirement')
          break
      }
    }
  })

  return {
    bids: scored,
    strongest,
    bestMatch: bestMatch.bid,
    bestMatchDetails: bestMatch.details,
    reasons: reasons.length > 0 ? reasons : ['best overall match based on weighted scoring'],
    categories: categories.map((c) => c.label),
    categoryKeys: categories.map((c) => c.key),
    hasLocationRequirement,
  }
}

function extractSkillsFromText(text: string): string[] {
  const skillKeywords = [
    'video', 'editing', 'animation', 'motion graphics', 'design', 'illustration',
    'photography', 'copywriting', 'content writing', 'seo', 'social media',
    'marketing', 'branding', 'ui', 'ux', 'figma', 'photoshop', 'illustrator',
    'after effects', 'premiere', 'davinci', 'blender', 'cinema 4d', 'maya',
    '3d', 'modeling', 'rendering', 'compositing', 'color grading', 'sound design',
    'voiceover', 'scriptwriting', 'storyboarding', 'concept art', 'character design',
    'typography', 'layout', 'print', 'packaging', 'advertising', 'campaign'
  ]
  const lowerText = text.toLowerCase()
  return skillKeywords.filter(skill => lowerText.includes(skill.toLowerCase()))
}

function extractToolsFromText(text: string): string[] {
  const toolKeywords = [
    'figma', 'photoshop', 'illustrator', 'after effects', 'premiere pro', 'davinci resolve',
    'blender', 'cinema 4d', 'maya', 'zbrush', 'substance painter', 'unreal engine',
    'unity', 'sketch', 'adobe xd', 'invision', 'notion', 'trello', 'asana',
    'slack', 'zoom', 'google docs', 'microsoft office', 'excel', 'powerpoint'
  ]
  const lowerText = text.toLowerCase()
  return toolKeywords.filter(tool => lowerText.includes(tool.toLowerCase()))
}

function calculateSkillsMatch(briefSkills: string[], creatorSkills: string[]): number {
  if (briefSkills.length === 0) return 0.5
  if (creatorSkills.length === 0) return 0
  const matches = briefSkills.filter(s => creatorSkills.some(cs => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase())))
  return matches.length / briefSkills.length
}

function calculateToolsMatch(briefTools: string[], creatorTools: string[]): number {
  if (briefTools.length === 0) return 0.5
  if (creatorTools.length === 0) return 0
  const matches = briefTools.filter(t => creatorTools.some(ct => ct.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(ct.toLowerCase())))
  return matches.length / briefTools.length
}

function calculateSpecializationMatch(briefContentType: string, briefStyle: string, creatorSpecialization: string[], creatorSkills: string[]): number {
  const allCreatorSpecs = [...creatorSpecialization, ...creatorSkills].map(s => s.toLowerCase())
  if (allCreatorSpecs.length === 0) return 0
  let score = 0
  if (briefContentType && allCreatorSpecs.some(s => s.includes(briefContentType) || briefContentType.includes(s))) score += 0.5
  if (briefStyle && allCreatorSpecs.some(s => s.includes(briefStyle) || briefStyle.includes(s))) score += 0.5
  return Math.min(score, 1)
}

function calculateRelevantProjects(briefContentType: string, briefStyle: string, briefSkills: string[], portfolio: any[]): number {
  if (!portfolio.length) return 0
  let relevantCount = 0
  portfolio.forEach(project => {
    const projectSkills = [...(project.skillTags || []), ...(project.toolsUsed || [])].map(s => s.toLowerCase())
    const projectTitle = (project.title || '').toLowerCase()
    let projectScore = 0
    if (briefContentType && (projectSkills.some(s => s.includes(briefContentType)) || projectTitle.includes(briefContentType))) projectScore += 0.4
    if (briefStyle && (projectSkills.some(s => s.includes(briefStyle)) || projectTitle.includes(briefStyle))) projectScore += 0.3
    if (briefSkills.some(s => projectSkills.some(ps => ps.includes(s) || s.includes(ps)))) projectScore += 0.3
    if (projectScore > 0.5) relevantCount++
  })
  return Math.min(relevantCount / 3, 1)
}

function calculateBudgetMatch(briefBudget: number | null, proposedRate: number): number {
  if (!briefBudget || !proposedRate) return 0.5
  const ratio = proposedRate / briefBudget
  if (ratio <= 1.0) return 1
  if (ratio <= 1.2) return 0.8
  if (ratio <= 1.5) return 0.5
  return 0.2
}

function calculateTimelineMatch(brief: any, bidTimeline: string): number {
  if (!bidTimeline) return 0.5
  return 0.7
}

function calculateLocationMatch(briefLocation: string, creatorLocation: string | undefined): number {
  if (!creatorLocation) return 0
  return creatorLocation.includes(briefLocation) || briefLocation.includes(creatorLocation) ? 1 : 0
}

export function getBidderDisplayValue(categoryKey: string, score: number, _details: any): string {
  switch (categoryKey) {
    case 'briefMatch':
      return `${Math.round(score)}%`
    case 'creatorScore':
      return `${score.toFixed(1)} / 10`
    case 'skillsMatch':
    case 'toolsMatch':
    case 'specializationMatch':
    case 'relevantProjects':
    case 'budgetMatch':
    case 'timelineMatch':
    case 'locationMatch':
      return score > 0 ? `${Math.round(score)}%` : 'Not provided'
    case 'rating':
      return `★ ${score.toFixed(1)}`
    default:
      return 'Not provided'
  }
}

export function getBidderDetailValue(categoryKey: string, details: any): string {
  switch (categoryKey) {
    case 'skillsMatch':
      return details.skills?.length ? details.skills.join(', ') : 'Not provided'
    case 'toolsMatch':
      return details.tools?.length ? details.tools.join(', ') : 'Not provided'
    case 'specializationMatch':
      return details.specialization?.length ? details.specialization.join(', ') : 'Not provided'
    case 'relevantProjects':
      const relevant = details.portfolio?.filter((p: any) => p.skillTags?.length || p.toolsUsed?.length).slice(0, 3)
      return relevant?.length ? relevant.map((p: any) => p.title).join(', ') : 'Not provided'
    case 'budgetMatch':
      return details.proposedRate ? `$${details.proposedRate.toLocaleString()}` : 'Not provided'
    case 'timelineMatch':
      return details.timeline || 'Not provided'
    case 'rating':
      return details.ratingAvg ? `★ ${details.ratingAvg} (${details.ratingCount || 0} reviews)` : 'Not provided'
    case 'locationMatch':
      return details.location || 'Not provided'
    default:
      return 'Not provided'
  }
}