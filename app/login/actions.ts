'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function friendlyError(message: string): string {
  const lower = message.toLowerCase()

  if (lower.includes('already registered') || lower.includes('user already exists')) {
    return 'An account with this email already exists. Try logging in instead.'
  }
  if (lower.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.'
  }
  if (lower.includes('password') && lower.includes('characters')) {
    return 'Password must be at least 6 characters long.'
  }
  if (lower.includes('email') && lower.includes('confirm')) {
    return 'Please check your inbox to confirm your email address.'
  }
  if (lower.includes('invalid') && lower.includes('email')) {
    return 'Please enter a valid email address.'
  }
  return message
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: friendlyError(error.message) }
  }

  revalidatePath('/', 'layout')
  redirect('/private')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return { error: friendlyError(error.message) }
  }

  revalidatePath('/', 'layout')
  redirect('/private')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
