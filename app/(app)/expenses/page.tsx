import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import {
    Calendar,
    UsersRound,
    ArrowUpRight,
    ArrowDownLeft,
    ChevronRight,
} from "lucide-react";
import {
    getTripStatus,
    getStatusBadge,
    formatDateRange,
} from "@/lib/trips/helpers";

export default async function ExpensesPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    // Count number of members in trips
    const { data: memberships } = await supabase
        .from("trip_members")
        .select(`left_at, trips(*, trip_members(left_at))`)
        .eq("user_id", user.id)
        .is("left_at", null);

    const trips =
        memberships?.map((m) => {
            const t = m.trips;
            const memberCount = t.trip_members.filter(
                (tm: { left_at: string | null }) => tm.left_at == null,
            ).length;
            return { ...t, memberCount };
        }) ?? [];

    // Get all the expenses and trips for all the trips
    const tripIds = trips.map((t) => t.id);
    const { data: allExpenses } =
        tripIds.length > 0
            ? await supabase
                  .from("expenses")
                  .select(`*, expense_splits(*)`)
                  .in("trip_id", tripIds)
                  .order("paid_date", { ascending: false })
            : { data: [] };

    const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, display_name");
    const profileMap = Object.fromEntries(
        allProfiles?.map((p) => [p.id, p.display_name]) ?? [],
    );

    // Compute balances per trip
    const tripBalances: Record<string, { total: number; yourBalance: number }> =
        {};

    for (const trip of trips) {
        const tripExpenses =
            allExpenses?.filter((e) => e.trip_id === trip.id) ?? [];
        let total = 0;
        let yourBalance = 0;

        for (const expense of tripExpenses) {
            const amt = expense.converted_amount ?? expense.amount;
            total += amt;

            if (expense.paid_by === user.id) {
                yourBalance += amt;
            }

            for (const split of expense.expense_splits) {
                if (split.user_id === user.id) {
                    yourBalance -= split.amount_owed;
                }
            }
        }

        tripBalances[trip.id] = { total, yourBalance };
    }

    // Compute the total summary in/out
    let totalYouOwe = 0;
    let totalOwedToYou = 0;
    let tripsYouOweCount = 0;
    let tripsOwedToYouCount = 0;

    for (const [_, b] of Object.entries(tripBalances)) {
        if (b.yourBalance < 0) {
            totalYouOwe += Math.abs(b.yourBalance);
            tripsYouOweCount++;
        } else if (b.yourBalance > 0) {
            totalOwedToYou += b.yourBalance;
            tripsOwedToYouCount++;
        }
    }

    return (
        <div>
            <h1 className="text-4xl font-serif italic text-heading mb-2">
                Expenses & Settlements
            </h1>
            <p className="text-muted-foreground mb-8">
                Track and manage expenses across all your trips.
            </p>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-6 bg-card rounded-xl border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-red-50 flex items-center justify-center">
                            <ArrowUpRight className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                You Owe
                            </p>
                            <p className="text-2xl font-bold text-destructive">
                                S$ {totalYouOwe.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Across {tripsYouOweCount} trip
                                {tripsYouOweCount !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-card rounded-xl border">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center">
                            <ArrowDownLeft className="h-5 w-5 text-green" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Owed to You
                            </p>
                            <p className="text-2xl font-bold text-green">
                                S$ {totalOwedToYou.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Across {tripsOwedToYouCount} trip
                                {tripsOwedToYouCount !== 1 ? "s" : ""}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Per-trip cards */}
            {trips.length === 0 ? (
                <p className="text-muted-foreground">No trips yet</p>
            ) : (
                <div className="space-y-4">
                    {trips.map((trip) => {
                        const bal = tripBalances[trip.id] ?? {
                            total: 0,
                            yourBalance: 0,
                        };
                        const status = getTripStatus(
                            trip.start_date,
                            trip.end_date,
                        );
                        const badge = getStatusBadge(status);

                        return (
                            <Link
                                key={trip.id}
                                href={`/trips/${trip.id}`}
                                className="block p-5 bg-card rounded-xl border hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <span className="font-semibold text-lg">
                                            {trip.name}
                                        </span>
                                        <span
                                            className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${badge.className}`}
                                        >
                                            {badge.label}
                                        </span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        {formatDateRange(
                                            trip.start_date,
                                            trip.end_date,
                                        )}
                                    </span>
                                    <span className="h-4 w-px bg-border" />
                                    <span className="flex items-center gap-1">
                                        <UsersRound className="h-4 w-4" />
                                        {trip.memberCount} members
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        Total expenses: S${" "}
                                        {bal.total.toFixed(2)}
                                    </span>
                                    <span
                                        className={
                                            bal.yourBalance >= 0
                                                ? "text-green"
                                                : "text-destructive"
                                        }
                                    >
                                        {bal.yourBalance >= 0
                                            ? `You are owed S$ ${bal.yourBalance.toFixed(2)}`
                                            : `You owe S$ ${Math.abs(bal.yourBalance).toFixed(2)}`}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
