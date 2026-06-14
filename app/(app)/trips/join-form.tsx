'use client'

import { useState } from 'react'
import { AlertCircle } from 'lucide-react'

import { joinTrip } from './actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function JoinTripForm() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="p-6 bg-card rounded-xl border">
      <h2 className="text-xl font-semibold mb-2">Join a Trip</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Enter an invite code to join an existing trip
      </p>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Couldn't join trip</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <form className="flex gap-2">
        <input
          name="inviteCode"
          placeholder="Enter invite code"
          required
          className="flex-1 border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button
          formAction={async (formData) => {
            setError(null)
            const result = await joinTrip(formData)
            if (result?.error) setError(result.error)
          }}
        >
          Join
        </Button>
      </form>
    </div>
  )
}
