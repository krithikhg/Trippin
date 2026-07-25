import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, UsersRound, ArrowLeft } from 'lucide-react'
import { getTripStatus, getStatusBadge, formatDateRange } from '@/lib/trips/helpers'
import { AddItineraryItem } from './add-itinerary-item'
import { ItineraryItemActions } from './itinerary-item-actions'
import { CopyInviteCode } from "../../copy-invite-code";

type Params = Promise<{ id: string }>

type ItineraryItem = {
    id: string
    title: string
    category: string
    start_time: string
    end_time: string
    location: string | null
    description: string | null
}

type TripWithMembers = {
  id: string
  name: string
  destination: string
  start_date: string
  end_date: string
  invite_code: string
  trip_members: { left_at: string | null }[]
}

export default async function ItineraryPage({ params }: { params: Params }) {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')

    const { data: trip } = await supabase
    .from('trips')
    .select('*, trip_members(left_at)')
    .eq('id', id)
    .single() as { data: TripWithMembers | null, error: unknown }

  if (!trip) notFound()

  const { data: items } = await supabase
    .from('itinerary_items')
    .select('id, title, category, start_time, end_time, location, description')
    .eq('trip_id', id)
    .eq('status', 'confirmed')
    .order('start_time', { ascending: true })

  const itineraryItems: ItineraryItem[] = items ?? []

  // Group itinerary items by date
  const itemsByDate = itineraryItems.reduce<Record<string, ItineraryItem[]>>((acc, item) => {
    const date = new Date(item.start_time).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(item)
    return acc
  }, {})
 
  const tripStart = new Date(trip.start_date + 'T00:00:00')
  tripStart.setHours(0, 0, 0, 0)
  const tripEnd = new Date(trip.end_date + 'T00:00:00')
  tripEnd.setHours(0, 0, 0, 0)

  const allTripDates: string[] = []
  const cursor = new Date(tripStart)
  while (cursor <= tripEnd) {
    allTripDates.push(cursor.toLocaleDateString('en-SG', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }))
    cursor.setDate(cursor.getDate() + 1)
  }

  const groupedByDate = allTripDates.reduce<Record<string, ItineraryItem[]>>((acc, date) => {
    acc[date] = itemsByDate[date] ?? []
    return acc
  }, {})

  const tripStatus = getTripStatus(trip.start_date, trip.end_date)
  const statusBadge = getStatusBadge(tripStatus)
  const memberCount = trip.trip_members.filter(m => m.left_at == null).length

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/trips/${id}`}
          className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-3"
        >
            <ArrowLeft className="h-4 w-4" /> Back to {trip.name}
        </Link>
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-serif font-semibold text-heading">{trip.name}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDateRange(trip.start_date, trip.end_date)}
              </span>
              <span className="h-4 w-px bg-border" />
              <span className="flex items-center gap-1">
                <UsersRound className="h-4 w-4" />
                {memberCount} members
              </span>
            </div>
            <div className="mt-2">
              <CopyInviteCode code={trip.invite_code} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AddItineraryItem tripId={id} />
          </div>
        </div>
      </div>

      {/* Itinerary Section */}
      <div className="mb-4">
        <h2 className="text-2xl font-serif font-bold text-heading">Full Itinerary</h2>
        <p className="text-sm text-muted-foreground mt-1">Plan and manage your trip schedule.</p>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByDate).map(([date, dayItems], index) => {
          const [day, month, year] = date.split('/')
          const itemDateLocal = new Date(`${year}-${month}-${day}T00:00:00`)
          const dayNumber = index + 1
          const dayLabel = itemDateLocal.toLocaleDateString('en-SG', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
          const weekday = itemDateLocal.toLocaleDateString('en-SG', {
            weekday: 'short',
          })

          return (
            <div key={date} className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Day Header */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-heading">Day {dayNumber}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground">
                    {dayLabel} ({weekday})
                  </span>
                </div>
              </div>

              {/* Day Items */}
              <div className="divide-y divide-border">
                {dayItems.length === 0 ? (
                  <p className="px-6 py-4 text-sm text-muted-foreground">
                    No itinerary planned yet.
                  </p>
                ) : (
                  dayItems.map((item) => {
                    const startLabel = new Date(item.start_time).toLocaleTimeString('en-SG', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                    const endLabel = new Date(item.end_time).toLocaleTimeString('en-SG', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })
                    const timeLabel = `${startLabel} - ${endLabel}`

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 px-6 h-12 hover:bg-muted/30 transition-colors"
                      >
                        <span className="text-sm text-muted-foreground w-40 shrink-0">
                          {timeLabel}
                        </span>
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <div className="w-80 shrink-0 min-w-0 overflow-hidden">
                          <span className="font-semibold text-sm text-heading">
                            {item.title}
                          </span>
                          {item.location && (
                            <span className="text-sm text-muted-foreground ml-3">
                              {item.location}
                            </span>
                          )}
                        </div>
                        {item.description && (
                        <span className="text-sm text-muted-foreground w-48 shrink-0 truncate hidden md:block">
                            {item.description}
                        </span>
                        )}
                        <ItineraryItemActions item={item} tripId={id} />
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}