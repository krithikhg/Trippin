import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExpenseList } from "./expense-list";
import { computeSettlements } from "@/lib/trips/settlements";
import { SettlementForm } from "./settlement-form";
import { getTripStatus, getStatusBadge, formatDateRange } from "@/lib/trips/helpers";
import { Calendar, UsersRound, ArrowLeft, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardAction } from "@/components/ui/card";
import { CopyInviteCode } from "../copy-invite-code";
import { TripOptionsMenu } from "./trip-options-menu";

type Params = Promise<{ id: string }>;

type TripMember = {
  id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  profiles: { id: string; display_name: string; avatar_url: string | null };
};

type ItineraryItem = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string | null;
};

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
      `*, 
            trip_members(*, profiles(id, display_name, avatar_url))`,
    )
    .eq("id", id)
    .single();

  if (!trip) notFound();

  const activeMembers: TripMember[] =
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
    allProfiles?.map((p: { id: string; display_name: string }) => [
      p.id,
      p.display_name,
    ]) ?? [],
  );

  const nowFormatted = new Date().toISOString();
  
  const { data: itineraryItems } = await supabase
    .from("itinerary_items")
    .select("id, title, start_time, end_time, location")
    .eq("trip_id", id)
    .eq("status", "confirmed")
    .gte("start_time", nowFormatted)
    .order("start_time", { ascending: true })
    .limit(5);

  const upcomingItems: ItineraryItem[] = itineraryItems ?? [];

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

  const { data: existingSettlements } = await supabase
    .from("settlements")
    .select(
      "id, from_user_id, to_user_id, amount, currency, converted_amount, converted_currency",
    )
    .eq("trip_id", id);

  for (const s of existingSettlements ?? []) {
    balances[s.from_user_id] =
      (balances[s.from_user_id] ?? 0) + s.converted_amount;
    balances[s.to_user_id] = (balances[s.to_user_id] ?? 0) - s.converted_amount;
  }

  const recommended = computeSettlements(balances);

  // Budget overview calculations
  const totalSpent = (expenses ?? []).reduce(
    (sum, e) => sum + (e.converted_amount ?? e.amount),
    0,
  );
  const budget = trip.budget_target ?? 0;
  const spentPercent =
    budget > 0 ? Math.min(100, (totalSpent / budget) * 100) : 0;
  const remaining = budget - totalSpent;

  // SVG donut math
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const spentDash = (spentPercent / 100) * circumference;

  const tripStatus = getTripStatus(trip.start_date, trip.end_date);
  const statusBadge = getStatusBadge(tripStatus);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <Link
            href="/trips"
            className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> Back to My Trips
          </Link>
          <TripOptionsMenu trip={trip} />
        </div>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-4xl font-serif font-semibold text-heading">
            {trip.name}
          </h1>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${statusBadge.className}`}
          >
            {statusBadge.label}
          </span>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDateRange(trip.start_date, trip.end_date)}
          </span>
          <span className="h-4 w-px bg-border" />
          <span className="flex items-center gap-1">
            <UsersRound className="h-4 w-4" />
            {activeMembers.length} members
          </span>
        </div>
        <div className="mt-2">
          <CopyInviteCode code={trip.invite_code} />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left column: Itinerary, Settlements, Expenses */}
        <div className="lg:col-span-3 space-y-8">
          {/* Itinerary section */}
          <Card className="gap-0 pb-2">
            <CardHeader>
              <CardTitle className="text-xl font-serif font-semibold text-heading">
                Itinerary
              </CardTitle>
              <CardAction className="self-center">
                <Link
                  href={`/trips/${id}/itinerary`}
                  className="text-sm text-primary hover:underline"
                >
                  View full itinerary <ArrowRight className="h-4 w-4 inline-block" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {upcomingItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    No itinerary planned yet.
                  </p>
                ) : (
                  upcomingItems.map((item) => {
                    const startDate = new Date(item.start_time);
                    const dayLabel = startDate.toLocaleDateString("en-SG", {
                      weekday: "short",
                    });
                    const dateLabel = startDate.toLocaleDateString("en-SG", {
                      day: "numeric",
                      month: "short",
                    });
                    const time = startDate.toLocaleTimeString("en-SG", {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    });

                    return (
                      <div
                        key={item.id}
                        className="grid grid-cols-4 items-center gap-4 px-4 py-3"
                      >
                        <div className="text-sm">
                          <p className="font-medium text-heading">{dayLabel}</p>
                          <p className="text-muted-foreground">{dateLabel}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {time}
                        </span>
                        <span className="text-sm font-medium text-heading wrap-break-word">
                          {item.title}
                        </span>
                        <span className="text-sm text-muted-foreground wrap-break-word">
                          {item.location ?? "—"}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settlements section */}
          <Card className="gap-0 pb-2">
            <CardHeader>
              <CardTitle className="text-xl font-serif font-semibold text-heading">
                Settlements
              </CardTitle>
              <p className="text-sm text-muted-foreground">Recommended Payments</p>
              <CardAction className="self-center">
                <Link
                  href={`/settlements/${id}`}
                  className="text-sm text-primary hover:underline"
                >
                  View Settlements <ArrowRight className="h-4 w-4 inline-block" />
                </Link>
              </CardAction>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {recommended.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-4">
                    No settlements needed right now.
                  </p>
                ) : (
                  recommended.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-4 py-3 text-sm"
                    >
                      <span>
                        <span className="font-medium text-destructive">
                          {profileMap[s.fromUserId] ?? s.fromUserId}
                        </span>
                        <span className="text-muted-foreground mx-2">→</span>
                        <span className="font-medium text-green">
                          {profileMap[s.toUserId] ?? s.toUserId}
                        </span>
                      </span>
                      <span className="font-semibold">S$ {s.amount.toFixed(2)}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Expenses section */}
          <div>
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
                          balance >= 0 ? "text-green" : "text-destructive"
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

        {/* Right column: Members + Budget Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Members */}
          <Card className="gap-2">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-serif font-semibold text-heading">
                  Members ({activeMembers.length})
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 py-1">
              <div className="space-y-4">
                {activeMembers.map((member) => (
                          <div key={member.id} className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold shrink-0">
                              {member.profiles.display_name
                                ?.split(" ")
                                .map((p: string) => p[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase() ?? "?"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">
                                {member.profiles.display_name}
                                {member.user_id === user.id && (
                                  <span className="text-muted-foreground font-normal">
                                    {" "}
                                    (You)
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Joined {new Date(member.joined_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Budget Overview */}
          {trip.budget_target && (
            <Card className="gap-2">
              <CardHeader className="pb-0">
                <CardTitle className="text-xl font-serif font-semibold text-heading">
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 py-1">
                <div className="flex items-center justify-center mb-4">
                  <svg viewBox="0 0 180 180" className="h-40 w-40 -rotate-90">
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="none"
                      strokeWidth="16"
                      className="stroke-muted"
                    />
                    <circle
                      cx="90"
                      cy="90"
                      r={radius}
                      fill="none"
                      strokeWidth="16"
                      strokeLinecap="round"
                      className="stroke-primary"
                      strokeDasharray={`${spentDash} ${circumference}`}
                    />
                    <text
                      x="90"
                      y="85"
                      textAnchor="middle"
                      className="fill-heading font-italic text-xl rotate-90"
                      style={{ transformOrigin: "90px 90px" }}
                    >
                      {Math.round(spentPercent)}%
                    </text>
                    <text
                      x="90"
                      y="110"
                      textAnchor="middle"
                      className="fill-muted-foreground text-xs rotate-90"
                      style={{ transformOrigin: "90px 90px" }}
                    >
                      of budget used
                    </text>
                  </svg>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      Spent
                    </span>
                    <span className="font-semibold">
                      {trip.currency} {totalSpent.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-muted" />
                      Remaining
                    </span>
                    <span className="font-semibold">
                      {trip.currency} {remaining.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between items-center">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold">
                      {trip.currency} {Number(trip.budget_target).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
