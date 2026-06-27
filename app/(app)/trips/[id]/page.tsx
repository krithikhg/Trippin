import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AddMemberForm } from "./add-member-form";
import { ExpenseList } from "./expense-list";

type Params = Promise<{ id: string }>;

export default async function TripDetailPage({ params }: { params: Params }) {
    const { id } = await params;

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: trip } = await supabase
        .from("trips")
        .select(
            `
      *,
      trip_members(
        *,
        profiles(id, display_name, avatar_url)
      )
    `,
        )
        .eq("id", id)
        .single();

    if (!trip) notFound();

    const activeMembers =
        trip.trip_members?.filter(
            (m: { left_at: string | null }) => m.left_at == null,
        ) ?? [];

    const { data: expenses } = await supabase
        .from("expenses")
        .select(`*,expense_splits(*)`)
        .eq("trip_id", id)
        .order("paid_date", { ascending: false });

    const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id, display_name");

    const profileMap = Object.fromEntries(
        allProfiles?.map((p) => [p.id, p.display_name]) ?? [],
    );

    const balances: Record<string, number> = {};
    for (const m of activeMembers) {
        balances[m.user_id] = 0;
    }

    for (const expense of expenses ?? []) {
        balances[expense.paid_by] =
            (balances[expense.paid_by] ?? 0) +
            (expense.converted_amount ?? expense.amount);
        for (const split of expense.expense_splits) {
            balances[split.user_id] =
                (balances[split.user_id] ?? 0) - split.amount_owed;
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link
                        href="/trips"
                        className="text-sm text-muted-foreground hover:underline"
                    >
                        ← Back to My Trips
                    </Link>
                    <h1 className="text-4xl font-serif italic text-heading mt-1">
                        {trip.name}
                    </h1>
                </div>
                <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Invite code: {trip.invite_code}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="p-4 bg-card rounded-xl border">
                    <p className="text-sm text-muted-foreground">Destination</p>
                    <p className="text-lg font-semibold">{trip.destination}</p>
                </div>
                <div className="p-4 bg-card rounded-xl border">
                    <p className="text-sm text-muted-foreground">Dates</p>
                    <p className="text-lg font-semibold">
                        {trip.start_date} - {trip.end_date}
                    </p>
                </div>
                {trip.budget_target && (
                    <div className="p-4 bg-card rounded-xl border">
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="text-lg font-semibold">
                            {trip.currency} {trip.budget_target}
                        </p>
                    </div>
                )}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-serif italic text-heading">
                            Members ({activeMembers.length})
                        </h2>
                    </div>
                    <div className="space-y-2">
                        {activeMembers.map((member) => (
                            <div
                                key={member.id}
                                className="flex justify-between items-center p-3 bg-card rounded-xl border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
                                        {member.profiles.display_name
                                            ?.split(" ")
                                            .map((p: string) => p[0])
                                            .slice(0, 2)
                                            .join("")
                                            .toUpperCase() ?? "?"}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {member.profiles.display_name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Joined{" "}
                                            {new Date(
                                                member.joined_at,
                                            ).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <AddMemberForm tripId={id} />
            </div>

            {/* Expenses section */}
            <div className="mt-8">
                <h2 className="text-2xl font-serif italic text-heading mb-4">
                    Expenses
                </h2>

                <div className="p-4 bg-card rounded-xl border mb-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        Balances
                    </h3>
                    <div className="space-y-1">
                        {activeMembers.map((m) => {
                            const balance = balances[m.user_id] ?? 0;
                            return (
                                <div
                                    key={m.user_id}
                                    className="flex justify-between text-sm"
                                >
                                    <span>{m.profiles.display_name}</span>
                                    <span
                                        className={
                                            balance >= 0
                                                ? "text-green"
                                                : "text-destructive"
                                        }
                                    >
                                        {balance >= 0 ? "+" : ""}
                                        {balance.toFixed(2)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <ExpenseList
                    expenses={expenses ?? []}
                    profileMap={profileMap}
                    currentUserId={user.id}
                    tripId={id}
                    members={activeMembers}
                />
            </div>
        </div>
    );
}
