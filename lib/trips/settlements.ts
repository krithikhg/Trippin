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
