'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Feedback } from '@/types/database'
import type { RealtimeChannel } from '@supabase/supabase-js'

type FeedbackListProps = {
  initialFeedback: Feedback[]
  currentUserId: string | null
}

export default function FeedbackList({ initialFeedback, currentUserId }: FeedbackListProps) {
  const [feedback, setFeedback] = useState<Feedback[]>(initialFeedback)
  const [deleting, setDeleting] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel('feedback-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feedback',
        },
        (payload) => {
          setFeedback((current) => [payload.new as Feedback, ...current])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'feedback',
        },
        (payload) => {
          setFeedback((current) => current.filter((item) => item.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', id)
      if (error) throw error

      // Optimistically remove from local state
      setFeedback((current) => current.filter((item) => item.id !== id))
    } catch (err) {
      console.error('Failed to delete feedback:', err)
    } finally {
      setDeleting(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date)
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">All Feedback</h2>

      {feedback.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-500">No feedback yet. Be the first to submit!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedback.map((item) => (
            <div key={item.id} className="bg-white shadow-md hover:shadow-lg rounded-xl p-4 sm:p-6 border border-gray-100 transition-all duration-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {item.user_email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 break-words">{item.title}</h3>
                    {currentUserId === item.user_id && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={deleting === item.id}
                        className="flex-shrink-0 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium text-red-600 hover:text-white hover:bg-red-600 border border-red-600 rounded-lg disabled:opacity-50 transition-all"
                      >
                        {deleting === item.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-2">
                    <span className="font-medium text-gray-700 truncate max-w-[200px]">{item.user_email}</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-xs">{formatDate(item.created_at)}</span>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
