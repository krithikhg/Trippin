'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

function errorMsg(code: string | undefined, message: string): string {
  switch (code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists.\nTry logging in instead.'

    case 'invalid_credentials':
      return 'Incorrect email or password. Please try again.'

    case 'weak_password':
      return 'Password must be at least 6 characters long.'

    case 'email_not_confirmed':
      return 'Please check your inbox to confirm your email address.'

    case 'validation_failed':
      return 'Please enter a valid email and password.'

    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a moment before trying again.'

    case 'signup_disabled':
      return 'New sign-ups are currently disabled.'

    case 'user_not_found':
      return 'No account is linked to this email. Try signing up instead.'
    
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a moment before trying again.'

    case 'request_timeout':
      return 'The request took too long. Please try again.'
    
    case 'unexpected_failure':
      return 'Something went wrong on our end. Please try again in a moment.'

    default:
      return message
  }
}

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: errorMsg(error.code, error.message) }
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
    return { error: errorMsg(error.code, error.message) }
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

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/reset-password`,
  })

  if (error) {
    return { error: errorMsg(error.code, error.message) }
  }

  return { success: 'Check your email for a password reset link.' }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: errorMsg(error.code, error.message) }
  }

  revalidatePath('/', 'layout')
  redirect('/private')
}