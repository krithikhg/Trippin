"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";

export async function addExpense(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const trip_id = formData.get("tripId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as string;
    const category = formData.get("category") as string;
    const paid_by = formData.get("paidBy") as string;
    const paid_date = formData.get("paidDate") as string;
    const memberIds = formData.getAll("memberId") as string[];

    if (!title) {
        return { error: "Title is required" };
    }
    if (!amount) {
        return { error: "Amount is required" };
    }
    if (!memberIds.length) {
        return { error: "At least one member is required" };
    }

    const { data: expense, error: expenseError } = await supabase
        .from("expenses")
        .insert({
            trip_id,
            title,
            description,
            amount,
            currency,
            category,
            paid_by,
            paid_date,
            split_type: "equal",
            created_by: user.id,
        })
        .select("id")
        .single();

    if (expenseError) return { error: expenseError.message };

    const splits = memberIds.map((memberId, i) => ({
        expense_id: expense.id,
        user_id: memberId,
        amount_owed: amount / memberIds.length,
    }));

    const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splits);

    if (splitError) return { error: splitError.message };

    revalidatePath(`/trips/${trip_id}`);
    return { success: true };
}

export async function deleteExpense(expenseId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    // We only let the creator of the expense delete it
    const { data: expense } = await supabase
        .from("expenses")
        .select("trip_id, created_by")
        .eq("id", expenseId)
        .single();

    if (!expense) return { error: "Expense not found!" };
    if (expense.created_by !== user.id)
        return { error: "Only the creator can delete this expense" };

    // Delete the splits first since they are a foreign key in the expense table
    await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
    await supabase.from("expenses").delete().eq("id", expenseId);

    revalidatePath(`/trips/${expense.trip_id}`);
    return { success: true };
}
