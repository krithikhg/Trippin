"use client";

import { useState } from "react";
import { AlertCircle, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import { updateTrip } from "./actions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CurrencyCombobox } from "../currency-combobox";
import { cn } from "@/lib/utils";

interface Trip {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  budget_target: number | null;
  currency: string;
}

interface Props {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTripDetails({ trip, open, onOpenChange }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(trip.start_date + "T00:00:00"),
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(trip.end_date + "T00:00:00"),
  );
  const [currency, setCurrency] = useState(trip.currency);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="py-4">
          <DialogTitle className="text-3xl text-center font-serif">
            Edit Trip Details
          </DialogTitle>
          <DialogDescription className="text-center">
            Update the details for this trip!
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
              defaultValue={trip.name}
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
              defaultValue={trip.destination}
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
                      "justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="startDate"
                value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
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
                      "justify-start text-left font-normal",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} />
                </PopoverContent>
              </Popover>
              <input
                type="hidden"
                name="endDate"
                value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
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
                defaultValue={trip.budget_target ?? ""}
                className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-heading">Currency</label>
              <CurrencyCombobox value={currency} onChange={setCurrency} />
              <input type="hidden" name="currency" value={currency} />
            </div>
          </div>

          <Button
            formAction={async (formData) => {
              setError(null);
              const result = await updateTrip(trip.id, formData);
              if (result?.error) {
                setError(result.error);
                return;
              }
              onOpenChange(false);
              router.refresh();
            }}
            className="w-full mt-2 mb-4"
          >
            Save Changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}