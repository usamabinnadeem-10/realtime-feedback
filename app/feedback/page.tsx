import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FeedbackForm from '@/components/FeedbackForm'
import FeedbackList from '@/components/FeedbackList'
import Navbar from '@/components/Navbar'

export default async function FeedbackPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: feedback } = await supabase
    .from('feedback')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navbar user={user} />

      {/* Header Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">
                Feedback Dashboard
              </h1>
              <p className="text-blue-100 text-lg">
                Share your ideas and collaborate with your team
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Live</span>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Sidebar - Feedback Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <FeedbackForm
                userId={user.id}
                userEmail={user.email!}
              />
            </div>
          </div>

          {/* Main Content - Feedback List */}
          <div className="lg:col-span-2">
            <FeedbackList
              initialFeedback={feedback || []}
              currentUserId={user.id}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
