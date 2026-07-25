'use client'

import { useState, useRef } from 'react'
import { Plus, Minus, AlertCircle, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { createItineraryItem } from './actions'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'

const CATEGORIES = [
  { value: 'food', label: 'Food & Drinks' },
  { value: 'transport', label: 'Transport' },
  { value: 'activity', label: 'Activity' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'others', label: 'Others' },
]

export function AddItineraryItem({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [enablePoll, setEnablePoll] = useState(false)
  const [yesVotesNeeded, setYesVotesNeeded] = useState(1)
  const formRef = useRef<HTMLFormElement>(null)

  const startDateTime = startDate && startTime
    ? `${format(startDate, 'yyyy-MM-dd')}T${startTime}:00`
    : ''

  const endDateTime = endDate && endTime
    ? `${format(endDate, 'yyyy-MM-dd')}T${endTime}:00`
    : ''

  function resetForm() {
    setError(null)
    setStartDate(undefined)
    setEndDate(undefined)
    setStartTime('')
    setEndTime('')
    setEnablePoll(false)
    setYesVotesNeeded(1)
    formRef.current?.reset()
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      resetForm()
    }
    setOpen(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="h-4 w-4" />
          Add itinerary item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="py-4">
          <DialogTitle className="text-2xl font-bold font-serif text-center">
            Add itinerary item
          </DialogTitle>
          <DialogDescription className="text-center">
            Add a new item to your trip schedule.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form ref={formRef} className="flex flex-col gap-4 pb-4">
          <input type="hidden" name="tripId" value={tripId} />
          <input type="hidden" name="enablePoll" value={enablePoll ? 'true' : 'false'} />
          <input type="hidden" name="yesVotesNeeded" value={yesVotesNeeded} />

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              name="title"
              type="text"
              required
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">
              Category <span className="text-destructive">*</span>
            </label>
            <select
              name="category"
              required
              defaultValue=""
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

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">Location</label>
            <input
              name="location"
              type="text"
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-heading">Description</label>
            <textarea
              name="description"
              placeholder="Add any details, notes, or important information (optional)"
              rows={3}
              className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-y"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <label className="text-sm font-medium text-heading">Enable poll</label>
            <Switch checked={enablePoll} onCheckedChange={setEnablePoll} />
          </div>

          {enablePoll && (
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-heading">
                Yes votes needed to pass
              </label>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setYesVotesNeeded((n) => Math.max(1, n - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-semibold">
                  {yesVotesNeeded}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setYesVotesNeeded((n) => n + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <Button
              formAction={async (formData) => {
                setError(null)
                const result = await createItineraryItem(formData)
                if (result?.error) {
                  setError(result.error)
                } else {
                  setOpen(false)
                }
              }}
          >
            {enablePoll ? 'Create poll' : 'Add item'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}