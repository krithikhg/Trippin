"use client";

import { useState } from 'react'
import { AlertCircle, UsersRound } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import { joinTrip } from './actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

export function JoinTripForm() {
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size = "lg" className="border-primary text-primary hover:text-primary">
          <UsersRound className="h-4 w-4" />
          Join Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="py-4">
          <DialogTitle className="text-3xl text-center font-serif">
            Join a Trip
          </DialogTitle>
          <DialogDescription className="text-center">
            Enter an invite code to join an existing trip.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Couldn't join trip</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="flex flex-col gap-3 pb-4">
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
      </DialogContent>
    </Dialog>
  )
}
