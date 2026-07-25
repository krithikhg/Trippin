import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { computeSettlements } from "@/lib/trips/settlements";
import { SettlementForm } from "@/app/(app)/trips/[id]/settlement-form";
import { getTripStatus, getStatusBadge, getSettlementBadge, formatDateRange } from "@/lib/trips/helpers";
import { Calendar, UsersRound, ArrowLeft } from "lucide-react";
import { CopyInviteCode } from "@/app/(app)/trips/copy-invite-code";
import { TripOptionsMenu } from "@/app/(app)/trips/[id]/trip-options-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Params = Promise<{ id: string }>;

type TripMember = {
  id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  profiles: { id: string; display_name: string; avatar_url: string | null };
};

export default async function SettlementDetailPage({ params }: { params: Params }) {
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
    .eq("trip_id", id);

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

  const isSettled = recommended.length === 0;
  const settlementBadge = getSettlementBadge(isSettled);

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
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded ${settlementBadge.className}`}
          >
            {settlementBadge.label}
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

      {/* Settlements section */}
      <div>
        <h2 className="text-2xl font-serif font-semibold text-heading mb-4">
          Settlements
        </h2>

        <SettlementForm tripId={id} members={activeMembers} />

        {/* Recommended settlements */}
        {recommended.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Recommended payments
            </h3>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {recommended.map((s, i) => (
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
                    <span className="font-semibold">
                      S$ {s.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Previously recorded settlements */}
        {existingSettlements && existingSettlements.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              Recorded payments
            </h3>
            <Card>
              <CardContent className="p-0 divide-y divide-border">
                {existingSettlements.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-3 text-sm"
                  >
                    <span>
                      <span className="font-medium">
                        {profileMap[s.from_user_id] ?? s.from_user_id}
                      </span>
                      <span className="text-muted-foreground mx-2">paid</span>
                      <span className="font-medium">
                        {profileMap[s.to_user_id] ?? s.to_user_id}
                      </span>
                    </span>
                    <span className="font-semibold">
                      {s.currency} {Number(s.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}