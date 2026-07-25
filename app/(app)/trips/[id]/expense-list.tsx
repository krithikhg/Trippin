"use client";

import { useState } from "react";
import { deleteExpense } from "./expense-actions";
import { AddExpenseForm } from "./add-expense-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";

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
    const [dialogOpen, setDialogOpen] = useState(false);

    function openAddDialog() {
        setEditingExpense(null);
        setDialogOpen(true);
    }

    function openEditDialog(expense: Expense) {
        setEditingExpense(expense);
        setDialogOpen(true);
    }

    function closeDialog() {
        setEditingExpense(null);
        setDialogOpen(false);
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                    {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                </p>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={openAddDialog} size="lg">
                            <Plus className="h-4 w-4" />
                            Add Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-serif text-heading text-center">
                                {editingExpense
                                    ? "Edit Expense"
                                    : "Add Expense"}
                            </DialogTitle>
                        </DialogHeader>
                        <AddExpenseForm
                            key={editingExpense?.id ?? "new"}
                            tripId={tripId}
                            members={members}
                            currentUserId={currentUserId}
                            editExpense={editingExpense}
                            onDone={closeDialog}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {expenses.length === 0 ? (
                    <p className="text-muted-foreground">No expenses yet</p>
                                    ) : (
                                        expenses.map((expense) => (
                                            <Card key={expense.id}>
                                                <CardContent className="px-6 py-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-bold text-2xl font-serif">
                                                                {expense.title}
                                                            </p>
                                                            {expense.description && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {expense.description}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <p className="font-bold text-lg text-right whitespace-nowrap">
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
                                                    <div className="flex justify-between text-base text-muted-foreground mt-2">
                                                        <span>
                                                            Paid by {profileMap[expense.paid_by]} on{" "}
                                                            {new Date(expense.paid_date).toLocaleDateString("en-SG", {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric"
                                                            })}
                                                        </span>
                                                        <span className="capitalize">
                                                            {expense.category}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Split {expense.split_type} among{" "}
                                                        {expense.expense_splits.length} people
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditDialog(expense)}
                                                            className="text-sm text-primary hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                if (confirm("Delete this expense?")) {
                                                                    const result = await deleteExpense(expense.id);
                                                                    if (result?.error) alert(result.error);
                                                                }
                                                            }}
                                                            className="text-sm text-destructive hover:underline"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    }