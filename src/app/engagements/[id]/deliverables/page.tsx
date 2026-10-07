'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

interface DeliverableFile {
  id: string
  engagementId: string
  uploaderId: string
  storageKey: string
  iv: string
  filename: string
  createdAt: string
  uploader?: { id: string; email: string }
}

interface Engagement {
  id: string
  briefId: string
  creatorId: string
  brandId: string
  status: string
  brief: {
    id: string
    title: string
  }
  creator: { id: string; displayName: string }
}

function DeliverablesContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const engagementId = params.id as string
  const [engagement, setEngagement] = useState<Engagement | null>(null)
  const [deliverables, setDeliverables] = useState<DeliverableFile[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }
    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      const [engRes, delRes] = await Promise.all([
        fetch(`/api/engagements/${engagementId}`),
        fetch(`/api/engagements/${engagementId}/deliverables`)
      ])
      if (engRes.ok) setEngagement(await engRes.json())
      if (delRes.ok) setDeliverables(await delRes.json())
    } catch {
      setError('Failed to load deliverables')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const file = formData.get('file') as File

    if (!file) return

    setUploading(true)
    try {
      // First upload file to storage
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: (() => { const fd = new FormData(); fd.append('file', file); return fd; })()
      })
      const uploadData = await uploadRes.json()
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed')

      // Then create deliverable record (in real app, encrypt client-side first)
      const delRes = await fetch(`/api/engagements/${engagementId}/deliverables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storageKey: uploadData.key,
          iv: 'demo-iv',
          filename: file.name
        })
      })

      if (delRes.ok) {
        const deliverable = await delRes.json()
        setDeliverables([deliverable, ...deliverables])
        e.currentTarget.reset()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload deliverable')
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (deliverable: DeliverableFile) => {
    // In real app, this would decrypt client-side
    window.open(`/api/engagements/${engagementId}/deliverables/${deliverable.id}`, '_blank')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  if (!engagement) return <div className="min-h-screen flex items-center justify-center">Engagement not found</div>

  const isCreator = session?.user?.id === engagement.creatorId
  const isBrand = session?.user?.id === engagement.brandId

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              <Link href={`/engagements/${engagementId}`} className="text-gray-700 hover:text-indigo-600">← Back to Engagement</Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Deliverables</h1>
            <p className="text-gray-600 mt-1">Engagement: {engagement.brief.title}</p>
            <p className="text-sm text-gray-600 mt-1">
              {engagement.status === 'COMPLETED' ? 'Completed' : engagement.status} • 
              {isCreator ? 'Creator view' : 'Brand view'}
            </p>
          </div>

          <div className="p-6 border-b border-gray-200 bg-blue-50 rounded-t-xl">
            <h3 className="font-semibold text-blue-900 mb-2">🔒 End-to-End Encryption (Demo)</h3>
            <p className="text-blue-800 text-sm">
              In production, files are encrypted client-side using ECDH key exchange before upload. 
              The server only stores ciphertext and cannot decrypt files. 
              This demo shows the UI flow - encryption is simulated.
            </p>
          </div>

          {(isCreator || engagement.status !== 'COMPLETED') && (
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Deliverable</h2>
              <form onSubmit={handleUpload} className="space-y-4" encType="multipart/form-data">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select File</label>
                  <input
                    type="file"
                    name="file"
                    required
                    accept=".pdf,.doc,.docx,.zip,.rar,.mp4,.mov,.png,.jpg,.jpeg"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Upload File'}
                </button>
              </form>
            </div>
          )}

          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Files ({deliverables.length})</h2>
            {deliverables.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                <p>No deliverables yet</p>
                <p className="text-sm mt-1">{isCreator ? 'Upload your work files here' : 'Waiting for creator to deliver files'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {deliverables.map((file) => (
                  <div key={file.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">📄</div>
                      <div>
                        <p className="font-medium">{file.filename}</p>
                        <p className="text-sm text-gray-600">
                          Uploaded by {file.uploaderId === engagement.creatorId ? 'Creator' : 'Brand'} • 
                          {new Date(file.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Encrypted</span>
                      <button
                        onClick={() => handleDownload(file)}
                        className="text-indigo-600 hover:underline text-sm"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DeliverablesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <DeliverablesContent />
    </Suspense>
  )
}