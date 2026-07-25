'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createItineraryItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const tripId = formData.get('tripId') as string
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const location = formData.get('location') as string | null
  const description = formData.get('description') as string | null
  const enablePoll = formData.get('enablePoll') === 'true'
  const yesVotesNeeded = parseInt(formData.get('yesVotesNeeded') as string, 10)

  if (!title || !category || !startTime || !endTime) {
    return { error: 'Please fill in all required fields' }
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return { error: 'End date & time must be after start date & time' }
  }

  if (enablePoll && (!yesVotesNeeded || yesVotesNeeded < 1)) {
    return { error: 'Please set how many yes votes are needed' }
  }

  const { data: item, error } = await supabase
    .from('itinerary_items')
    .insert({
      trip_id: tripId,
      title,
      category,
      start_time: startTime,
      end_time: endTime,
      location: location || null,
      description: description || null,
      created_by: user.id,
      status: enablePoll ? 'pending_poll' : 'confirmed',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  if (enablePoll) {
    const { error: pollError } = await supabase
      .from('polls')
      .insert({
        itinerary_item_id: item.id,
        created_by: user.id,
        yes_votes_needed: yesVotesNeeded,
      })

    if (pollError) return { error: pollError.message }
  }

  revalidatePath(`/trips/${tripId}/itinerary`)
}

export async function deleteItineraryItem(itemId: string, tripId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('id', itemId)

  if (error) throw new Error(error.message)

  revalidatePath(`/trips/${tripId}/itinerary`)
}

export async function updateItineraryItem(itemId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const tripId = formData.get('tripId') as string
  const title = formData.get('title') as string
  const category = formData.get('category') as string
  const startTime = formData.get('startTime') as string
  const endTime = formData.get('endTime') as string
  const location = formData.get('location') as string | null
  const description = formData.get('description') as string | null

  if (!title || !category || !startTime || !endTime) {
    return { error: 'Please fill in all required fields' }
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return { error: 'End date & time must be after start date & time' }
  }

  const { error } = await supabase
    .from('itinerary_items')
    .update({
      title,
      category,
      start_time: startTime,
      end_time: endTime,
      location: location || null,
      description: description || null,
    })
    .eq('id', itemId)

  if (error) return { error: error.message }

  revalidatePath(`/trips/${tripId}/itinerary`)
}

export async function clearItinerary(tripId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: membership } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle()

  if (!membership) {
    return { error: 'Only active trip members can clear the itinerary.' }
  }

  const { error } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('trip_id', tripId)

  if (error) return { error: error.message }

  revalidatePath(`/trips/${tripId}/itinerary`)
  return { success: true }
}