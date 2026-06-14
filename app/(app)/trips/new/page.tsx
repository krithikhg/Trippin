'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

import { createTrip } from '../actions'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function CreateTripPage() {
  const [error, setError] = useState<string | null>(null)

  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-4xl font-serif italic text-heading">
            Create a New Trip
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className='h-4 w-4' />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-heading">
                Trip Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="destination" className="text-sm font-medium text-heading">
                Desination
              </label>
              <input
                id="destination"
                name="destination"
                type="text"
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="startDate" className="text-sm font-medium text-heading">
                Start Date
              </label>
              <input
                id="startDate"
                name="start_date"
                type="text"
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="endDate" className="text-sm font-medium text-heading">
                End Date
              </label>
              <input
                id="endDate"
                name="end_date"
                type="text"
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="budget" className="text-sm font-medium text-heading">
                Budget
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                step="0.01"
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="currency" className="text-sm font-medium text-heading">
                Currency
              </label>
              <input
                id="currency"
                name="currency"
                type="text"
                defaultValue="SGD"
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2 mt-2">
              <Button
                formAction={async (formData) => {
                  setError(null)
                  const result = await createTrip(formData)
                  if (result?.error) setError(result.error)
                }}
                className="w-full"
              >
                Create Trip
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="trips">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}


