'use client'

import { useState } from 'react'
import { AlertCircle, Plus, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'

import { createTrip } from './actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CurrencyCombobox } from './currency-combobox'
import { cn } from '@/lib/utils'

export function CreateTrip() {
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [currency, setCurrency] = useState('SGD')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size = "lg" className="hover:bg-primary/90">
          <Plus className="h-4 w-4" />
          Create Trip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="py-4">
          <DialogTitle className="text-3xl text-center font-serif">
            Create a New Trip
          </DialogTitle>
          <DialogDescription className="text-center">
            Fill in the trip details to create a new trip.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
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
              Destination
            </label>
            <input
              id="destination"
              name="destination"
              type="text"
              required
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-heading">Start Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="startDate"
                value={startDate ? format(startDate, 'yyyy-MM-dd') : ''}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-heading">End Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                  />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="endDate"
                value={endDate ? format(endDate, 'yyyy-MM-dd') : ''}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="budget" className="text-sm font-medium text-heading">
                Budget (Optional)
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                step="1"
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading"> Currency </label>
            <CurrencyCombobox value={currency} onChange={setCurrency} />
            <input type="hidden" name="currency" value={currency} />
            </div>
          </div>

          <Button
            formAction={async (formData) => {
              setError(null)
              const result = await createTrip(formData)
              if (result?.error) setError(result.error)
            }}
            className="w-full mt-2"
          >
            Create Trip
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}