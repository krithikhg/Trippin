"use server";

import { createClient } from "@/utils/supabase/server";

export async function updateTrip(tripId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();

  if (!membership) {
    return { error: "Only active trip members can edit this trip." };
  }

  const name = formData.get("name") as string;
  const destination = formData.get("destination") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;
  const budget = formData.get("budget") as string;
  const currency = formData.get("currency") as string;

  if (!name || !destination || !startDate || !endDate) {
    return { error: "Please fill in all required fields." };
  }

  const { error } = await supabase
    .from("trips")
    .update({
      name,
      destination,
      start_date: startDate,
      end_date: endDate,
      budget_target: budget ? Number(budget) : null,
      currency,
    })
    .eq("id", tripId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function leaveTrip(tripId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("trip_members")
    .update({ left_at: new Date().toISOString() })
    .eq("trip_id", tripId)
    .eq("user_id", user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteTrip(tripId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: membership } = await supabase
    .from("trip_members")
    .select("id")
    .eq("trip_id", tripId)
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();

  if (!membership) {
    return { error: "Only active trip members can delete this trip." };
  }

  const { error } = await supabase.from("trips").delete().eq("id", tripId);

  if (error) return { error: error.message };
  return { success: true };
}