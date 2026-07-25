"use client"

import { useState } from "react"
import { recordSettlement } from "./settlement-actions"
import { CurrencyCombobox } from "../currency-combobox"
import { Card, CardContent } from "@/components/ui/card"

type Props = {
    tripId: string
    members: { user_id: string; profiles: { display_name: string } }[]
}

export function SettlementForm({ tripId, members }: Props) {
    const [currency, setCurrency] = useState("SGD")

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                <form
                    action={recordSettlement}
                    className="flex items-end gap-3"
                >
                    <input type="hidden" name="tripId" value={tripId} />
                    <input type="hidden" name="currency" value={currency} />
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Who paid</label>
                        <select name="paidBy" required
                            className="border-input bg-background rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select</option>
                            {members.map(m => (
                                <option key={m.user_id} value={m.user_id}>{m.profiles.display_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Who received</label>
                        <select name="paidTo" required
                            className="border-input bg-background rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="">Select</option>
                            {members.map(m => (
                                <option key={m.user_id} value={m.user_id}>{m.profiles.display_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Amount</label>
                        <input name="amount" type="number" step="0.01" min="0.01" required
                            className="border-input bg-background rounded-md p-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">Currency</label>
                        <CurrencyCombobox value={currency} onChange={setCurrency} />
                    </div>
                    <button type="submit"
                        className="bg-primary text-primary-foreground rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/90"
                    >
                        Record
                    </button>
                </form>
            </CardContent>
        </Card>
    )
}