'use client'

import { useState, useTransition } from 'react'
import { Check, X, Lock } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { castVote, closePoll } from './poll-actions'

type PollItem = {
  itineraryItemId: string
  title: string
  description: string | null
  startTime: string
  endTime: string
  pollId: string
  createdBy: string
  yesVotesNeeded: number
  yesCount: number
  noCount: number
  totalMembers: number
  myVote: boolean | null
}

export function PollList({
  tripId,
  polls,
  currentUserId,
}: {
  tripId: string
  polls: PollItem[]
  currentUserId: string
}) {
  const [isPending, startTransition] = useTransition()
  const [closingId, setClosingId] = useState<string | null>(null)

  if (polls.length === 0) return null

  function handleVote(pollId: string, vote: boolean) {
    startTransition(async () => {
      const result = await castVote(pollId, tripId, vote)
      if (result?.error) toast.error(result.error)
    })
  }

  async function handleClose(pollId: string) {
    setClosingId(pollId)
    try {
      const result = await closePoll(pollId, tripId)
      if (result?.error) {
        toast.error(result.error)
        return
      }
      if (result?.passed) {
        toast.success('Poll passed — item confirmed!')
        } else {
          toast.error('Poll failed — item removed.')
        }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setClosingId(null)
    }
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-serif font-bold text-heading">Proposed Polls</h2>
      <p className="text-sm text-muted-foreground mt-1 mb-4">
        Vote on proposed itinerary items. Items will be added to the itinerary once they pass the threshold.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {polls.map((poll) => {
          const votedCount = poll.yesCount + poll.noCount
            const startDate = new Date(poll.startTime)
            const endDate = new Date(poll.endTime)
            const dateLabel = startDate.toLocaleDateString('en-SG', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
            })
            const startTimeLabel = startDate.toLocaleTimeString('en-SG', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })
            const endTimeLabel = endDate.toLocaleTimeString('en-SG', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })
            const timeLabel = `${startTimeLabel} - ${endTimeLabel}`
          const isCreator = poll.createdBy === currentUserId

          return (
            <Card key={poll.pollId}>
             <CardContent className="px-4 py-2">
                <div className="flex items-start justify-between mb-1">
                  <p className="text-lg font-semibold text-heading">{poll.title}</p>
                </div>
                {poll.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {poll.description}
                  </p>
                )}
                <div className="text-sm text-muted-foreground mb-3 space-y-0.5">
                  <p>{dateLabel}</p>
                  <p>{timeLabel}</p>
                </div>

                <p className="text-sm text-muted-foreground mb-1">
                  {votedCount} of {poll.totalMembers} voted · Need{' '}
                  {poll.yesVotesNeeded} yes votes to pass
                </p>

                <div className="relative h-2 w-full bg-muted rounded-full overflow-hidden mb-2">
                    <div
                        className="absolute left-0 top-0 h-full bg-green transition-all"
                        style={{ width: `${(poll.yesCount / poll.totalMembers) * 100}%` }}
                    />
                    <div
                        className="absolute right-0 top-0 h-full bg-destructive transition-all"
                        style={{ width: `${(poll.noCount / poll.totalMembers) * 100}%` }}
                    />
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-green font-medium">{poll.yesCount} yes</span>
                  <span className="text-destructive font-medium">{poll.noCount} no</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={poll.myVote === true ? 'default' : 'outline'}
                    className={
                      poll.myVote === true
                        ? 'bg-green hover:bg-green/90 text-white'
                        : 'border-green/40 text-green hover:bg-green/10'
                    }
                    disabled={isPending}
                    onClick={() => handleVote(poll.pollId, true)}
                  >
                    <Check className="h-4 w-4" /> Yes
                  </Button>
                  <Button
                    type="button"
                    variant={poll.myVote === false ? 'destructive' : 'outline'}
                    className={
                      poll.myVote === false
                        ? ''
                        : 'border-destructive/40 text-destructive hover:bg-destructive/10'
                    }
                    disabled={isPending}
                    onClick={() => handleVote(poll.pollId, false)}
                  >
                    <X className="h-4 w-4" /> No
                  </Button>
                </div>

                {isCreator && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={closingId === poll.pollId}
                      onClick={() => handleClose(poll.pollId)}
                    >
                      <Lock className="h-3 w-3" />
                      {closingId === poll.pollId ? 'Closing...' : 'Close poll'}
                    </Button>
                    <span className="text-xs text-muted-foreground">Creator only</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}