"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Ellipsis } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { clearItinerary } from "./actions";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ItineraryItem = {
  id: string;
  title: string;
  category: string;
  start_time: string;
  end_time: string;
  location: string | null;
  description: string | null;
};

interface Props {
  tripId: string;
  tripName: string;
  itineraryItems: ItineraryItem[];
}

export function ItineraryOptionsMenu({
  tripId,
  tripName,
  itineraryItems,
}: Props) {
  const router = useRouter();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  function handleExportPdf() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text(`${tripName} — Itinerary`, 14, 20);

    const sorted = [...itineraryItems].sort(
      (a, b) =>
        new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );

    const rows = sorted.map((item) => {
      const start = new Date(item.start_time);
      const end = new Date(item.end_time);
      const dateLabel = start.toLocaleDateString("en-SG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      const timeLabel = `${start.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit", hour12: true })} - ${end.toLocaleTimeString("en-SG", { hour: "numeric", minute: "2-digit", hour12: true })}`;

      return [
        dateLabel,
        timeLabel,
        item.title,
        item.category,
        item.location ?? "—",
        item.description ?? "—",
      ];
    });

    autoTable(doc, {
      startY: 28,
      head: [["Date", "Time", "Title", "Category", "Location", "Description"]],
      body: rows,
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [35, 150, 173] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 30 },
        2: { cellWidth: 28 },
        3: { cellWidth: 22 },
        4: { cellWidth: 28 },
        5: { cellWidth: "auto" },
      },
    });

    if (itineraryItems.length === 0) {
      doc.setFontSize(11);
      doc.text("No itinerary items planned yet.", 14, 35);
    }

    doc.save(`${tripName.replace(/\s+/g, "_")}_itinerary.pdf`);
  }

  async function handleClearItinerary() {
    setIsClearing(true);
    try {
      const result = await clearItinerary(tripId);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Itinerary cleared");
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsClearing(false);
      setClearDialogOpen(false);
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
          <DropdownMenuItem onClick={handleExportPdf}>
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setClearDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            Clear Itinerary
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif text-xl font-semibold text-center">
              Clear Itinerary?
            </DialogTitle>
            <DialogDescription>
              This will permanently delete all itinerary items in this trip.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Button
            variant="destructive"
            onClick={handleClearItinerary}
            disabled={isClearing}
          >
            {isClearing ? "Clearing..." : "Yes, clear itinerary"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}