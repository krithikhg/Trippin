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

  if (!title || !category || !startTime || !endTime) {
    return { error: 'Please fill in all required fields' }
  }

  if (new Date(endTime) <= new Date(startTime)) {
    return { error: 'End date & time must be after start date & time' }
  }

  const { error } = await supabase
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
      status: 'confirmed',
    })

  if (error) return { error: error.message }

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