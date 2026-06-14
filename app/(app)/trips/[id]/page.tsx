import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AddMemberForm } from './add-member-form'
import { create } from 'domain'

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

  const activeMembers = trip.trip_members?.filter(
    (m: { left_at: string | null }) => m.left_at == null
  ) ?? []

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Link href="/trips" className="text-sm text-muted-foreground hover:underline">
            <- Back to My Trips
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
          <p className='text-sm text-muted-foreground'>Desination</p>
          <p className='text-lg font-semibold'>{trip.desination}</p>
        </div>
        <div className='p-4 bg-card rounded-xl border'>
          <p className="text-sm text-muted-foreground">Dates</p>
          <p classname="text-lg font-semibold">{trip.start_date} - {trip.end_date}</p>
        </div>
        {trip.budget_target && (
          <div className='p-4 bg-card rounded-xl border'>
            <p className='text-sm text-muted-foreground'>Budget</p>
            <p className='text-lg font-semibold'>{trip.currency trip.budget_target}</p>
          </div>
        )}
        <div className="mb-8">
          <div className='flex justify-between items-center mb-4'>
            <h2 className="text-2xl font-serif italic text-heading">
              Members ({activeMembers.length})
            </h2>
          </div>
          <div className='space-y-2'>
            {activeMembers.map((member) => (
              <div key={member.id} className="flex justify-between items-center p-3 bg-card rounded-xl border">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-foregroundflex items-center justify-center text-xs font-semibold">
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
