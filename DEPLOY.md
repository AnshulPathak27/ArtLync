# Deployment Guide

This document describes how to deploy the AI Creator Marketplace to production using Vercel, Neon (PostgreSQL), and Cloudflare R2 (S3-compatible storage).

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Vercel    │────▶│    Neon     │     │ Cloudflare  │
│  (Next.js)  │     │ (PostgreSQL)│     │     R2      │
└─────────────┘     └─────────────┘     └─────────────┘
```

## Prerequisites

- GitHub account (for Vercel integration)
- Neon account (free tier: https://neon.tech)
- Cloudflare account (free tier: https://cloudflare.com)
- Domain name (optional, for custom domain)

---

## 1. Database Setup (Neon)

1. **Create Neon project:**
   - Go to https://console.neon.tech
   - Click "Create Project"
   - Choose a name (e.g., "ai-creator-marketplace")
   - Select region closest to users
   - Wait for project creation

2. **Get connection string:**
   - In Neon dashboard, go to "Connection Details"
   - Copy the connection string (starts with `postgresql://`)
   - Format: `postgresql://user:password@host/dbname?sslmode=require`

3. **Run migrations:**
   ```bash
   # Locally, set DATABASE_URL to Neon string
   export DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
   npx prisma migrate deploy
   ```

---

## 2. File Storage Setup (Cloudflare R2)

1. **Create R2 bucket:**
   - Go to Cloudflare Dashboard → R2
   - Click "Create bucket"
   - Name: `ai-creator-marketplace-uploads`
   - Location: Automatic

2. **Create API token:**
   - Go to "Manage R2 API tokens"
   - Click "Create API token"
   - Permissions: Object Read & Write
   - Save the Access Key ID and Secret Access Key

3. **Get S3 endpoint:**
   - Format: `https://<account-id>.r2.cloudflarestorage.com`
   - Find Account ID in R2 dashboard

---

## 3. Vercel Deployment

### Option A: Vercel Dashboard (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ai-creator-marketplace.git
   git push -u origin main
   ```

2. **Import in Vercel:**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Framework preset: Next.js (auto-detected)
   - Click "Deploy"

3. **Configure Environment Variables in Vercel:**
   Go to Project Settings → Environment Variables and add:

   | Variable | Value | Environment |
   |----------|-------|-------------|
   | `DATABASE_URL` | Your Neon connection string | Production, Preview |
   | `NEXTAUTH_SECRET` | Generate with `openssl rand -base64 32` | Production, Preview |
   | `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production, Preview |
   | `STORAGE_DRIVER` | `s3` | Production, Preview |
   | `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` | Production, Preview |
   | `S3_BUCKET` | `ai-creator-marketplace-uploads` | Production, Preview |
   | `S3_ACCESS_KEY_ID` | Your R2 Access Key ID | Production, Preview |
   | `S3_SECRET_ACCESS_KEY` | Your R2 Secret Access Key | Production, Preview |
   | `S3_REGION` | `auto` | Production, Preview |

4. **Redeploy:** Trigger a new deployment after adding variables.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel login
vercel --prod
# Follow prompts, then add env vars via dashboard
```

---

## 4. Prisma Schema Updates for Production

Update `prisma/schema.prisma` datasource:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Run locally with production DATABASE_URL:
```bash
npx prisma migrate deploy
```

---

## 5. Storage Adapter Configuration

The app uses `lib/storage.ts` with a driver pattern. Ensure `lib/storage-s3.ts` exists for S3 driver:

```typescript
// lib/storage-s3.ts (create if not exists)
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3 = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

export async function put(key: string, data: Buffer): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
    Body: data,
  }))
  return key
}

export async function get(key: string): Promise<Buffer | null> {
  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: process.env.S3_BUCKET!,
      Key: key,
    }))
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch {
    return null
  }
}

export async function deleteFile(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET!,
    Key: key,
  }))
}

export function getPublicUrl(key: string): string {
  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${key}`
}
```

Update `lib/storage.ts` to use the driver:

```typescript
// lib/storage.ts
import { put as putLocal, get as getLocal, deleteFile as deleteLocal, getPublicUrl as getPublicUrlLocal } from './storage-local'
import { put as putS3, get as getS3, deleteFile as deleteS3, getPublicUrl as getPublicUrlS3 } from './storage-s3'

const driver = process.env.STORAGE_DRIVER || 'local'

export const put = driver === 's3' ? putS3 : putLocal
export const get = driver === 's3' ? getS3 : getLocal
export const deleteFile = driver === 's3' ? deleteS3 : deleteLocal
export const getPublicUrl = driver === 's3' ? getPublicUrlS3 : getPublicUrlLocal
```

---

## 6. Environment Variables Reference

Create `.env.example` with all required variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Auth
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="https://your-app.vercel.app"

# Storage
STORAGE_DRIVER="s3"
S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
S3_BUCKET="ai-creator-marketplace-uploads"
S3_ACCESS_KEY_ID="your-access-key"
S3_SECRET_ACCESS_KEY="your-secret-key"
S3_REGION="auto"

# Optional: Local LLM for AI Brief Builder
LLM_ENDPOINT="http://localhost:11434/v1"
LLM_MODEL="llama3"
```

---

## 7. Post-Deployment Checklist

- [ ] Database migrations applied (`npx prisma migrate deploy`)
- [ ] All environment variables set in Vercel
- [ ] R2 bucket CORS configured (allow your Vercel domain)
- [ ] Custom domain configured (optional)
- [ ] Test signup/login flow
- [ ] Test file upload (portfolio images)
- [ ] Test brief creation and bidding
- [ ] Test engagement completion and review
- [ ] Verify Prisma Client generated correctly in build logs

---

## 8. Monitoring & Maintenance

- **Vercel Analytics:** Enable in project settings
- **Error Tracking:** Add Sentry (DSN in env vars)
- **Database Backups:** Neon provides automatic daily backups
- **Log Retention:** Vercel retains logs for 30 days (Pro: 1 year)
- **Scaling:** Vercel auto-scales; Neon auto-scales compute

---

## 8. Troubleshooting

| Issue | Solution |
|-------|----------|
| Build fails on Prisma | Ensure `prisma generate` runs in build (check `package.json` postinstall) |
| File upload fails | Check R2 CORS policy allows `https://your-app.vercel.app` |
| Auth redirect loops | Verify `NEXTAUTH_URL` matches deployed URL exactly |
| Database connection timeout | Check Neon IP allowlist (0.0.0.0/0 for Vercel) |
| Prisma migrate fails | Run locally with production DATABASE_URL first |

---

## 9. Cost Estimates (Free Tiers)

| Service | Free Tier Limits |
|---------|------------------|
| Vercel | 100GB bandwidth, 100GB-hours serverless |
| Neon | 0.5 GB storage, 100 hours compute/month |
| Cloudflare R2 | 10 GB storage, 1M Class A ops/month |
| **Total** | **$0/month** for small projects |