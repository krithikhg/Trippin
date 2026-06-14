import { createClient } from "@utils/supabase/server"
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { JoinTripForm } from './join-form'

export default async function TripsPage() {
  const supabase = await createClient()
  const { Data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: membershpis } = await supabase
    .from('trip_members')
    .select('left_at, trips(*)')
    .eq('user_id', user.id)
    .is('left_at', null)

  const trips = memberships?.map(m => m.trips) ?? []

  return (
    <div>
      <div classname="flex justify-between iterm-center bm-6">
        <h1 classname="text-4xl font-serif italic text-heading">MyTrips</h1>
        <Link href="/trips/new">
          <Button><Plus className="h-4 w'f" />CreateTrip</Button>
        </Link>
      </div>
      {trips.length == 0 ? (
        <p className="text-muted-foreground">You haven't joined any trips yet</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map(trip => (
            <Card key={trip.id}>
              <CardHeader>
                <CardTitle>{trip.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{trip.destination}</p>
                <p>{trip.start_date} - {trip.end_date}</p>
                <p classname="text-xs text-muted-foreground mt-2">
                  Invite code: <code className="bg-muted px-1 rounded">{trip.invite_code}</code>
                </p>
                <Link href={`/trips/${trip.id}`}>
                  <Button variant="outline" size="sm" className="mt-3">
                    View Trip
                  </Button>
                </Link>
                <form action={leaveTrip} className="inline ml-2">
                  <input type="hidden" name="tripId" value={trip.id} />
                  <Button type="submit" variant="ghost" size="sm" className="text-destructive">
                    Leave
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )
      }
      <div classname="mt-8">
        <JoinTripForm />
      </div>
    </div>
  )
}
