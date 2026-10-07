'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Conversation {
  id: string
  briefId: string | null
  creatorId: string
  brandUserId: string
  engagementId: string | null
  createdAt: string
  brief?: { id: string; title: string }
  creator?: { id: string; displayName: string; user: { id: string; email: string } }
  brandUser?: { id: string; email: string }
  messages?: Message[]
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  ciphertext: string
  iv: string
  createdAt: string
  sender?: { id: string; email: string }
}

function MessagesContent() {
  const { data: session } = useSession()
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [error, setError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }
    fetchConversations()
  }, [session, router])

  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations')
      const data = await res.json()
      setConversations(data)
    } catch {
      setError('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = async (conversation: Conversation) => {
    setActiveConversation(conversation)
    try {
      const res = await fetch(`/api/conversations/${conversation.id}/messages`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      setError('Failed to load messages')
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConversation) return

    setSending(true)
    try {
      // In a real app, this would encrypt the message client-side
      // For now, we'll simulate with plaintext (encryption is P3 item 14)
      const res = await fetch(`/api/conversations/${activeConversation.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ciphertext: btoa(newMessage), // Simple encoding for demo
          iv: 'demo-iv'
        })
      })

      if (res.ok) {
        const message = await res.json()
        setMessages(prev => [...prev, message])
        setNewMessage('')
      }
    } catch {
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const getOtherParty = (conversation: Conversation) => {
    if (session?.user?.role === 'CREATOR') {
      return conversation.brandUser?.email || 'Brand'
    }
    return conversation.creator?.displayName || 'Creator'
  }

  const getOtherPartyName = (message: Message) => {
    if (message.senderId === session?.user?.id) return 'You'
    return activeConversation ? (
      session?.user?.role === 'CREATOR' ? activeConversation.brandUser?.email : activeConversation.creator?.displayName
    ) : 'Other'
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-indigo-600">AI Creator Marketplace</Link>
            <div className="flex items-center gap-4">
              {session?.user?.role === 'CREATOR' && (
                <>
                  <Link href="/dashboard" className="text-gray-700 hover:text-indigo-600">Dashboard</Link>
                  <Link href="/jobs" className="text-gray-700 hover:text-indigo-600">Jobs</Link>
                </>
              )}
              {session?.user?.role === 'BRAND' && (
                <>
                  <Link href="/briefs" className="text-gray-700 hover:text-indigo-600">Briefs</Link>
                  <Link href="/my-engagements" className="text-gray-700 hover:text-indigo-600">Engagements</Link>
                </>
              )}
              <a href="/api/auth/signout" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">Sign Out</a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          <aside className="lg:col-span-1 bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Messages ({conversations.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center text-gray-600">
                  <p>No conversations yet</p>
                  <p className="text-sm mt-1">Conversations start when you bid on a brief</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition ${
                        activeConversation?.id === conv.id ? 'bg-indigo-50 border-r-2 border-indigo-500' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                          {getOtherParty(conv).charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{getOtherParty(conv)}</p>
                          <p className="text-sm text-gray-600 truncate">
                            {conv.brief?.title || conv.engagementId ? 'Engagement' : 'Direct message'}
                          </p>
                        </div>
                        <span className="text-xs text-gray-600">
                          {new Date(conv.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>

          <main className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col overflow-hidden">
            {activeConversation ? (
              <>
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                      {getOtherParty(activeConversation).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{getOtherParty(activeConversation)}</p>
                      <p className="text-sm text-gray-600">
                        {activeConversation.brief?.title ? `Brief: ${activeConversation.brief.title}` : 'Engagement conversation'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-600 py-8">
                      <p>No messages yet</p>
                      <p className="text-sm">Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id} className={`flex ${message.senderId === session?.user?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${message.senderId === session?.user?.id ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-900 rounded-bl-none'}`}>
                          <p className="text-sm">{atob(message.ciphertext)}</p>
                          <p className={`text-xs mt-1 ${message.senderId === session?.user?.id ? 'text-indigo-200' : 'text-gray-600'} text-right`}>
                            {getOtherPartyName(message)} • {new Date(message.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-4 border-t border-gray-200">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600">
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MessagesContent />
    </Suspense>
  )
}