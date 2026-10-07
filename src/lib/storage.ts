import fs from 'fs/promises'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')

async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR)
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true })
  }
}

export async function put(key: string, data: Buffer | Uint8Array): Promise<string> {
  await ensureUploadDir()
  const filePath = path.join(UPLOAD_DIR, key)
  await fs.writeFile(filePath, data)
  return `/uploads/${key}`
}

export async function get(key: string): Promise<Buffer | null> {
  const filePath = path.join(UPLOAD_DIR, key)
  try {
    return await fs.readFile(filePath)
  } catch {
    return null
  }
}

export async function deleteFile(key: string): Promise<void> {
  const filePath = path.join(UPLOAD_DIR, key)
  try {
    await fs.unlink(filePath)
  } catch {
  }
}

export function getPublicUrl(key: string): string {
  return `/uploads/${key}`
}