import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ExpenseList } from "@/app/(app)/trips/[id]/expense-list";
import { getTripStatus, getStatusBadge, formatDateRange } from "@/lib/trips/helpers";
import { Calendar, UsersRound, ArrowLeft } from "lucide-react";
import { CopyInviteCode } from "@/app/(app)/trips/copy-invite-code";
import { TripOptionsMenu } from "@/app/(app)/trips/[id]/trip-options-menu";
import { Card, CardTitle, CardContent } from "@/components/ui/card";

type Params = Promise<{ id: string }>;

type TripMember = {
  id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  profiles: { id: string; display_name: string; avatar_url: string | null };
};

export default async function ExpenseDetailPage({ params }: { params: Params }) {
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

  const tripStatus = getTripStatus(trip.start_date, trip.end_date);
  const statusBadge = getStatusBadge(tripStatus);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <Link
            href={`/trips/${id}`}
            className="text-sm text-muted-foreground hover:underline flex items-center gap-1 mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {trip.name}
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

      {/* Expenses section */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-heading mb-4">
          Expenses
        </h2>

        <Card className="mb-6 py-0">
            <CardContent className="p-6">
            <CardTitle className="text-base font-semibold mb-2">
                Balances
            </CardTitle>
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
            </CardContent>
        </Card>

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