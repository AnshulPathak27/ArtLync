# Demo Script

Walkthrough for live presentation of the AI Creator Marketplace. Covers P0/P1/P2 features with seeded demo data.

## Prerequisites

- Run `npm run dev` and open http://localhost:3000
- Demo accounts (password: `password123`):
  - **Creator:** `creator1@example.com` through `creator12@example.com`
  - **Brand:** `brand1@example.com` through `brand6@example.com`

---

## Step 1: Brand Searches & Filters Creators (P0 Criterion #3)

**Goal:** Demonstrate creator discovery with multi-select filters and empty-results handling.

1. **Start at homepage** → Click "Browse Creators" or navigate to `/creators`
2. **Observe:** 12 creators with varied specializations, tools, locations
3. **Apply filters:**
   - Check "AI Animation" under Skills
   - Check "Runway Gen-3" under Tools
   - Check "Los Angeles" under Location
4. **Observe:** Results narrow to creators matching ALL selected filters
5. **Test empty results:**
   - Add "Antarctica" location filter (no creators there)
   - **Expected:** Yellow alert box "No creators match these filters — try removing one"
   - Click "Clear all filters" → results return
6. **Test sorting:** Change "Sort By" to "Newest First" and "Name (A-Z)"
7. **Click a creator card** → Navigate to profile page

**Rubric Points:** Discovery & Filtering (25%), sensible empty-results handling explicitly tested.

---

## Step 2: Open Rich Creator Profile (P0 Criterion #1 + P1 Verification)

**Goal:** Show comprehensive creator profile with portfolio, verification badges, social links.

1. **From Step 1,** click any creator card (e.g., "AI Creator 1")
2. **Observe profile sections:**
   - **Hero:** Featured portfolio image, display name, location, rating (★ X.X), verified badges
   - **About:** Bio text
   - **Specializations:** Color-coded tags (indigo)
   - **Skills:** Gray tags
   - **Tools & Models:** Purple tags (Midjourney, Runway Gen-3, etc.)
   - **Preferred Job Types:** Orange tags
   - **Verification Signals:** Green badges for verified, gray for unverified
   - **Social Links:** Clickable icon buttons (Instagram, YouTube, LinkedIn, etc.)
   - **Portfolio:** Grid of 3-6 items with thumbnails, titles, workflow notes, tool tags
3. **Click a portfolio item** → Full-size view with workflow details
4. **Click social icons** → Opens external profile in new tab (demo URLs)
5. **Click "Hire This Creator"** → Redirects to signup as Brand

**Rubric Points:** Creator Profiles & AI Portfolios (30%) - rich, not bare forms.

---

## Step 3: Brand Posts a Brief (P0 Criterion #2 + P1 AI Assist)

**Goal:** Show structured brief creation with AI-assisted structuring.

1. **Sign out** → Sign in as `brand1@example.com` / `password123`
2. **Navigate to** `/briefs/new` (or click "Post a Brief" in nav)
3. **Fill manually OR use AI Assist:**
   - **Title:** "30s Product Video for Instagram - Anime Style"
   - **Campaign Requirements:** Paste rough idea:
     > "Need a 30-second product video for our new eco-friendly water bottle. Anime style, vibrant colors, for Instagram Reels. Target: Gen Z. Show the bottle in nature settings. Music: upbeat electronic."
   - **Click "✨ AI Assist - Structure this brief"** button
4. **Observe AI-extracted fields auto-filled:**
   - Content Type: `video`
   - Style: `anime`
   - Format: `9:16`
   - Commercial Use: `Standard commercial license, worldwide, perpetual, non-exclusive`
   - Job Type: `Social Ad`
   - Location: `Remote`
5. **Review and adjust** any fields
6. **Add budget:** `5000`
7. **Click "Publish Brief"** → Redirects to brief detail page
8. **Verify all fields displayed** back to creator browsing it

**Rubric Points:** Brief Definition (20%) - all required fields present and clearly shown.

**Bonus:** AI-Assisted Brief Builder - works with local LLM (Ollama) or falls back to rule-based extractor.

---

## Step 4: Creator Bids, Brand Accepts (P2 Job Posting + Bidding)

**Goal:** Demonstrate bidding flow and engagement creation.

1. **Sign out** → Sign in as `creator2@example.com` / `password123`
2. **Navigate to** `/jobs` → See the brief from Step 3
3. **Click "Submit Bid"** on the brief card
4. **Fill bid form:**
   - Proposed Rate: `4500`
   - Timeline: `2 weeks`
   - Message: "I specialize in anime-style product videos. My recent work with Runway Gen-3 matches your vision perfectly."
5. **Submit** → Bid appears on brief detail page
6. **Sign out** → Sign in as `brand1@example.com`
7. **Navigate to** `/briefs` → Click the brief
8. **Observe bid** with creator name, rate, timeline, message
9. **Click "Accept Bid"** → Creates engagement, rejects other bids
10. **Observe:** Brief status changes to "IN_PROGRESS", engagement section appears
11. **Navigate to** `/engagements` → See active engagement

**Rubric Points:** Full lifecycle from brief → bid → acceptance → engagement.

---

## Step 5: Brand Completes Engagement, Leaves Review (P2 Reviews)

**Goal:** Show mandatory review on completion updating creator score.

1. **As Brand** (from Step 4), navigate to `/engagements`
2. **Click engagement** → View details
3. **Click "Complete & Review"** (appears when status is DELIVERED)
   - *Note: In demo, you may need to first mark as DELIVERED as Creator*
4. **Fill review form:**
   - Rating: 5 stars
   - Comment: "Exceptional work! Delivered early, perfect anime style, great communication."
5. **Submit** → Engagement marked COMPLETED
6. **Navigate to creator profile** (`/creators/[creator-id]`)
7. **Observe updated rating** (★ 5.0, 1 review)
8. **Navigate to `/jobs` as another creator** → See updated rating in search results
9. **Sort by Rating** → Creator appears at top

**Rubric Points:** Reviews update aggregate score visible on profile and in search.

---

## P3 Extensions (If Completed)

### Step 6: Encrypted Chat & Deliverables

1. **From engagement detail,** click "Messages" or navigate to `/messages`
2. **Select conversation** → Chat interface
3. **Send message** → Encrypted client-side (ciphertext in DB)
4. **Upload deliverable** in `/engagements/[id]/deliverables`
5. **Download** → Decrypted client-side
6. **Verify in DB:** `Message.ciphertext` and `DeliverableFile.storageKey` contain only encrypted data

### Step 7: Recommendations

1. **As Brand on `/creators`** → See "Recommended for you" section
2. **As Creator on `/jobs`** → See "Recommended for you" section
3. **Explain matching factors:** Skills overlap, tool alignment, location match, rating tiebreaker

---

## Quick Reference: Seeded Data

| Type | Count | Notes |
|------|-------|-------|
| Creators | 12 | Varied skills/tools/locations; 8 have verification signals |
| Brands | 6 | 4 verified |
| Briefs | 11 | All statuses (OPEN, IN_PROGRESS, COMPLETED, CLOSED) |
| Bids | Multiple | On OPEN briefs |
| Engagements | Several | Some COMPLETED with reviews |
| Reviews | Several | Ratings 4-5 stars |
| Empty filter combo | 1 | "Antarctica" location returns zero creators |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Invalid credentials" | Use `password123` for all demo accounts |
| Email verification stuck | Click "Dev: Get Verification Link" on verify page |
| No creators in filter | Click "Clear all filters" |
| AI Assist not working | Falls back to rule-based extractor automatically |
| Build errors | Run `npm run build` to check TypeScript/ESLint |