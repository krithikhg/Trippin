'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

type Profile = {
  id: string
  display_name: string
} //define a profile struct to use for this file

export function AddMemberForm({ tripId }: { tripId: string }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [message, setMessage] = useState<string | null>(null)

  const supabase = createClient()

  async function searchProfiles(search: string) {
    if (!search.trim()) { //if input is empty or just whitespace don't proceed with search, just clear current results
      setResults([])
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('id, display_name')
      .ilike('display_name', `%${search}%`) // searches for users in database with display names containing the search string, case insensitive
      .limit(10)

    setResults(data ?? []) //??[] handles null data
  }

  async function addMember(profile: Profile) {
    const { error } = await supabase
      .from('trip_members')
      .insert({ trip_id: tripId, user_id: profile.id })
    if (error) {
      setMessage(error.message)
    } else {
      setMessage(`Added ${profile.display_name} to the trip!`)
      setResults([]) //clears search results when you add a member
      setQuery('')
    }
    setTimeout(() => setMessage(null), 5000) //dismisses the message shown after 5 seconds
  }

  return (
    <div className="p-4 bg-card rounded-xl border">
      <h3 className="text-lg font-semibold mb-3">Add Member</h3>
      <input
        type="text"
        placeholder="Search by name"
        value={query}
        onChange={(e) => { // each keystroke input event is recorded as e
          setQuery(e.target.value)
          searchProfiles(e.target.value) // call searchProfiles() on every keystroke input from the user
        }}
        className='w-full border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring'
      />
      {message && (
        <p className='mt-2 text-sm text-green'>{message}</p>
      )}
      {results.length > 0 && (
        <div className='mt-2 space-y-1'>
          {results.map((profile) => (
            <div
              key={profile.id}
              className='flex justify-between items-center p-2 rounded-md hover:bg-muted transition'
            >
              <span>{profile.display_name}</span>
              <Button
                size="sm"
                onClick={() => addMember(profile)}
              >
                Add
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

