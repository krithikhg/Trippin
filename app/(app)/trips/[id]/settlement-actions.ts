"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { convertAmount } from "@/utils/currency"

export async function recordSettlement(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    const tripId = formData.get("tripId") as string
    const paidBy = formData.get("paidBy") as string
    const paidTo = formData.get("paidTo") as string
    const amount = parseFloat(formData.get("amount") as string)
    const currency = formData.get("currency") as string

    if (!tripId || !paidBy || !paidTo || !amount || amount <= 0 || !currency) {
        return {error: "Invalid settlement data, please check again"}
    }

    const { data: trip } = await supabase
        .from("trips")
        .select("currency")
        .eq("id", tripId)
        .single()

    const convertedAmount = await convertAmount(amount, currency, trip?.currency)

    const { error } = await supabase.from("settlements").insert({
        trip_id: tripId,
        from_user_id: paidBy,
        to_user_id: paidTo,
        amount,
        currency,
        converted_amount: convertedAmount,
        converted_currency: trip?.currency,
    })

    if (error) return { error: error.message }

    revalidatePath(`/trips/${tripId}`)
    redirect(`/trips/${tripId}`)
    return { success: true }
}

export async function deleteSettlement(settlementId: string, tripId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Not authenticated" }

    await supabase.from("settlements").delete().eq("id", settlementId)

    revalidatePath(`/trips/${tripId}`)
    return { success: true }
}
