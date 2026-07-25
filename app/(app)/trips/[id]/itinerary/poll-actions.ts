'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function castVote(pollId: string, tripId: string, vote: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('poll_votes')
    .upsert(
      { poll_id: pollId, user_id: user.id, vote, voted_at: new Date().toISOString() },
      { onConflict: 'poll_id,user_id' },
    )

  if (error) return { error: error.message }

  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}

export async function closePoll(pollId: string, tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: poll } = await supabase
    .from('polls')
    .select('id, itinerary_item_id, created_by, yes_votes_needed')
    .eq('id', pollId)
    .single()

  if (!poll) return { error: 'Poll not found' }
  if (poll.created_by !== user.id) {
    return { error: 'Only the poll creator can close this poll' }
  }

  const { count: yesCount } = await supabase
    .from('poll_votes')
    .select('id', { count: 'exact', head: true })
    .eq('poll_id', pollId)
    .eq('vote', true)

  const passed = (yesCount ?? 0) >= poll.yes_votes_needed

  const { error: pollError } = await supabase
    .from('polls')
    .update({
      status: passed ? 'closed_passed' : 'closed_failed',
      closed_at: new Date().toISOString(),
    })
    .eq('id', pollId)

  if (pollError) return { error: pollError.message }

  if (passed) {
    const { error: itemError } = await supabase
      .from('itinerary_items')
      .update({ status: 'confirmed' })
      .eq('id', poll.itinerary_item_id)

    if (itemError) return { error: itemError.message }
  } else {
    const { error: itemError } = await supabase
      .from('itinerary_items')
      .delete()
      .eq('id', poll.itinerary_item_id)

    if (itemError) return { error: itemError.message }
  }

  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true, passed }
}