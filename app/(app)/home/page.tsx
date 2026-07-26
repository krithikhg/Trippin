import { createClient } from "@/utils/supabase/server";
import { getTripStatus } from "@/lib/trips/helpers";
import { UpcomingTripsCard } from "./upcoming-trips-card";
import { SettlementSummaryCard } from "./settlement-summary-card";
import { TrippinWrappedCard } from "./trippin-wrapped-card";
import { computeYourBalanceForTrip, type SettlementForBalance } from "@/lib/trips/settlements";

type TripMemberRow = { user_id: string; left_at: string | null };

type TripRow = {
  id: string;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  currency: string;
  trip_members: TripMemberRow[];
};

type MembershipRow = {
  left_at: string | null;
  trips: TripRow;
};

type ExpenseRow = {
  trip_id: string;
  paid_by: string;
  amount: number;
  converted_amount: number | null;
  expense_splits: { user_id: string; amount_owed: number }[];
};

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const { data: memberships } = await supabase
    .from("trip_members")
    .select(`left_at, trips(*, trip_members(user_id, left_at))`)
    .eq("user_id", user.id)
    .returns<MembershipRow[]>();

  const allTrips = memberships?.map((m) => m.trips) ?? [];
  const activeMemberships = memberships?.filter((m) => m.left_at === null) ?? [];
  const activeTrips = activeMemberships.map((m) => {
    const t = m.trips;
    const memberCount = t.trip_members.filter((tm) => tm.left_at === null).length;
    return { ...t, memberCount };
  });

  const upcomingTrips = activeTrips
    .filter((t) => {
      const status = getTripStatus(t.start_date, t.end_date);
      return status === "ongoing" || status === "upcoming";
    })
    .sort(
      (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
    )
    .slice(0, 4);

// Settlement Summary
  const activeTripIds = activeTrips.map((t) => t.id);
  const { data: allExpenses } =
    activeTripIds.length > 0
      ? await supabase
          .from("expenses")
          .select(`trip_id, paid_by, amount, converted_amount, expense_splits(user_id, amount_owed)`)
          .in("trip_id", activeTripIds)
          .returns<ExpenseRow[]>()
      : { data: [] as ExpenseRow[] };

  const { data: allSettlements } =
    activeTripIds.length > 0
      ? await supabase
          .from("settlements")
          .select("trip_id, from_user_id, to_user_id, converted_amount")
          .in("trip_id", activeTripIds)
          .returns<SettlementForBalance[]>()
      : { data: [] };

  let totalYouOwe = 0;
  let totalOwedToYou = 0;
  let tripsYouOweCount = 0;
  let tripsOwedToYouCount = 0;

  for (const trip of activeTrips) {
    const { yourBalance } = computeYourBalanceForTrip(
      trip.id,
      allExpenses ?? [],
      allSettlements ?? [],
      user.id,
    );
    if (yourBalance < 0) {
      totalYouOwe += Math.abs(yourBalance);
      tripsYouOweCount++;
    } else if (yourBalance > 0) {
      totalOwedToYou += yourBalance;
      tripsOwedToYouCount++;
    }
  }

  // Trippin Wrapped 
  const totalTripsTaken = allTrips.length;

  const tripDurations = allTrips.map((t) => ({
    name: t.name,
    days:
      Math.round(
        (new Date(t.end_date).getTime() - new Date(t.start_date).getTime()) /
          (1000 * 60 * 60 * 24),
      ) + 1,
  }));

  const totalDaysTraveled = tripDurations.reduce((sum, t) => sum + t.days, 0);

  const longestTrip = tripDurations.reduce<{ name: string; days: number } | null>(
    (max, t) => (t.days > (max?.days ?? -Infinity) ? t : max),
    null,
  );
  const shortestTrip = tripDurations.reduce<{ name: string; days: number } | null>(
    (min, t) => (t.days < (min?.days ?? Infinity) ? t : min),
    null,
  );

  const allTripIds = allTrips.map((t) => t.id);
  const { data: spendingExpenses } =
    allTripIds.length > 0
      ? await supabase
          .from("expenses")
          .select("converted_amount, amount")
          .in("trip_id", allTripIds)
          .eq("paid_by", user.id)
          .returns<{ converted_amount: number | null; amount: number }[]>()
      : { data: [] };

  const totalMoneySpent =
    spendingExpenses?.reduce((sum, e) => sum + (e.converted_amount ?? e.amount), 0) ?? 0;

  // Travel buddies: distinct ACTIVE members (left_at === null) across all trips, excluding self
  const travelBuddyIds = new Set<string>();
  allTrips.forEach((t) => {
    t.trip_members.forEach((tm) => {
      if (tm.left_at === null && tm.user_id !== user.id) {
        travelBuddyIds.add(tm.user_id);
      }
    });
  });

  return (
    <div>
      <h1 className="text-4xl font-serif italic text-heading mb-2">
        Welcome back, {profile?.display_name}!
      </h1>
      <p className="text-muted-foreground mb-8">
        Let&apos;s make this trip unforgettable.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UpcomingTripsCard trips={upcomingTrips} />

        <div className="flex flex-col gap-6">
          <SettlementSummaryCard
            totalYouOwe={totalYouOwe}
            totalOwedToYou={totalOwedToYou}
            tripsYouOweCount={tripsYouOweCount}
            tripsOwedToYouCount={tripsOwedToYouCount}
          />
          <TrippinWrappedCard
            totalTripsTaken={totalTripsTaken}
            totalDaysTraveled={totalDaysTraveled}
            totalMoneySpent={totalMoneySpent}
            longestTrip={longestTrip}
            shortestTrip={shortestTrip}
            travelBuddyCount={travelBuddyIds.size}
          />
        </div>
      </div>
    </div>
  );
}