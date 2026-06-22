'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export async function createTrip(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const destination = formData.get('destination') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string
  const budgetStr = formData.get('budget') as string
  const currency = formData.get('currency') as string

  const inviteCode = crypto.randomBytes(4).toString('hex')

  const { data: trip, error } = await supabase.from('trips')
    .insert({
      name,
      destination,
      start_date: startDate,
      end_date: endDate,
      budget_target: budgetStr ? parseFloat(budgetStr) : null,
      currency,
      created_by: user.id,
      invite_code: inviteCode
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  const { error: memberError } = await supabase
    .from('trip_members')
    .insert({ trip_id: trip.id, user_id: user.id })

  if (memberError) return { error: memberError.message }

  revalidatePath('/trips')
  redirect('/trips')
}

export async function joinTrip(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const inviteCode = formData.get('inviteCode') as string

  const { data: tripId, error: lookupError } = await supabase
    .rpc('get_trip_id_by_invite_code', { code: inviteCode })

  if (lookupError || !tripId) {
    return { error: 'Invite code is not valid: trip does not exist' }
  }

  const { data: existing } = await supabase
    .from('trip_members')
    .select('id')
    .eq('trip_id', tripId)
    .eq('user_id', user.id)
    .is('left_at', null)
    .maybeSingle()

  if (existing) return { error: 'You are already a member of this trip!' }

  const { error } = await supabase
    .from('trip_members')
    .insert({ trip_id: tripId, user_id: user.id })
  if (error) return { error: error.message }

  revalidatePath('/trips')
  redirect('/trips')
}

export async function leaveTrip(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const tripId = formData.get('tripId') as string

  await supabase
    .from('trip_members')
    .update({ left_at: new Date().toISOString() })
    .eq('trip_id', tripId)
    .eq('user_id', user.id)

  revalidatePath('/trips')
  redirect('/trips')
}




