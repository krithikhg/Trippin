import { createClient } from "@/utils/supabase/server";
import { JoinTripForm } from "./join-form";
import { getTripStatus } from "@/lib/trips/helpers";
import { TripsTabs } from "./trips-tabs";
import { CreateTrip } from "./create-trip";


type TripRow = {
    id: string;
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
    invite_code: string;
    trip_members: { left_at: string | null }[];
};

type MembershipRow = {
    left_at: string | null;
    trips: TripRow;
};

type NextEventRow = {
    id: string;
    trip_id: string;
    title: string;
    start_time: string;
    location: string | null;
};

export default async function TripsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: memberships } = await supabase
        .from("trip_members")
        .select(
            `left_at,
      trips(*, trip_members(left_at))`,
        )
        .eq("user_id", user.id)
        .is("left_at", null)
        .returns<MembershipRow[]>();

    const trips =
        memberships?.map((m) => {
            const trip = m.trips;
            const memberCount = trip.trip_members.filter(
                (tm: { left_at: string | null }) => tm.left_at == null,
            ).length;
            return { ...trip, memberCount };
        }) ?? [];

    const activeTripsRaw = trips
        .filter((trip) => {
            const status = getTripStatus(trip.start_date, trip.end_date);
            return status === "ongoing" || status === "upcoming";
        })
        .sort(
            (a, b) =>
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );

    const completedTrips = trips
        .filter((trip) => {
            const status = getTripStatus(trip.start_date, trip.end_date);
            return status === "completed";
        })
        .sort(
            (a, b) =>
                new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        );

    const activeTripIds = activeTripsRaw.map((t) => t.id);
    const nextEventByTrip = new Map<string, NextEventRow>();

    if (activeTripIds.length > 0) {
        const nowFormatted = new Date().toISOString();

        const { data: upcomingItems } = await supabase
            .from("itinerary_items")
            .select("id, trip_id, title, start_time, location")
            .in("trip_id", activeTripIds)
            .eq("status", "confirmed")
            .gte("start_time", nowFormatted)
            .order("start_time", { ascending: true })
            .returns<NextEventRow[]>();

        upcomingItems?.forEach((item) => {
            if (!nextEventByTrip.has(item.trip_id)) {
                nextEventByTrip.set(item.trip_id, item);
            }
        });
    }

    const activeTrips = activeTripsRaw.map((trip) => ({
        ...trip,
        nextEvent: nextEventByTrip.get(trip.id) ?? null,
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-4xl font-serif italic text-heading">
                    My Trips
                </h1>
                <div className="flex flex-col gap-2">
                    <CreateTrip />
                    <JoinTripForm />
                </div>
            </div>
            {trips.length === 0 ? (
                <p className="text-muted-foreground">
                    You haven&apos;t joined any trips yet
                </p>
            ) : (
                <TripsTabs
                    activeTrips={activeTrips}
                    completedTrips={completedTrips}
                />
            )}
        </div>
    );
}
