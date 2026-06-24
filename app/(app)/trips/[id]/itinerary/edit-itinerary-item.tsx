'use client'

import { useState } from 'react'
import { AlertCircle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { updateItineraryItem } from './actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const CATEGORIES = [
  { value: 'food', label: 'Food & Drinks' },
  { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'others', label: 'Others' },
]

type ItineraryItem = {
  id: string
  title: string
  category: string
  start_time: string
  end_time: string
  location: string | null
  description: string | null
}

type Props = {
  item: ItineraryItem
  tripId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditItineraryItem({ item, tripId, open, onOpenChange }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(item.start_time))
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(item.end_time))
  const [startTime, setStartTime] = useState(format(new Date(item.start_time), 'HH:mm'))
  const [endTime, setEndTime] = useState(format(new Date(item.end_time), 'HH:mm'))

  const startDateTime = startDate && startTime
    ? `${format(startDate, 'yyyy-MM-dd')}T${startTime}:00`
    : ''

  const endDateTime = endDate && endTime
    ? `${format(endDate, 'yyyy-MM-dd')}T${endTime}:00`
    : ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="py-4">
          <DialogTitle className="text-2xl font-bold font-serif text-center">
            Edit itinerary item
          </DialogTitle>
          <DialogDescription className="text-center">
            Update the details of this itinerary item.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form className="flex flex-col gap-4 pb-4">
          <input type="hidden" name="tripId" value={tripId} />

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              name="title"
              type="text"
              defaultValue={item.title}
              required
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Category */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              name="category"
              required
              defaultValue={item.category}
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Start date & time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-heading">
                Start date & time <span className="text-destructive">*</span>
              </label>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('justify-start text-left font-normal', !startDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <input type="hidden" name="startTime" value={startDateTime} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-heading">
                End date & time <span className="text-destructive">*</span>
              </label>
              <Popover modal>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn('justify-start text-left font-normal', !endDate && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Select date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              />
              <input type="hidden" name="endTime" value={endDateTime} />
              <p className="text-xs text-muted-foreground">
                Must be after the start date and time
              </p>
            </div>
          </div>

          {/* Location */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">Location</label>
            <input
              name="location"
              type="text"
              defaultValue={item.location ?? ''}
              placeholder="e.g. La Brisa Beach Club, Canggu (optional)"
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">Description</label>
            <textarea
              name="description"
              defaultValue={item.description ?? ''}
              placeholder="Add any details, notes, or important information (optional)"
              rows={3}
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              formAction={async (formData) => {
                setError(null)
                const result = await updateItineraryItem(item.id, formData)
                if (result?.error) {
                  setError(result.error)
                } else {
                  onOpenChange(false)
                }
              }}
            >
              Update item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}