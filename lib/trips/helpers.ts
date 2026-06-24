export type TripStatus = "upcoming" | "ongoing" | "completed";

export function getTripStatus(startDate: string, endDate: string): TripStatus {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (today < start) {
        return "upcoming";
    }
    if (today > end) {
        return "completed";
    }
    return "ongoing";
}

export function getStatusBadge(status: TripStatus) {
    switch (status) {
        case "ongoing":
            return {
                label: "ONGOING",
                className: "bg-green-100 text-green-700",
            };
        case "upcoming":
            return {
                label: "UPCOMING",
                className: "bg-blue-100 text-blue-700",
            };
        case "completed":
            return {
                label: "COMPLETED",
                className: "bg-gray-100 text-gray-700",
            };
    }
}

export function formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();

    const startDay = start.getDate();
    const endDay = end.getDate();

    if (sameMonth) {
        const monthYear = end.toLocaleDateString("en-SG", {
            month: "short",
            year: "numeric",
        });
        return `${startDay} - ${endDay} ${monthYear}`;
    }

    if (sameYear) {
        const startMonth = start.toLocaleDateString("en-SG", {
            month: "short",
        });
        const endMonthYear = end.toLocaleDateString("en-SG", {
            month: "short",
            year: "numeric",
        });
        return `${startDay} ${startMonth} - ${endDay} ${endMonthYear}`;
    }

    const startMonthYear = start.toLocaleDateString("en-SG", {
        month: "short",
        year: "numeric",
    });
    const endMonthYear = end.toLocaleDateString("en-SG", {
        month: "short",
        year: "numeric",
    });
    return `${startDay} ${startMonthYear} - ${endDay} ${endMonthYear}`;
}
