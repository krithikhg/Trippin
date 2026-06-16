"use client";

import { useState } from "react";
import { addExpense } from "./expense-actions";
import { Button } from "@/components/ui/button";

//define a Member struct
type Member = {
    user_id: string;
    profiles: { display_name: string };
};

export function AddExpenseForm({
    tripId,
    members,
    currentUserId,
}: {
    tripId: string;
    members: Member[];
    currentUserId: string;
}) {
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMembers, setSelectedMembers] = useState<Set<string>>(
        new Set(members.map((m) => m.id)),
    );

    if (!showForm) {
        return (
            <div className="mt-8">
                <Button onClick={() => setShowForm(true)}>Add Expense</Button>
            </div>
        );
    }

    return (
        <div className="mt-8 p-4 bg-card rounded-xl border">
            <h3 className="text-lg font-semibold mb-4">Add Expense</h3>

            <form
                className="flex flex-col gap-4"
                onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const formData = new FormData(form);

                    // Append each selected member's id individually
                    // This gives us multiple 'memberId' entries in formData
                    for (const id of selectedMembers) {
                        formData.append("memberId", id);
                    }
                    formData.set("tripId", tripId);

                    const result = await addExpense(formData);
                    if (result?.error) {
                        alert(result.error);
                    } else {
                        setShowForm(false);
                        form.reset();
                        setSelectedMembers(
                            new Set(members.map((m) => m.user_id)),
                        );
                    }
                }}
            >
                <div className="flex flex-col gap-1">
                    <label htmlFor="title" className="text-sm font-medium">
                        Title
                    </label>
                    <input
                        id="title"
                        name="title"
                        type="text"
                        required
                        className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label
                        htmlFor="description"
                        className="text-sm font-medium"
                    >
                        Description (optional)
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        rows={2}
                        className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="amount" className="text-sm font-medium">
                            Amount
                        </label>
                        <input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="category"
                            className="text-sm font-medium"
                        >
                            Category
                        </label>
                        <select
                            id="category"
                            name="category"
                            required
                            className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            <option value="Food & Dining">Food & Dining</option>
                            <option value="Transport">Transport</option>
                            <option value="Accommodation">Accommodation</option>
                            <option value="Activities">Activities</option>
                            <option value="Shopping">Shopping</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="paidBy" className="text-sm font-medium">
                            Paid by
                        </label>
                        <select
                            id="paidBy"
                            name="paidBy"
                            required
                            defaultValue={currentUserId}
                            className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                            {members.map((m) => (
                                <option key={m.user_id} value={m.user_id}>
                                    {m.profiles.display_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label
                            htmlFor="paidDate"
                            className="text-sm font-medium"
                        >
                            Date
                        </label>
                        <input
                            id="paidDate"
                            name="paidDate"
                            type="date"
                            required
                            defaultValue={
                                new Date().toISOString().split("T")[0]
                            }
                            className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor="currency" className="text-sm font-medium">
                        Currency
                    </label>
                    <input
                        id="currency"
                        name="currency"
                        type="text"
                        defaultValue="SGD"
                        required
                        className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>
                {/* Split with — checkboxes for each member */}
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Split with</p>
                    <div className="flex flex-wrap gap-3">
                        {members.map((m) => (
                            <label
                                key={m.user_id}
                                className="flex items-center gap-1.5 text-sm"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedMembers.has(m.user_id)}
                                    onChange={(e) => {
                                        const next = new Set(selectedMembers);
                                        if (e.target.checked) {
                                            next.add(m.user_id);
                                        } else {
                                            next.delete(m.user_id);
                                        }
                                        setSelectedMembers(next);
                                    }}
                                    className="accent-primary"
                                />
                                {m.profiles.display_name}
                            </label>
                        ))}
                    </div>
                </div>
                <div className="flex gap-2 mt-2">
                    <Button type="submit" className="flex-1">
                        Add Expense
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowForm(false)}
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}
