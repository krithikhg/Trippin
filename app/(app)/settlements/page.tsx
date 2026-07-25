import { createClient } from "@/utils/supabase/server";
import { computeSettlements, type Settlement } from "@/lib/trips/settlements";
import Link from "next/link";
import { Calendar, UsersRound, ArrowUpRight, ArrowDownLeft, ChevronRight, ArrowRight } from "lucide-react";
import { getTripStatus, getStatusBadge, formatDateRange } from "@/lib/trips/helpers";
import { Card, CardContent } from "@/components/ui/card";

type TripRow = {
    id: string;
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
    invite_code: string;
    currency: string;
    budget_target: number | null;
    trip_members: { left_at: string | null; user_id: string }[];
};

type MembershipRow = {
    left_at: string | null;
    trips: TripRow;
};

export default async function SettlementsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: memberships } = await supabase
        .from("trip_members")
        .select(`left_at, trips(*, trip_members(user_id, left_at))`)
        .eq("user_id", user.id)
        .is("left_at", null)
        .returns<MembershipRow[]>();

    const trips =
        memberships?.map((m) => {
            const t = m.trips;
            const memberCount = t.trip_members.filter(
                (tm: { left_at: string | null }) => tm.left_at == null,
            ).length;
            return { ...t, memberCount };
        }) ?? [];

    const tripIds = trips.map((t) => t.id);
    const { data: allExpenses } =
        tripIds.length > 0
            ? await supabase
                  .from("expenses")
                  .select(`*, expense_splits(*)`)
                  .in("trip_id", tripIds)
                  .order("paid_date", { ascending: false })
            : { data: [] };

    const { data: allSettlements } =
        tripIds.length > 0
            ? await supabase
                  .from("settlements")
                  .select(
                      "id, from_user_id, to_user_id, amount, currency, converted_amount, converted_currency, trip_id",
                  )
                  .in("trip_id", tripIds)
            : { data: [] };

    const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, display_name");
    const profileMap = Object.fromEntries(
        allProfiles?.map((p: { id: string; display_name: string }) => [
            p.id,
            p.display_name,
        ]) ?? [],
    );

    const tripBalances: Record<string, { total: number; yourBalance: number }> =
        {};

    for (const trip of trips) {
        const tripExpenses =
            allExpenses?.filter(
                (e: {
                    trip_id: string;
                    paid_by: string;
                    amount: number;
                    converted_amount: number | null;
                    expense_splits: { user_id: string; amount_owed: number }[];
                }) => e.trip_id === trip.id,
            ) ?? [];
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

    const tripSettlements: Record<string, Settlement[]> = {};

    for (const trip of trips) {
        const activeMemberIds = trip.trip_members
            .filter((tm: { left_at: string | null }) => tm.left_at == null)
            .map((tm: { user_id: string }) => tm.user_id);

        const balances: Record<string, number> = {};
        for (const uid of activeMemberIds) {
            balances[uid] = 0;
        }

        const tripExpenses =
            allExpenses?.filter((e: { trip_id: string }) => e.trip_id === trip.id) ??
            [];

        for (const expense of tripExpenses) {
            const e = expense as {
                paid_by: string;
                amount: number;
                converted_amount: number | null;
                expense_splits: { user_id: string; amount_owed: number }[];
            };
            balances[e.paid_by] =
                (balances[e.paid_by] ?? 0) + (e.converted_amount ?? e.amount);
            for (const split of e.expense_splits) {
                balances[split.user_id] =
                    (balances[split.user_id] ?? 0) - split.amount_owed;
            }
        }

        const tripSettlementRecs =
            allSettlements?.filter((s: { trip_id: string }) => s.trip_id === trip.id) ??
            [];

        for (const s of tripSettlementRecs) {
            balances[s.from_user_id] =
                (balances[s.from_user_id] ?? 0) + s.converted_amount;
            balances[s.to_user_id] =
                (balances[s.to_user_id] ?? 0) - s.converted_amount;
        }

        tripSettlements[trip.id] = computeSettlements(balances);
    }

    let totalYouOwe = 0;
    let totalOwedToYou = 0;
    let tripsYouOweCount = 0;
    let tripsOwedToYouCount = 0;

    for (const [, b] of Object.entries(tripBalances)) {
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
            <h1 className="text-4xl font-serif italic text-heading mb-6">
                Settlements
            </h1>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                                <ArrowUpRight className="h-7 w-7 text-destructive" />
                            </div>
                            <div>
                                <p className="text-base text-muted-foreground">
                                    You Owe
                                </p>
                                <p className="text-3xl font-bold text-destructive">
                                    S$ {totalYouOwe.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Across {tripsYouOweCount} trip
                                    {tripsYouOweCount !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green/10 flex items-center justify-center">
                                <ArrowDownLeft className="h-7 w-7 text-green" />
                            </div>
                            <div>
                                <p className="text-base text-muted-foreground">
                                    Owed to You
                                </p>
                                <p className="text-3xl font-bold text-green">
                                    S$ {totalOwedToYou.toFixed(2)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Across {tripsOwedToYouCount} trip
                                    {tripsOwedToYouCount !== 1 ? "s" : ""}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
                        const status = getTripStatus(trip.start_date, trip.end_date);
                        const badge = getStatusBadge(status);

                        return (
                            <Card
                                key={trip.id}
                                className="hover:shadow-md transition-shadow py-0"
                            >
                                <CardContent className="p-5">
                                    <Link
                                        href={`/settlements/${trip.id}`}
                                        className="group block"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <span className="font-semibold text-xl group-hover:underline">
                                                    {trip.name}
                                                </span>
                                                <span
                                                    className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${badge.className}`}
                                                >
                                                    {badge.label}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                        <div className="flex items-center gap-4 text-base text-muted-foreground mb-3">
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
                                    </Link>
                                    <div className="flex items-center justify-between text-base">
                                        <span className="text-muted-foreground">
                                            Total expenses: S$ {bal.total.toFixed(2)}
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
                                    {(tripSettlements[trip.id] ?? []).length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <p className="text-base text-muted-foreground mb-2">
                                                Settlements needed:
                                            </p>
                                            <div className="space-y-1">
                                                {tripSettlements[trip.id].map((s, i) => (
                                                    <div
                                                        key={i}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span>
                                                            <span className="text-destructive">
                                                                {profileMap[s.fromUserId] ??
                                                                    s.fromUserId}
                                                            </span>
                                                            <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground inline" />
                                                            <span className="text-green">
                                                                {profileMap[s.toUserId] ??
                                                                    s.toUserId}
                                                            </span>
                                                        </span>
                                                        <span className="font-medium">
                                                            S$ {s.amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}