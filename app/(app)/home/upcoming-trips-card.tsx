import Link from "next/link";
import { Calendar, UsersRound, ChevronRight, Plane } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getTripStatus, formatDateRange } from "@/lib/trips/helpers";

type Trip = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  memberCount: number;
};

function getDaysLabel(startDate: string, endDate: string) {
  const status = getTripStatus(startDate, endDate);
  if (status === "ongoing") {
    return { label: "Ongoing", className: "bg-green/10 text-green" };
  }
  const days = Math.ceil(
    (new Date(startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );
  return {
    label: `In ${days} day${days !== 1 ? "s" : ""}`,
    className: "bg-primary/10 text-primary",
  };
}

export function UpcomingTripsCard({ trips }: { trips: Trip[] }) {
  return (
    <Card className="shadow-sm px-4 py-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold font-serif">
          <Plane className="h-5 w-5" />
          Upcoming Trips
        </CardTitle>
        <Link
          href="/trips"
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          View all trips
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>

      <CardContent className="pt-0">
        {trips.length === 0 ? (
          <p className="text-muted-foreground text-sm">No upcoming trips</p>
        ) : (
          <div className="divide-y divide-border">
            {trips.map((trip) => {
              const badge = getDaysLabel(trip.start_date, trip.end_date);
              return (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 group"
                >
                  <div>
                    <p className="font-serif text-xl font-bold text-heading group-hover:text-primary transition-colors">
                      {trip.name}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDateRange(trip.start_date, trip.end_date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersRound className="h-4 w-4" />
                        {trip.memberCount} members
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-medium px-2 py-1 rounded ${badge.className}`}>
                      {badge.label}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}