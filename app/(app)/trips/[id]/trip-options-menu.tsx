"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { leaveTrip, deleteTrip } from "./actions";

interface Props {
  tripId: string;
  tripName: string;
}

export function TripOptionsMenu({ tripId, tripName }: Props) {
  const router = useRouter();

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleLeaveTrip() {
    setIsLeaving(true);
    try {
      const result = await leaveTrip(tripId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`You left ${tripName}`);
      router.push("/trips");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsLeaving(false);
      setLeaveDialogOpen(false);
    }
  }

  async function handleDeleteTrip() {
    setIsDeleting(true);
    try {
      const result = await deleteTrip(tripId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`${tripName} deleted`);
      router.push("/trips");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <Ellipsis className="h-5 w-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLeaveDialogOpen(true)}>
            Leave Trip
          </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive focus:text-destructive"
            >
              Delete Trip
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Leave Trip confirmation */}
      <Dialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-semibold text-center">Leave {tripName}?</DialogTitle>
            <DialogDescription>
              You'll be removed from this trip. You can rejoin later with the
              invite code if you change your mind.
            </DialogDescription>
          </DialogHeader>
            <Button
              variant="destructive"
              onClick={handleLeaveTrip}
              disabled={isLeaving}
            >
              {isLeaving ? "Leaving..." : "Yes, leave trip"}
            </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Trip confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-semibold text-center">Delete {tripName}?</DialogTitle>
            <DialogDescription>
              This will permanently delete the trip and all its itinerary
              items, expenses, and settlements for every member. This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
            <Button
              variant="destructive"
              onClick={handleDeleteTrip}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete trip"}
            </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}