"use client";

import { useState } from "react";
import { deleteExpense } from "./expense-actions";
import { AddExpenseForm } from "./add-expense-form";
import { Button } from "@/components/ui/button";

type Expense = {
    id: string;
    title: string;
    description: string | null;
    amount: number;
    currency: string;
    converted_amount: number | null;
    converted_currency: string | null;
    category: string;
    paid_by: string;
    paid_date: string;
    split_type: string;
    created_by: string;
    expense_splits: { user_id: string; amount_owed: number }[];
};

type Member = {
    user_id: string;
    profiles: { display_name: string };
};

export function ExpenseList({
    expenses,
    profileMap,
    currentUserId,
    tripId,
    members,
}: {
    expenses: Expense[];
    profileMap: Record<string, string>;
    currentUserId: string;
    tripId: string;
    members: Member[];
}) {
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [addingNew, setAddingNew] = useState(false);

    return (
        <div>
            {(addingNew || editingExpense) && (
                <div className="mb-6">
                    <AddExpenseForm
                        key={editingExpense?.id ?? "new"}
                        tripId={tripId}
                        members={members}
                        currentUserId={currentUserId}
                        editExpense={editingExpense}
                        onDone={() => {
                            setEditingExpense(null);
                            setAddingNew(false);
                        }}
                    />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                            setEditingExpense(null);
                            setAddingNew(false);
                        }}
                        className="mt-2"
                    >
                        Cancel
                    </Button>
                </div>
            )}

            {!addingNew && !editingExpense && (
                <Button onClick={() => setAddingNew(true)} className="mb-4">
                    Add Expense
                </Button>
            )}

            <div className="space-y-3">
                {expenses.length === 0 ? (
                    <p className="text-muted-foreground">No expenses yet</p>
                ) : (
                    expenses.map((expense) => (
                        <div
                            key={expense.id}
                            className="p-4 bg-card rounded-xl border"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-semibold">
                                        {expense.title}
                                    </p>
                                    {expense.description && (
                                        <p className="text-sm text-muted-foreground">
                                            {expense.description}
                                        </p>
                                    )}
                                </div>
                                <p className="font-semibold text-right">
                                    <span>
                                        {expense.currency}{" "}
                                        {Number(expense.amount).toFixed(2)}
                                    </span>
                                    {expense.converted_currency &&
                                        expense.converted_currency !==
                                            expense.currency && (
                                            <span className="block text-xs text-muted-foreground">
                                                ≈ {expense.converted_currency}{" "}
                                                {Number(
                                                    expense.converted_amount,
                                                ).toFixed(2)}
                                            </span>
                                        )}
                                </p>
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground mt-2">
                                <span>
                                    Paid by {profileMap[expense.paid_by]} on{" "}
                                    {expense.paid_date}
                                </span>
                                <span className="capitalize">
                                    {expense.category}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Split {expense.split_type} among{" "}
                                {expense.expense_splits.length} people
                            </div>
                            {expense.created_by === currentUserId && (
                                <div className="flex gap-2 mt-2">
                                    <button
                                        onClick={() =>
                                            setEditingExpense(expense)
                                        }
                                        className="text-xs text-primary hover:underline"
                                    >
                                        Edit
                                    </button>
                                    <form
                                        action={async () => {
                                            if (
                                                confirm("Delete this expense?")
                                            ) {
                                                const result =
                                                    await deleteExpense(
                                                        expense.id,
                                                    );
                                                if (result?.error)
                                                    alert(result.error);
                                            }
                                        }}
                                    >
                                        <button
                                            type="submit"
                                            className="text-xs text-destructive hover:underline"
                                        >
                                            Delete
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
