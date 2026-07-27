import { describe, it, expect } from "vitest"
import { computeSettlements } from "../settlements"

describe("computeSettlements", () => {
    it("returns empty array when all balances are zero", () => {
        expect(computeSettlements({ alice: 0, bob: 0 })).toEqual([])
    })

    it("settles simple two-person debt", () => {
        const result = computeSettlements({ alice: 25, bob: -25 })
        expect(result).toEqual([
            { fromUserId: "bob", toUserId: "alice", amount: 25 },
        ])
    })

    it("settles multi-person debt with one creditor", () => {
        const result = computeSettlements({ alice: 50, bob: -20, charlie: -30 })
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ fromUserId: "charlie", toUserId: "alice", amount: 30 })
        expect(result[1]).toEqual({ fromUserId: "bob", toUserId: "alice", amount: 20 })
    })

    it("settles multi-person debt with one debtor", () => {
        const result = computeSettlements({ alice: -50, bob: 20, charlie: 30 })
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ fromUserId: "alice", toUserId: "charlie", amount: 30 })
        expect(result[1]).toEqual({ fromUserId: "alice", toUserId: "bob", amount: 20 })
    })

    it("compresses circular debts optimally", () => {
        const result = computeSettlements({ alice: 10, bob: 20, charlie: -30 })
        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({ fromUserId: "charlie", toUserId: "bob", amount: 20 })
        expect(result[1]).toEqual({ fromUserId: "charlie", toUserId: "alice", amount: 10 })
    })

    it("handles fractional amounts correctly", () => {
        const result = computeSettlements({ alice: 15.33, bob: -15.33 })
        expect(result).toEqual([
            { fromUserId: "bob", toUserId: "alice", amount: 15.33 },
        ])
    })

    it("ignores balances below 0.01 threshold", () => {
        const result = computeSettlements({ alice: 0.005, bob: -0.005 })
        expect(result).toEqual([])
    })
})
