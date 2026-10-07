# ArtLync

**Where AI Creators Meet Creative Briefs**

A marketplace platform connecting brands with AI-powered creative talent. Brands post detailed campaign briefs; AI creators showcase verified portfolios, submit bids, and get matched through explainable, brief-specific comparison.

---

## What is ArtLync?

**The Problem**  
Brands and agencies struggle to discover, evaluate, and engage AI creative talent. Traditional platforms treat creators as generic profiles—no capability evidence, no brief-aware matching, no explainable comparison.

**The Solution**  
ArtLync is a two-sided marketplace built for AI-native creative work:

| Brand Side | Creator Side |
|------------|--------------|
| Post structured campaign briefs with AI-assisted drafting | Build rich profiles with portfolio evidence |
| Receive bids with proposed rates & timelines | Showcase AI capabilities, tools, and verified work |
| Shortlist & compare bidders side-by-side | Submit bids with rates, timelines, and messages |
| Get explainable Best Match recommendations | Get selected and start engagements |

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Creator Discovery** | Filter by skills, tools, specialization, location, job type; sort by rating or recency |
| **Creator Score** | Weighted score (rating × 2) displayed on every profile and card |
| **AI Capabilities** | Skills, tools, specializations shown with portfolio evidence badges |
| **AI Portfolios** | Media-rich items with tools used, skill tags, workflow notes |
| **Creator Shortlisting** | Bookmark creators; persistent client-side shortlist |
| **Creator Comparison** | Side-by-side table: score, rating, skills, projects, experience |
| **Brief Creation** | Structured forms with AI-assisted drafting (local LLM + rule-based fallback) |
| **Creator Bidding** | Creators submit proposed rate, timeline, and message on open briefs |
| **Bidder Shortlisting** | Brands bookmark bidders on their briefs |
| **Brief-Specific Bidder Comparison** | Side-by-side with Brief Match %, proposed price, timeline, relevant work |
| **Best Match Recommendation** | Explainable reasoning: "Strongest match for required skills, relevant work, and budget" |
| **Creator Selection** | Brands select one winning creator from comparison view |
| **Engagement Management** | Deliverables upload, review system, encrypted file handling |
| **Authentication** | NextAuth credentials, bcrypt password hashing, JWT sessions |
| **Role-Based Access** | BRAND vs CREATOR permissions on all routes |
| **Verification Signals** | Tool, workflow, past-work signals with evidence notes |

---

## What Makes ArtLync Different

| Traditional Directory | ArtLync |
|----------------------|---------|
| Static profiles | Evidence-backed capabilities (portfolio-linked badges) |
| Generic search | Capability-based discovery with filters |
| Unexplained rankings | Explainable Best Match with reasoning |
| Generic profiles | Brief-specific bidder comparison |
| Passive profiles | Active bidding workflow |
| No capability signals | Verification signals (tool, workflow, past-work) |

---

## How It Works

### Brand Flow
```
Discover Creators
       ↓
Create Brief (AI-assisted)
       ↓
Receive Bids
       ↓
Shortlist Bidders
       ↓
Compare Side-by-Side
       ↓
Select Creator → Engagement Starts
```

### Creator Flow
```
Build Profile & Portfolio
       ↓
Showcase AI Capabilities
       ↓
Discover Briefs
       ↓
Submit Bid (rate, timeline, message)
       ↓
Get Shortlisted & Compared
       ↓
Get Selected → Start Work
```

---

## Creator Comparison

### General Creator Comparison
Side-by-side table with:
- **Creator Score** (rating × 2)
- **Review Rating** (★ avg, count)
- **Skills** (count)
- **Previous Projects** (portfolio count)
- **Experience** (review count)
- **Active Projects** (where implemented)

### Brief-Specific Bidder Comparison
Additional brief-aware factors:
- **Brief Match %** (skills, tools, specialization, relevant work, budget, timeline, location*)
- **Proposed Price** vs brief budget
- **Timeline** fit
- **Relevant Work** (portfolio items matching brief)
- **Location Match** (only when brief specifies location)

### Best Match Recommendation
- **Badge**: "Best Match — [Creator Name]"
- **Score**: Creator Score /10
- **Reasoning**: e.g., *"Strongest match for the required skills, relevant previous work, and budget."*
- **Independence**: Brands can select a different creator; Best Match never auto-selects

---

## Technical Architecture

```
┌─────────────────────────────────────┐
│         Brand / Creator             │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│      ArtLync Web App (Next.js 14)   │
│  • App Router (Server Components)   │
│  • Client Components (Interactions) │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│          API Routes                 │
│  • RESTful endpoints (GET/POST)     │
│  • Server-side validation (Zod)     │
│  • Auth & authorization checks      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│         Prisma ORM                  │
│  • Type-safe database access        │
│  • Relations & transactions         │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│       SQLite Database               │
│  (dev) / PostgreSQL (prod)          │
└─────────────────────────────────────┘
```

