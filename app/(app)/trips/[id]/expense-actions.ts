"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import crypto from "crypto";
import { convertAmount } from "@/utils/currency";

export async function addExpense(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const trip_id = formData.get("tripId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const split_type = formData.get("splitType") as string;
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

    const { data: trip } = await supabase
        .from("trips")
        .select("currency")
        .eq("id", trip_id)
        .single();

    const convertedAmount = await convertAmount(
        amount,
        currency,
        trip?.currency,
    );

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
            split_type,
            converted_amount: convertedAmount,
            converted_currency: trip?.currency,
            created_by: user.id,
        })
        .select("id")
        .single();

    if (expenseError) return { error: expenseError.message };

    let splits;
    if (split_type === "custom") {
        splits = memberIds.map((memberId) => {
            const rawAmount =
                parseFloat(formData.get(`amount-${memberId}`) as string) || 0;
            return {
                expense_id: expense.id,
                user_id: memberId,
                amount_owed:
                    currency === trip?.currency
                        ? rawAmount
                        : (rawAmount / amount) * convertedAmount,
            };
        });
    } else {
        const share = convertedAmount / memberIds.length;
        splits = memberIds.map((memberId) => ({
            expense_id: expense.id,
            user_id: memberId,
            amount_owed: share,
        }));
    }

    const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splits);

    if (splitError) return { error: splitError.message };

    revalidatePath(`/trips/${trip_id}`);
    revalidatePath(`/expenses/${trip_id}`);
    revalidatePath(`/expenses`);
    revalidatePath(`/settlements/${trip_id}`);
    revalidatePath(`/settlements`);
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
    revalidatePath(`/expenses/${expense.trip_id}`);
    revalidatePath(`/expenses`);
    revalidatePath(`/settlements/${expense.trip_id}`);
    revalidatePath(`/settlements`);
    return { success: true };
}

export async function updateExpense(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const expense_id = formData.get("expenseId") as string;
    const trip_id = formData.get("tripId") as string;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const split_type = formData.get("splitType") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const currency = formData.get("currency") as string;
    const category = formData.get("category") as string;
    const paid_by = formData.get("paidBy") as string;
    const paid_date = formData.get("paidDate") as string;
    const memberIds = formData.getAll("memberId") as string[];

    if (!title || !amount || !memberIds.length) {
        return { error: "Missing required fields" };
    }

    const { data: existing } = await supabase
        .from("expenses")
        .select("created_by")
        .eq("id", expense_id)
        .single();

    if (!existing) return { error: "Expense not found" };
    if (existing.created_by !== user.id)
        return { error: "Only the creator can edit this expense" };

    const { data: trip } = await supabase
        .from("trips")
        .select("currency")
        .eq("id", trip_id)
        .single();

    const convertedAmount = await convertAmount(
        amount,
        currency,
        trip?.currency,
    );

    const { error: expenseError } = await supabase
        .from("expenses")
        .update({
            title,
            description,
            amount,
            currency,
            category,
            paid_by,
            paid_date,
            split_type,
            converted_amount: convertedAmount,
            converted_currency: trip?.currency,
        })
        .eq("id", expense_id);

    if (expenseError) return { error: expenseError.message };

    await supabase.from("expense_splits").delete().eq("expense_id", expense_id);

    let splits;
    if (split_type === "custom") {
        splits = memberIds.map((memberId) => {
            const rawAmount =
                parseFloat(formData.get(`amount-${memberId}`) as string) || 0;
            return {
                expense_id,
                user_id: memberId,
                amount_owed:
                    currency === trip?.currency
                        ? rawAmount
                        : (rawAmount / amount) * convertedAmount,
            };
        });
    } else {
        const share = convertedAmount / memberIds.length;
        splits = memberIds.map((memberId) => ({
            expense_id,
            user_id: memberId,
            amount_owed: share,
        }));
    }

    const { error: splitError } = await supabase
        .from("expense_splits")
        .insert(splits);

    if (splitError) return { error: splitError.message };

    revalidatePath(`/trips/${trip_id}`);
    revalidatePath(`/expenses/${trip_id}`);
    revalidatePath(`/expenses`);
    revalidatePath(`/settlements/${trip_id}`);
    revalidatePath(`/settlements`);
    return { success: true };
}
