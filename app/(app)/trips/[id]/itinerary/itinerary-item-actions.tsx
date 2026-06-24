'use client'

import { Ellipsis } from 'lucide-react'
import { useState, useTransition } from 'react'
import { EditItineraryItem } from './edit-itinerary-item'
import { deleteItineraryItem } from './actions'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

type ItineraryItem = {
  id: string
  title: string
  category: string
  start_time: string
  end_time: string
  location: string | null
  description: string | null
}

export function ItineraryItemActions({ item, tripId }: { item: ItineraryItem, tripId: string }) {
  const [isPending, startTransition] = useTransition()
  const [editOpen, setEditOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground ml-auto shrink-0 px-2">
            <Ellipsis className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            Edit itinerary
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => startTransition(() => deleteItineraryItem(item.id, tripId))}
            disabled={isPending}
            className="text-destructive focus:text-destructive"
          >
            {isPending ? 'Deleting...' : 'Delete itinerary'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditItineraryItem
        item={item}
        tripId={tripId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  )
}