**AI Integration**  
Brief builder uses a local LLM endpoint (Ollama-compatible) with a structured system prompt. Falls back to a rule-based extractor when the LLM is unavailable—no external API keys required.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 | UI components |
| **Framework** | Next.js 14 (App Router) | SSR, RSC, API routes |
| **Language** | TypeScript | Type safety |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **Animation** | Framer Motion | Transitions, interactions |
| **Backend** | Next.js API Routes | REST endpoints |
| **Validation** | Zod | Schema validation |
| **Database** | SQLite (dev) / PostgreSQL (prod) | Data persistence |
| **ORM** | Prisma 5 | Type-safe database access |
| **Authentication** | NextAuth v4 (Credentials) | Email/password auth |
| **Password Hashing** | bcryptjs | Secure password storage |
| **Session** | JWT (30-day) | Stateless auth |
| **AI** | Local LLM (Ollama) + rule-based | Brief structure extraction |

---

## Project Structure

```
src/
├── app/
│   ├── api/                 # API Routes
│   │   ├── auth/            # NextAuth endpoints
│   │   ├── briefs/          # Brief CRUD, bidding
│   │   ├── creators/        # Discovery, comparison
│   │   ├── engagements/     # Engagement management
│   │   ├── portfolio/       # Portfolio CRUD
│   │   ├── social/          # Social links
│   │   ├── verification/    # Verification signals
│   │   ├── upload/          # File upload
│   │   ├── ai/brief-builder # AI brief drafting
│   │   └── ...
│   ├── briefs/              # Brief pages (list, detail, create)
│   ├── creators/            # Creator browsing, profiles, comparison
│   ├── dashboard/           # Creator dashboard
│   ├── engagements/         # Engagement detail, deliverables
│   ├── login/               # Sign in
│   ├── signup/              # Sign up
│   └── ...
├── components/              # Shared UI components
├── lib/                     # Core utilities
│   ├── auth.ts              # NextAuth config
│   ├── prisma.ts            # Prisma client
│   └── ...
├── types/                   # TypeScript types
└── ...

prisma/
├── schema.prisma            # Database schema
└── seed.ts                  # Development seed data
```

---

## Security

| Measure | Implementation |
|---------|----------------|
| **Authentication** | NextAuth v4 with Credentials provider |
| **Password Hashing** | bcryptjs (cost factor default) |
| **Session** | JWT, 30-day expiry, HttpOnly cookies |
| **Protected Routes** | All API routes check `getServerSession` |
| **Role-Based Auth** | BRAND vs CREATOR checks on every route |
| **Ownership Checks** | Briefs, bids, portfolios, social links verified |
| **Secrets** | `.env` in `.gitignore`; `.env.example` with placeholders |
| **Database** | `*.db`, `*.sqlite*` in `.gitignore` |
| **Input Validation** | Zod schemas on all API inputs |

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- (Optional) Ollama running locally for AI brief builder

### Installation
```bash
# Clone
git clone <repository-url>
cd artlync

# Install dependencies
npm install

# Environment setup
cp .env.example .env
# Edit .env with your values

# Database setup
npx prisma migrate dev --name init
npm run db:seed

# Development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Available Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:seed` | Seed database with sample data |

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite file path (`file:./dev.db`) or PostgreSQL URL |
| `NEXTAUTH_SECRET` | Yes | Generate with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Yes | App URL (e.g., `http://localhost:3000`) |
| `STORAGE_DRIVER` | No | `local` or `s3` (default: `local`) |
| `LLM_ENDPOINT` | No | Ollama endpoint (default: `http://localhost:11434/v1`) |
| `LLM_MODEL` | No | Model name (default: `llama3`) |

**Never commit `.env`** — it is in `.gitignore`. Use `.env.example` as a template.

---

## Project Status

**Working Prototype / Hackathon Project**

- ✅ Core marketplace flows implemented
- ✅ Authentication & authorization complete
- ✅ AI brief builder with local LLM fallback
- ✅ Brief-specific bidder comparison with Best Match
- ⚠️ SQLite for development only (PostgreSQL recommended for production)
- ⚠️ Image optimization uses standard `<img>` tags (Next/Image TODO)
- ⚠️ No automated tests yet
- ⚠️ Not production-hardened (rate limiting, CSP, monitoring TBD)

---

*ArtLync — Connecting AI Creativity with Creative Intent*