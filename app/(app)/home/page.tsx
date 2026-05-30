import { createClient } from '@/utils/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div>
      <h1 className="text-4xl font-serif italic text-heading mb-2">
        Welcome back, {user?.email?.split('@')[0]}! 
      </h1>
      <p className="text-muted-foreground mb-8">
        Let&apos;s make this trip unforgettable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-card rounded-xl border">
          <h2 className="text-xl font-semibold mb-2">Upcoming Trips</h2>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
        <div className="p-6 bg-card rounded-xl border">
          <h2 className="text-xl font-semibold mb-2">Budget Overview</h2>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
        <div className="p-6 bg-card rounded-xl border">
          <h2 className="text-xl font-semibold mb-2">Recent Activity</h2>
          <p className="text-muted-foreground">Coming soon</p>
        </div>
      </div>
    </div>
  )
}