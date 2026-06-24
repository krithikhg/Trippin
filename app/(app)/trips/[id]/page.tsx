import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AddMemberForm } from './add-member-form'
import { ChevronRight, ArrowLeft } from 'lucide-react'

type Params = Promise<{ id: string }>

export default async function TripDetailPage({ params }: { params: Params }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: trip } = await supabase
    .from('trips')
    .select(`
      *,
      trip_members(
        *,
        profiles(id, display_name, avatar_url)
      )
    `) // select all columns from trips, and expand trip_members using its key as well, expand profiles and select id, display name and avatar url columns from that
    .eq('id', id)
    .single()

  if (!trip) notFound()

  const { data: itineraryItems } = await supabase
  .from('itinerary_items')
  .select('id, title, description, start_time, end_time')
  .eq('trip_id', id)
  .eq('status', 'confirmed')
  .order('start_time', { ascending: true })
  .limit(5)

  const activeMembers = trip.trip_members?.filter(
    (m: { left_at: string | null }) => m.left_at == null
  ) ?? []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/trips" className="text-sm text-muted-foreground hover:underline flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" /> Back to My Trips
          </Link>
          <h1 className="text-4xl font-serif italic text-heading mt-1">
            {trip.name}
          </h1>
        </div>
        <p className='text-xs text-muted-foreground bg-muted px-2 py-1 rounded'>
          Invite code: {trip.invite_code}
        </p>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mb-8'>
        <div className='p-4 bg-card rounded-xl border'>
          <p className='text-sm text-muted-foreground'>Destination</p>
          <p className='text-lg font-semibold'>{trip.destination}</p>
        </div>
        <div className='p-4 bg-card rounded-xl border'>
          <p className="text-sm text-muted-foreground">Dates</p>
          <p className="text-lg font-semibold">{trip.start_date} - {trip.end_date}</p>
        </div>
          <div className='p-4 bg-card rounded-xl border'>
            <h2 className='text-lg font-semibold mb-3'>Itinerary</h2>
            {!itineraryItems || itineraryItems.length === 0 ? (
              <p className='text-sm text-muted-foreground mb-3'>No itinerary items yet.</p>
            ) : (
              <div className='space-y-2 mb-3'>
                {itineraryItems.map((item) => {
                  const dayNumber = Math.floor(
                    (new Date(item.start_time).setHours(0,0,0,0) - new Date(trip.start_date).setHours(0,0,0,0)) 
                    / (1000 * 60 * 60 * 24)
                  ) + 1
                  const dateLabel = new Date(item.start_time).toLocaleDateString('en-SG', {
                    day: 'numeric',
                    month: 'short',
                    weekday: 'short',
                  })
                  return (
                    <div key={item.id} className='flex items-center justify-between py-2 border-b border-border last:border-0'>
                      <div className='flex items-start gap-4'>
                        <div className='text-xs text-muted-foreground w-24 shrink-0'>
                          <p className='font-medium text-heading'>Day {dayNumber}</p>
                          <p>{dateLabel}</p>
                        </div>
                          <span className='text-xs text-muted-foreground w-40 shrink-0'>
                            {new Date(item.start_time).toLocaleTimeString('en-SG', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                            {' - '}
                            {new Date(item.end_time).toLocaleTimeString('en-SG', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            })}
                          </span>
                        <div>
                          <p className='font-semibold text-sm'>{item.title}</p>
                          {item.description && (
                            <p className='text-xs text-muted-foreground'>{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Link
              href={`/trips/${id}/itinerary`}
              className='text-sm text-primary font-medium hover:underline flex items-center gap-1'
            >
              View full itinerary <ChevronRight className='h-4 w-4' />
            </Link>
          </div>
        {trip.budget_target && (
          <div className='p-4 bg-card rounded-xl border'>
            <p className='text-sm text-muted-foreground'>Budget</p>
            <p className='text-lg font-semibold'>{trip.currency} {trip.budget_target}</p>
          </div>
        )}

        <div className="mb-8">
          <div className='flex justify-between items-center mb-4'>
            <h2 className="text-2xl font-serif italic text-heading">
              Members ({activeMembers.length})
            </h2>
          </div>
          <div className='space-y-2'>
            {activeMembers.map((member: any) => (
              <div key={member.id} className="flex justify-between items-center p-3 bg-card rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-foreground flex items-center justify-center text-xs font-semibold">
                    {member.profiles.display_name
                      ?.split(' ')
                      .map((p: string) => p[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() ?? '?'
                    }
                  </div>
                  <div>
                    <p className='font-medium'>{member.profiles.display_name}</p>
                    <p className='text-xs text-muted-foreground'>
                      Joined {new Date(member.joined_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <AddMemberForm tripId={id} />
      </div>
    </div>
  )


}
