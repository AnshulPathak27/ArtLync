# Data Model Documentation

This document describes the data model for the AI Creator Marketplace, as implemented in the Prisma schema. It explains each model, its fields, and relationships, and notes which parts are hackathon simplifications versus what a production version would need.

## Overview

The marketplace connects **AI Creators** (filmmakers, animators, generative artists) with **Brands/Agencies** who want to hire them. The data model supports the full lifecycle from creator profile creation through brief publishing, bidding, engagement, delivery, and review.

## Models

### User
Core authentication and identity model.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| email | String (unique) | Login email |
| passwordHash | String | Bcrypt-hashed password |
| role | String (CREATOR/BRAND) | User role determining permissions |
| emailVerified | Boolean | Email verification status (hackathon: simulated) |
| verificationToken | String? | Token for email verification (hackathon: dev-only) |
| publicKey | String? | ECDH public key for E2E encryption (P3) |
| createdAt | DateTime | Record creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:** CreatorProfile, BrandProfile, Bids, Engagements (as brand), Reviews (as brand), Conversations, Messages, DeliverableFiles

**Hackathon Simplification:** Email verification is simulated with a dev token shown on screen. Production would need real email infrastructure (SendGrid, etc.) and a proper verification flow.

---

### CreatorProfile
Extended profile for users with CREATOR role.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String (unique) | Foreign key to User |
| displayName | String | Public display name |
| bio | String? | Creator biography |
| skills | String (JSON array) | Technical/creative skills |
| specialization | String (JSON array) | Specialization areas |
| toolsUsed | String (JSON array) | AI tools/models the creator uses |
| location | String? | Preferred work location |
| jobTypePreferences | String (JSON array) | Types of jobs creator prefers |
| ratingAvg | Float | Average rating from reviews |
| ratingCount | Int | Number of reviews received |
| createdAt | DateTime | Profile creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:** User, PortfolioItems, VerificationSignals, SocialLinks, Bids, Engagements (as creator), Reviews (as creator), Conversations

**Hackathon Simplification:** Arrays stored as JSON strings in SQLite (native array support requires PostgreSQL). Production would use proper array columns or a separate junction table.

---

### BrandProfile
Extended profile for users with BRAND role.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| userId | String (unique) | Foreign key to User |
| companyName | String? | Company/agency name |
| companyWebsite | String? | Company website URL |
| verified | Boolean | Brand verification status (hackathon: self-attestation) |

**Relations:** User, Briefs

**Hackathon Simplification:** Verification is a simple boolean flag. Production would need business verification (documents, domain verification, etc.).

---

### PortfolioItem
Individual work samples in a creator's portfolio.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| creatorId | String | Foreign key to CreatorProfile |
| title | String | Work title |
| mediaUrl | String | Image URL or video link |
| mediaType | String (IMAGE/VIDEO_LINK) | Type of media |
| toolsUsed | String (JSON array) | Tools used for this specific piece |
| skillTags | String (JSON array) | Skills demonstrated |
| workflowNote | String? | Description of creative workflow |
| createdAt | DateTime | Creation timestamp |

**Relations:** CreatorProfile

---

### VerificationSignal
Trust indicators on creator profiles.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| creatorId | String | Foreign key to CreatorProfile |
| type | String (TOOL/WORKFLOW/PAST_WORK) | Verification category |
| label | String | Human-readable label (e.g., "Verified Midjourney Expert") |
| verified | Boolean | Whether verified by platform |
| evidenceNote | String? | Notes on verification evidence |
| createdAt | DateTime | Creation timestamp |

**Relations:** CreatorProfile

**Hackathon Simplification:** Verification is a self-attestation toggle in the UI. Production would need a verification pipeline (skill assessments, client references, portfolio audits).

---

### Brief
Job posting from a brand.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| brandId | String | Foreign key to BrandProfile |
| title | String | Brief title |
| campaignRequirements | String | Free-text campaign description |
| contentType | String | video/animation/graphic/other |
| style | String | Visual style (e.g., anime, cinematic) |
| formatAspectRatio | String | Aspect ratio (16:9, 9:16, 1:1, 4:5) |
| commercialUseRequirements | String | Usage rights, territory, duration, exclusivity |
| jobType | String? | Job category (social ad, explainer, etc.) |
| location | String? | Work location requirement |
| budget | Float? | Budget in USD |
| status | String (OPEN/IN_PROGRESS/COMPLETED/CLOSED) | Brief lifecycle status |
| createdAt | DateTime | Creation timestamp |
| updatedAt | DateTime | Last update timestamp |

**Relations:** BrandProfile, Bids, Engagement, Conversation

