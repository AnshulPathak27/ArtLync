export function compareCreators(shortlistedCreators: any[]) {
  if (shortlistedCreators.length < 2) {
    return null
  }

  const categories = [
    { key: 'creatorScore', label: 'Creator Score', weight: 1.0 },
    { key: 'rating', label: 'Review Rating', weight: 0.8 },
    { key: 'skills', label: 'Skills', weight: 0.7 },
    { key: 'portfolio', label: 'Previous Projects', weight: 0.9 },
    { key: 'activeProjects', label: 'Active Projects', weight: 0.6 },
    { key: 'experience', label: 'Experience', weight: 0.7 },
  ]

  const scored = shortlistedCreators.map((creator: any) => {
    const skillsCount = creator.skills?.length || 0
    const portfolioCount = creator.portfolioItems?.length || 0
    const ratingCount = creator.ratingCount || 0

    return {
      creator,

      scores: {
        creatorScore: (creator.ratingAvg || 0) * 2,
        rating: creator.ratingAvg || 0,
        skills: Math.min(skillsCount / 5, 1) * 10,
        portfolio: Math.min(portfolioCount / 3, 1) * 10,
        activeProjects: 0,
        experience: Math.min(ratingCount, 10),
      },
    }
  })

  const strongest: Record<
    string,
    {
      creatorId: string
      value: number
    }
  > = {}

  categories.forEach((category) => {
    let maxValue = -1
    let strongestCreatorId = ''

    scored.forEach((item: any) => {
      const value = item.scores[category.key]

      if (value > maxValue) {
        maxValue = value
        strongestCreatorId = item.creator.id
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
        (sum: number, category) =>
          sum + item.scores[category.key] * category.weight,
        0
      ),
    }))
    .sort(
      (a: any, b: any) =>
        b.totalScore - a.totalScore
    )

  const bestMatch = totalScored[0]

  const reasons: string[] = []

  categories.forEach((category) => {
    if (
      strongest[category.key]?.creatorId ===
      bestMatch.creator.id
    ) {
      switch (category.key) {
        case 'creatorScore':
          reasons.push('higher Creator Score')
          break

        case 'rating':
          reasons.push('higher review rating')
          break

        case 'skills':
          reasons.push('more skills')
          break

        case 'portfolio':
          reasons.push('more previous projects')
          break

        case 'experience':
          reasons.push(
            'more experience based on reviews'
          )
          break
      }
    }
  })

  return {
    creators: scored,
    strongest,
    bestMatch: bestMatch.creator,
    reasons,
    categories: categories.map(
      (category) => category.label
    ),
  }
}