"use client";

import { useState, useCallback } from "react";
import { addExpense, updateExpense } from "./expense-actions";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Member = {
    user_id: string;
    profiles: { display_name: string };
};

type EditExpense = {
    id: string;
    title: string;
    description: string | null;
    amount: number;
    currency: string;
    category: string;
    paid_by: string;
    paid_date: string;
    split_type: string;
    expense_splits: { user_id: string; amount_owed: number }[];
};

type MemberSplit = {
    userId: string;
    displayName: string;
    amount: string;
    percent: string;
    selected: boolean;
};

function round2(n: number): string {
    return n.toFixed(2);
}

function round1(n: number): string {
    return n.toFixed(1);
}

export function AddExpenseForm({
    tripId,
    members,
    currentUserId,
    editExpense,
    onDone,
}: {
    tripId: string;
    members: Member[];
    currentUserId: string;
    editExpense?: EditExpense | null;
    onDone?: () => void;
}) {
    const initialSplits = editExpense
        ? members.map((m) => {
              const existing = editExpense.expense_splits.find(
                  (s) => s.user_id === m.user_id,
              );
              return {
                  userId: m.user_id,
                  displayName: m.profiles.display_name,
                  amount: existing ? String(existing.amount_owed) : "",
                  percent: existing
                      ? (
                            (existing.amount_owed / editExpense.amount) *
                            100
                        ).toFixed(1)
                      : "",
                  selected: !!existing,
              };
          })
        : [];

    const [splitType, setSplitType] = useState<"equal" | "custom">(
        (editExpense?.split_type as "equal" | "custom") ?? "equal",
    );
    const [totalAmount, setTotalAmount] = useState(editExpense?.amount ?? 0);
    const [memberSplits, setMemberSplits] =
        useState<MemberSplit[]>(initialSplits);
    const [paidDate, setPaidDate] = useState<Date | undefined>(
        editExpense?.paid_date ? new Date(editExpense.paid_date) : new Date(),
    );

    const updateMember = useCallback(
        (userId: string, updates: Partial<MemberSplit>) => {
            setMemberSplits((prev) =>
                prev.map((m) =>
                    m.userId === userId ? { ...m, ...updates } : m,
                ),
            );
        },
        [],
    );

    const recalcFromAmount = useCallback(
        (userId: string, amountStr: string) => {
            if (!totalAmount) return;
            const amt = parseFloat(amountStr) || 0;
            const pct = (amt / totalAmount) * 100;
            updateMember(userId, {
                amount: amountStr,
                percent: pct ? round1(pct) : "0.0",
            });
        },
        [totalAmount, updateMember],
    );

    const recalcFromPercent = useCallback(
        (userId: string, percentStr: string) => {
            if (!totalAmount) return;
            const pct = parseFloat(percentStr) || 0;
            const amt = (totalAmount * pct) / 100;
            updateMember(userId, {
                percent: percentStr,
                amount: amt ? round2(amt) : "0.00",
            });
        },
        [totalAmount, updateMember],
    );

    function initMemberSplits() {
        setMemberSplits(
            members.map((m) => ({
                userId: m.user_id,
                displayName: m.profiles.display_name,
                amount: "",
                percent: "",
                selected: true,
            })),
        );
    }

    const selectedSplits = memberSplits.filter((m) => m.selected);
    const balancerIdx = selectedSplits.length - 1;
    const balancerUserId = selectedSplits[balancerIdx]?.userId;

    function getAutoAmount(m: MemberSplit): string {
        if (m.userId !== balancerUserId || !totalAmount) return m.amount;
        const othersSum = selectedSplits
            .slice(0, -1)
            .reduce((s, o) => s + (parseFloat(o.amount) || 0), 0);
        return round2(totalAmount - othersSum);
    }

    function getAutoPercent(m: MemberSplit): string {
        if (m.userId !== balancerUserId || !totalAmount) return m.percent;
        const othersSum = selectedSplits
            .slice(0, -1)
            .reduce((s, o) => s + (parseFloat(o.percent) || 0), 0);
        return round1(100 - othersSum);
    }

    return (
        <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);

                if (splitType === "custom" && totalAmount) {
                    for (const m of memberSplits) {
                        if (!m.selected) continue;
                        const amt =
                            parseFloat(
                                m.userId === balancerUserId
                                    ? getAutoAmount(m)
                                    : m.amount,
                            ) || 0;

                        if (totalAmount > 0 && amt < 0) {
                            alert("Invalid amount!");
                            return;
                        }

                        if (totalAmount < 0 && amt > 0) {
                            alert("Invalid amount!");
                            return;
                        }
                    }
                }

                for (const m of memberSplits) {
                    if (m.selected) {
                        formData.append("memberId", m.userId);
                        formData.append(`amount-${m.userId}`, getAutoAmount(m));
                    }
                }
                formData.set("tripId", tripId);

                if (editExpense) {
                    formData.set("expenseId", editExpense.id);
                }
                const result = editExpense
                    ? await updateExpense(formData)
                    : await addExpense(formData);
                if (result?.error) {
                    alert(result.error);
                } else {
                    setMemberSplits([]);
                    setTotalAmount(0);
                    onDone?.();
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
                    defaultValue={editExpense?.title ?? ""}
                    className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="description" className="text-sm font-medium">
                    Description (optional)
                </label>
                <textarea
                    id="description"
                    name="description"
                    rows={2}
                    defaultValue={editExpense?.description ?? ""}
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
                        value={totalAmount || ""}
                        onChange={(e) => {
                            const v = parseFloat(e.target.value) || 0;
                            setTotalAmount(v);
                            if (splitType === "custom" && v > 0) {
                                setMemberSplits((prev) =>
                                    prev.map((m) => {
                                        if (!m.selected || !m.amount)
                                            return { ...m, percent: "0.0" };
                                        const pct =
                                            (parseFloat(m.amount) / v) * 100;
                                        return { ...m, percent: round1(pct) };
                                    }),
                                );
                            }
                        }}
                        className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="category" className="text-sm font-medium">
                        Category
                    </label>
                    <select
                        id="category"
                        name="category"
                        required
                        defaultValue={editExpense?.category ?? ""}
                        className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="food">Food & Dining</option>
                        <option value="transport">Transport</option>
                        <option value="activity">Activity</option>
                        <option value="accommodation">Accommodation</option>
                        <option value="others">Other</option>
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
                        defaultValue={editExpense?.paid_by ?? currentUserId}
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
                    <label className="text-sm font-medium">Date</label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal",
                                    !paidDate && "text-muted-foreground",
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {paidDate
                                    ? format(paidDate, "PPP")
                                    : "Select date"}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={paidDate}
                                onSelect={setPaidDate}
                            />
                        </PopoverContent>
                    </Popover>
                    <input
                        type="hidden"
                        name="paidDate"
                        value={paidDate ? format(paidDate, "yyyy-MM-dd") : ""}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-1">
                <label htmlFor="currency" className="text-sm font-medium">
                    Currency
                </label>
                <select
                    id="currency"
                    name="currency"
                    required
                    className="border border-input bg-background rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-ring"
                    defaultValue={editExpense?.currency ?? "SGD"}
                >
                    <option value="SGD">SGD</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="JPY">JPY</option>
                    <option value="GBP">GBP</option>
                    <option value="MYR">MYR</option>
                    <option value="AUD">AUD</option>
                    <option value="CNY">CNY</option>
                    <option value="THB">THB</option>
                    <option value="KRW">KRW</option>
                </select>
            </div>

            {/* Split type toggle */}
            <div className="flex items-center gap-2">
                <p className="text-sm font-medium">Split type</p>
                <div className="flex rounded-md border border-input overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setSplitType("equal")}
                        className={`px-3 py-1 text-sm ${
                            splitType === "equal"
                                ? "bg-primary text-primary-foreground"
                                : "bg-background"
                        }`}
                    >
                        Equal
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setSplitType("custom");
                            if (memberSplits.length === 0) initMemberSplits();
                        }}
                        className={`px-3 py-1 text-sm ${
                            splitType === "custom"
                                ? "bg-primary text-primary-foreground"
                                : "bg-background"
                        }`}
                    >
                        Custom
                    </button>
                </div>
            </div>

            <input type="hidden" name="splitType" value={splitType} />

            {/* Member splits */}
            {splitType === "equal" ? (
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Split with</p>
                    <div className="flex flex-wrap gap-3">
                        {members.map((m) => {
                            const split = memberSplits.find(
                                (s) => s.userId === m.user_id,
                            );
                            const selected = split?.selected ?? true;
                            return (
                                <label
                                    key={m.user_id}
                                    className="flex items-center gap-1.5 text-sm"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected}
                                        onChange={() => {
                                            if (memberSplits.length === 0)
                                                initMemberSplits();
                                            setMemberSplits((prev) =>
                                                prev.map((s) =>
                                                    s.userId === m.user_id
                                                        ? {
                                                              ...s,
                                                              selected:
                                                                  !s.selected,
                                                          }
                                                        : s,
                                                ),
                                            );
                                        }}
                                        className="accent-primary"
                                    />
                                    {m.profiles.display_name}
                                </label>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-1">
                    <p className="text-sm font-medium">Custom split</p>
                    <div className="space-y-2">
                        <div className="grid grid-cols-[auto_1fr_80px_80px_auto] gap-2 text-xs text-muted-foreground px-2">
                            <span></span>
                            <span>Member</span>
                            <span className="text-right">Amount</span>
                            <span className="text-right">%</span>
                            <span></span>
                        </div>
                        {memberSplits.map((m) => {
                            const i = selectedSplits.findIndex(
                                (s) => s.userId === m.userId,
                            );
                            const isBalancer = m.selected && i === balancerIdx;
                            const autoAmount = getAutoAmount(m);
                            const autoPercent = getAutoPercent(m);

                            return (
                                <div
                                    key={m.userId}
                                    className="grid grid-cols-[auto_1fr_80px_80px_auto] gap-2 items-center"
                                >
                                    <input
                                        type="checkbox"
                                        checked={m.selected}
                                        onChange={() => {
                                            updateMember(m.userId, {
                                                selected: !m.selected,
                                            });
                                        }}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm">
                                        {m.displayName}
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={
                                            isBalancer ? autoAmount : m.amount
                                        }
                                        onChange={(e) => {
                                            if (!m.selected || isBalancer)
                                                return;
                                            recalcFromAmount(
                                                m.userId,
                                                e.target.value,
                                            );
                                        }}
                                        disabled={isBalancer}
                                        className={`w-full border border-input rounded-md p-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                                            isBalancer
                                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                : "bg-background"
                                        }`}
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        placeholder="0.0"
                                        value={
                                            isBalancer ? autoPercent : m.percent
                                        }
                                        onChange={(e) => {
                                            if (!m.selected || isBalancer)
                                                return;
                                            recalcFromPercent(
                                                m.userId,
                                                e.target.value,
                                            );
                                        }}
                                        disabled={isBalancer}
                                        className={`w-full border border-input rounded-md p-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
                                            isBalancer
                                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                : "bg-background"
                                        }`}
                                    />
                                    {isBalancer && (
                                        <span className="text-xs text-muted-foreground">
                                            auto
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="flex gap-2 mt-2">
                <Button type="submit" className="flex-1">
                    {editExpense ? "Update Expense" : "Add Expense"}
                </Button>
                <Button type="button" variant="outline" onClick={onDone}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