---

### Bid
Creator's proposal on a brief.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| briefId | String | Foreign key to Brief |
| creatorId | String | Foreign key to CreatorProfile |
| proposedRate | Float | Proposed payment in USD |
| timeline | String | Delivery timeline (e.g., "2 weeks") |
| message | String? | Cover letter / pitch |
| status | String (PENDING/ACCEPTED/REJECTED) | Bid status |
| createdAt | DateTime | Creation timestamp |

**Relations:** Brief, CreatorProfile

**Constraints:** Unique (briefId, creatorId) - one bid per creator per brief

---

### Engagement
Active collaboration between brand and creator after bid acceptance.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| briefId | String (unique) | Foreign key to Brief |
| creatorId | String | Foreign key to CreatorProfile |
| brandId | String | Foreign key to User (brand) |
| status | String (IN_PROGRESS/DELIVERED/COMPLETED) | Engagement status |
| startedAt | DateTime | When engagement began |
| completedAt | DateTime? | When marked complete |

**Relations:** Brief, CreatorProfile (creator), User (brand), Review, DeliverableFiles, Conversation

---

### Review
Brand's rating and feedback on completed engagement.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| engagementId | String (unique) | Foreign key to Engagement |
| creatorId | String | Foreign key to CreatorProfile |
| brandUserId | String | Foreign key to User (brand) |
| rating | Int (1-5) | Star rating |
| comment | String | Written feedback |
| createdAt | DateTime | Creation timestamp |

**Relations:** Engagement, CreatorProfile, User

**Note:** On creation, triggers recalculation of CreatorProfile.ratingAvg and ratingCount.

---

### SocialLink
Creator's external profile links.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| creatorId | String | Foreign key to CreatorProfile |
| platform | String (INSTAGRAM/YOUTUBE/BEHANCE/LINKEDIN/VIMEO/WEBSITE/OTHER) | Platform name |
| url | String | Profile URL |
| createdAt | DateTime | Creation timestamp |

**Relations:** CreatorProfile

---

### Conversation (P3)
Private messaging between brand and creator.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| briefId | String? (unique) | Foreign key to Brief |
| creatorId | String | Foreign key to CreatorProfile |
| brandUserId | String | Foreign key to User (brand) |
| engagementId | String? (unique) | Foreign key to Engagement |
| createdAt | DateTime | Creation timestamp |

**Relations:** Brief, CreatorProfile, User, Engagement, Messages

---

### Message (P3)
Encrypted message in a conversation.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| conversationId | String | Foreign key to Conversation |
| senderId | String | Foreign key to User |
| ciphertext | String | Encrypted message content |
| iv | String | Initialization vector for decryption |
| createdAt | DateTime | Creation timestamp |

**Relations:** Conversation, User

**Security:** No plaintext column ever. Encryption happens client-side via Web Crypto API (ECDH + AES-GCM).

---

### DeliverableFile (P3)
Encrypted file shared during engagement.

| Field | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Primary key |
| engagementId | String | Foreign key to Engagement |
| uploaderId | String | Foreign key to User |
| storageKey | String | Storage reference |
| iv | String | Initialization vector |
| filename | String | Original filename |
| createdAt | DateTime | Upload timestamp |

**Relations:** Engagement, User

**Security:** File encrypted client-side before upload with engagement-specific shared key.

---

## Hackathon Simplifications Summary

| Area | Simplification | Production Approach |
|------|---------------|---------------------|
| Email Verification | Dev token shown on screen | Real email service (SendGrid, Resend) |
| Verification Signals | Self-attestation toggle | Assessment pipeline, client references |
| Brand Verification | Boolean flag | Business document verification |
| Array Fields | JSON strings in SQLite | Native PostgreSQL arrays or junction tables |
| File Storage | Local disk (`public/uploads/`) | S3-compatible (R2, Supabase Storage) |
| Database | SQLite (local) | Managed PostgreSQL (Neon, Supabase) |
| E2E Encryption | Demo implementation | Audited protocol (Signal, libsodium) |
| Rate Limiting | None | API rate limiting, abuse prevention |
| Audit Logging | None | Comprehensive audit trail |

## Production Migration Path

1. **Database:** Change `provider` to `postgresql` in Prisma schema, run `prisma migrate deploy`
2. **Storage:** Set `STORAGE_DRIVER=s3` and configure S3 credentials
3. **Email:** Integrate SendGrid/Resend for verification emails
4. **Verification:** Build assessment pipeline for skills/tools
5. **Encryption:** Replace demo E2E with Signal Protocol or libsodium
5. **Monitoring:** Add logging, error tracking (Sentry), analytics