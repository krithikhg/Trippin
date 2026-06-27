import { createClient } from "@/utils/supabase/server"
import { JoinTripForm } from './join-form'
import { getTripStatus } from '@/lib/trips/helpers'
import { TripsTabs } from './trips-tabs'
import { CreateTrip } from './create-trip'

type TripRow = {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  invite_code: string
  trip_members: { left_at: string | null }[]
}

type MembershipRow = {
  left_at: string | null
  trips: TripRow
}

export default async function TripsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: memberships } = await supabase
        .from("trip_members")
        .select(
            `left_at,
      trips(*, trip_members(left_at))`,
        )
        .eq("user_id", user.id)
        .is("left_at", null)
        .returns<MembershipRow[]>();

    const trips =
        memberships?.map((m) => {
            const trip = m.trips;
            const memberCount = trip.trip_members.filter(
                (tm: { left_at: string | null }) => tm.left_at == null,
            ).length;
            return { ...trip, memberCount };
        }) ?? [];

  const { data: memberships } = await supabase
    .from('trip_members')
    .select(`left_at,
      trips(*, trip_members(left_at))`)
    .eq('user_id', user.id)
    .is('left_at', null)
    .returns<MembershipRow[]>()

  const trips = memberships?.map(m => {
    const trip = m.trips
    const memberCount = trip.trip_members.filter(
      (tm: { left_at: string | null }) => tm.left_at == null).length
    return { ...trip, memberCount }
  }) ?? []

  const activeTrips = trips.filter(trip => {
    const status = getTripStatus(trip.start_date, trip.end_date)
    return status === 'ongoing' || status === 'upcoming'
  })

  const completedTrips = trips.filter(trip => {
    const status = getTripStatus(trip.start_date, trip.end_date)
    return status === 'completed'
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-serif italic text-heading">My Trips</h1>
        <div className="flex flex-col gap-2">
          <CreateTrip />
          <JoinTripForm />
        </div>
      </div>
      {trips.length === 0 ? (
        <p className="text-muted-foreground">You haven't joined any trips yet</p>
      ) : (
        <TripsTabs activeTrips={activeTrips} completedTrips={completedTrips} />
      )}
    </div>
  )
}
