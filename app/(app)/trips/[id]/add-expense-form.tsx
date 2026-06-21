"use client";

import { useState, useCallback } from "react";
import { addExpense } from "./expense-actions";
import { Button } from "@/components/ui/button";

type Member = {
    user_id: string;
    profiles: { display_name: string };
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
}: {
    tripId: string;
    members: Member[];
    currentUserId: string;
}) {
    const [showForm, setShowForm] = useState(false);
    const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
    const [totalAmount, setTotalAmount] = useState(0);
    const [memberSplits, setMemberSplits] = useState<MemberSplit[]>([]);

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
                                alert(`Invalid amount!`);
                                return;
                            }

                            if (totalAmount < 0 && amt > 0) {
                                alert(`Invalid amount!`);
                                return;
                            }
                        }
                    }

                    for (const m of memberSplits) {
                        if (m.selected) {
                            formData.append("memberId", m.userId);
                            formData.append(
                                `amount-${m.userId}`,
                                getAutoAmount(m),
                            );
                        }
                    }
                    formData.set("tripId", tripId);

                    const result = await addExpense(formData);
                    if (result?.error) {
                        alert(result.error);
                    } else {
                        setShowForm(false);
                        setMemberSplits([]);
                        setTotalAmount(0);
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
                            onChange={(e) => {
                                const v = parseFloat(e.target.value) || 0;
                                setTotalAmount(v);
                                if (splitType === "custom" && v > 0) {
                                    setMemberSplits((prev) =>
                                        prev.map((m) => {
                                            if (!m.selected || !m.amount)
                                                return { ...m, percent: "0.0" };
                                            const pct =
                                                (parseFloat(m.amount) / v) *
                                                100;
                                            return {
                                                ...m,
                                                percent: round1(pct),
                                            };
                                        }),
                                    );
                                }
                            }}
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
                            <option value="food">Food & Dining</option>
                            <option value="transport">Transport</option>
                            <option value="activity">Activity</option>
                            <option value="accomodation">Accommodation</option>
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

                {/* Split type toggle */}
                <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Split type</p>
                    <div className="flex rounded-md border border-input overflow-hidden">
                        <button
                            type="button"
                            onClick={() => setSplitType("equal")}
                            className={`px-3 py-1 text-sm ${splitType === "equal" ? "bg-primary text-primary-foreground" : "bg-background"}`}
                        >
                            Equal
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSplitType("custom");
                                if (memberSplits.length === 0)
                                    initMemberSplits();
                            }}
                            className={`px-3 py-1 text-sm ${splitType === "custom" ? "bg-primary text-primary-foreground" : "bg-background"}`}
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
                                const isBalancer =
                                    m.selected && i === balancerIdx;
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
                                                isBalancer
                                                    ? autoAmount
                                                    : m.amount
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
                                            className={`w-full border border-input rounded-md p-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring ${isBalancer ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-background"}`}
                                        />
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            max="100"
                                            placeholder="0.0"
                                            value={
                                                isBalancer
                                                    ? autoPercent
                                                    : m.percent
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
                                            className={`w-full border border-input rounded-md p-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring ${isBalancer ? "bg-muted text-muted-foreground cursor-not-allowed" : "bg-background"}`}
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
