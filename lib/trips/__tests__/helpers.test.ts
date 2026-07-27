import { describe, it, expect, vi, beforeAll, afterAll } from "vitest"
import { getTripStatus, getStatusBadge, formatDateRange } from "../helpers"

describe("getTripStatus", () => {
    beforeAll(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date("2026-06-15"))
    })

    afterAll(() => {
        vi.useRealTimers()
    })

    it("returns 'upcoming' when today is before start date", () => {
        expect(getTripStatus("2026-07-01", "2026-07-10")).toBe("upcoming")
    })

    it("returns 'ongoing' when today is within the trip range", () => {
        expect(getTripStatus("2026-06-10", "2026-06-20")).toBe("ongoing")
    })

    it("returns 'completed' when today is after end date", () => {
        expect(getTripStatus("2026-05-01", "2026-05-10")).toBe("completed")
    })
})

describe("getStatusBadge", () => {
    it("returns correct label for ongoing", () => {
        expect(getStatusBadge("ongoing").label).toBe("ONGOING")
    })

    it("returns correct label for upcoming", () => {
        expect(getStatusBadge("upcoming").label).toBe("UPCOMING")
    })

    it("returns correct label for completed", () => {
        expect(getStatusBadge("completed").label).toBe("COMPLETED")
    })
})

describe("formatDateRange", () => {
    it("formats same month range", () => {
        expect(formatDateRange("2026-06-05", "2026-06-12")).toMatch(/5.*12.*Jun.*2026/)
    })

    it("formats cross-month same-year range", () => {
        expect(formatDateRange("2026-06-25", "2026-07-09")).toMatch(/25.*Jun.*9.*Jul.*2026/)
    })

    it("formats cross-year range", () => {
        expect(formatDateRange("2025-12-28", "2026-01-03")).toMatch(/28.*Dec.*2025.*3.*Jan.*2026/)
    })
})
