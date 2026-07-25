import { Plane, CalendarDays, Wallet, PlaneTakeoff, PlaneLanding, Users, Star } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";

type TripStat = { name: string; days: number } | null;

export function TrippinWrappedCard({
  totalTripsTaken,
  totalDaysTraveled,
  totalMoneySpent,
  longestTrip,
  shortestTrip,
  travelBuddyCount,
}: {
  totalTripsTaken: number;
  totalDaysTraveled: number;
  totalMoneySpent: number;
  longestTrip: TripStat;
  shortestTrip: TripStat;
  travelBuddyCount: number;
}) {
  const stats = [
    { icon: Plane, label: "Trips taken", value: totalTripsTaken, className: "bg-primary/10 text-primary" },
    { icon: CalendarDays, label: "Days traveled", value: totalDaysTraveled, className: "bg-green/10 text-green" },
    { icon: Wallet, label: "Total spent", value: `S$ ${totalMoneySpent.toFixed(2)}`, className: "bg-destructive/10 text-destructive" },
    { icon: Users, label: "Travel buddies", value: travelBuddyCount, className: "bg-pink-100 text-pink-700" },
  ];

  return (
    <Card className="shadow-sm px-4 py-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-semibold font-serif">
          <Star className="h-5 w-5 text-yellow-500" />
          Trippin Wrapped
        </CardTitle>
        <CardDescription className="text-sm">
          Your Trippin journey so far!
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 mb-4">
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${stat.className}`}>
                <stat.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-lg font-bold text-heading">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {(longestTrip || shortestTrip) && (
          <div className="pt-3 border-t border-border space-y-2 text-sm">
            {longestTrip && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <PlaneTakeoff className="h-4 w-4" />
                Longest trip: <span className="font-medium text-heading">{longestTrip.name}</span>{" "}
                ({longestTrip.days} days)
              </div>
            )}
            {shortestTrip && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <PlaneLanding className="h-4 w-4" />
                Shortest trip: <span className="font-medium text-heading">{shortestTrip.name}</span>{" "}
                ({shortestTrip.days} days)
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}