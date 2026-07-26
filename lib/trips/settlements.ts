export type Settlement = {
    fromUserId: string
    toUserId: string
    amount: number
}

/**
 * This function takes net balances (positive - is owed, negative - owes others)
 * Returns a compressed set of recommended payments to settle all debts
 */

 export function computeSettlements(balances: Record<string, number>): Settlement[] {
     const entries = Object.entries(balances)
         .filter(([_, b]) => Math.abs(b) > 0.01)
         .map(([userId, balance]) => ({ userId, balance }))

     const debtors = entries
         .filter(e => e.balance < 0)
         .sort((a, b) => a.balance - b.balance)

     const creditors = entries
         .filter(e => e.balance > 0)
         .sort((a, b) => b.balance - a.balance)

     const settlements: Settlement[] = []

     while (debtors.length > 0 && creditors.length > 0) {
         const debtor = debtors[0]
         const creditor = creditors[0]
         const amount = Math.round(Math.min(Math.abs(debtor.balance), creditor.balance) * 100) / 100

         settlements.push({
             fromUserId: debtor.userId,
             toUserId: creditor.userId,
             amount,
         })

         debtor.balance += amount
         creditor.balance -= amount

         if (Math.abs(debtor.balance) < 0.01) debtors.shift()
         if (creditor.balance < 0.01) creditors.shift()
     }

     return settlements
 }

 export type ExpenseForBalance = {
  trip_id: string;
  paid_by: string;
  amount: number;
  converted_amount: number | null;
  expense_splits: { user_id: string; amount_owed: number }[];
};

export type SettlementForBalance = {
  trip_id: string;
  from_user_id: string;
  to_user_id: string;
  converted_amount: number;
};

export function computeYourBalanceForTrip(
  tripId: string,
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[],
  userId: string,
): { total: number; yourBalance: number } {
  let total = 0;
  let yourBalance = 0;

  for (const e of expenses.filter((e) => e.trip_id === tripId)) {
    const amt = e.converted_amount ?? e.amount;
    total += amt;
    if (e.paid_by === userId) yourBalance += amt;
    for (const split of e.expense_splits) {
      if (split.user_id === userId) yourBalance -= split.amount_owed;
    }
  }

  for (const s of settlements.filter((s) => s.trip_id === tripId)) {
    if (s.from_user_id === userId) yourBalance += s.converted_amount;
    if (s.to_user_id === userId) yourBalance -= s.converted_amount;
  }

  return { total, yourBalance };
}