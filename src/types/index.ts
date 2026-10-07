export type UserRole = 'CREATOR' | 'BRAND'
export type MediaType = 'IMAGE' | 'VIDEO_LINK'
export type VerificationSignalType = 'TOOL' | 'WORKFLOW' | 'PAST_WORK'
export type BriefStatusType = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
export type BidStatusType = 'PENDING' | 'ACCEPTED' | 'REJECTED'
export type EngagementStatusType = 'IN_PROGRESS' | 'DELIVERED' | 'COMPLETED'
export type SocialPlatformType = 'INSTAGRAM' | 'YOUTUBE' | 'BEHANCE' | 'LINKEDIN' | 'VIMEO' | 'WEBSITE' | 'OTHER'

export interface CreatorProfileWithRelations {
  id: string
  userId: string
  displayName: string
  bio: string | null
  skills: string[]
  specialization: string[]
  toolsUsed: string[]
  location: string | null
  jobTypePreferences: string[]
  ratingAvg: number
  ratingCount: number
  portfolioItems: PortfolioItem[]
  verificationSignals: VerificationSignal[]
  socialLinks: SocialLink[]
}

export interface PortfolioItem {
  id: string
  creatorId: string
  title: string
  mediaUrl: string
  mediaType: MediaType
  toolsUsed: string[]
  skillTags: string[]
  workflowNote: string | null
  createdAt: Date
}

export interface VerificationSignal {
  id: string
  creatorId: string
  type: VerificationSignalType
  label: string
  verified: boolean
  evidenceNote: string | null
  createdAt: Date
}

export interface SocialLink {
  id: string
  creatorId: string
  platform: SocialPlatformType
  url: string
  createdAt: Date
}

export interface BriefWithRelations {
  id: string
  brandId: string
  title: string
  campaignRequirements: string
  contentType: string
  style: string
  formatAspectRatio: string
  commercialUseRequirements: string
  jobType: string | null
  location: string | null
  budget: number | null
  status: BriefStatusType
  createdAt: Date
  brand: {
    id: string
    user: {
      id: string
      email: string
    }
    companyName: string | null
    companyWebsite: string | null
    verified: boolean
  }
  bids?: Bid[]
  _count?: {
    bids: number
  }
}

export interface Bid {
  id: string
  briefId: string
  creatorId: string
  proposedRate: number
  timeline: string
  message: string | null
  status: BidStatusType
  createdAt: Date
  creator?: {
    id: string
    displayName: string
    user: {
      id: string
      email: string
    }
  }
}

export interface EngagementWithRelations {
  id: string
  briefId: string
  creatorId: string
  brandId: string
  status: EngagementStatusType
  startedAt: Date
  completedAt: Date | null
  brief: BriefWithRelations
  creator: CreatorProfileWithRelations
  brand: {
    id: string
    email: string
  }
  review?: Review
  deliverableFiles: DeliverableFile[]
}

export interface Review {
  id: string
  engagementId: string
  creatorId: string
  brandUserId: string
  rating: number
  comment: string
  createdAt: Date
}

export interface DeliverableFile {
  id: string
  engagementId: string
  uploaderId: string
  storageKey: string
  iv: string
  filename: string
  createdAt: Date
}

export interface Conversation {
  id: string
  briefId: string | null
  creatorId: string
  brandUserId: string
  engagementId: string | null
  createdAt: Date
  messages?: Message[]
}

export interface Message {
  id: string
  conversationId: string
  senderId: string
  ciphertext: string
  iv: string
  createdAt: Date
  sender?: {
    id: string
    email: string
  }
}

export function parseJsonArray<T>(value: string | null): T[] {
  if (!value) return []
  try {
    return JSON.parse(value) as T[]
  } catch {
    return []
  }
}

export function stringifyJsonArray<T>(value: T[]): string {
  return JSON.stringify(value)
}