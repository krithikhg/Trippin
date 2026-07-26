'use client'

import Link from "next/link";
import { Calendar, UsersRound, ArrowRight, ChevronRight } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { getTripStatus, getStatusBadge, formatDateRange, getSettlementBadge } from "@/lib/trips/helpers";
import type { Settlement } from "@/lib/trips/settlements";

type Trip = {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    memberCount: number;
};

type Props = {
    trips: Trip[];
    tripBalances: Record<string, { total: number; yourBalance: number }>;
    tripSettlements: Record<string, Settlement[]>;
    profileMap: Record<string, string>;
};

export function SettlementsTabs({ trips, tripBalances, tripSettlements, profileMap }: Props) {
    const unsettledTrips = trips.filter((trip) => (tripSettlements[trip.id] ?? []).length > 0);
    const settledTrips = trips.filter((trip) => (tripSettlements[trip.id] ?? []).length === 0);

    function renderTripCards(tripList: Trip[]) {
        return tripList.map((trip) => {
            const bal = tripBalances[trip.id] ?? { total: 0, yourBalance: 0 };
            const status = getTripStatus(trip.start_date, trip.end_date);
            const badge = getStatusBadge(status);
            const isSettled = (tripSettlements[trip.id] ?? []).length === 0;
            const settlementBadge = getSettlementBadge(isSettled);

            return (
                <Card key={trip.id} className="hover:shadow-md transition-shadow py-0">
                    <CardContent className="p-5">
                        <Link href={`/settlements/${trip.id}`} className="group block">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <span className="font-semibold text-xl group-hover:underline">
                                        {trip.name}
                                    </span>
                                    <span
                                        className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${badge.className}`}
                                    >
                                        {badge.label}
                                    </span>
                                    <span
                                        className={`ml-2 text-xs font-medium px-2 py-0.5 rounded ${settlementBadge.className}`}
                                    >
                                        {settlementBadge.label}
                                    </span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                            </div>
                            <div className="flex items-center gap-4 text-base text-muted-foreground mb-3">
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateRange(trip.start_date, trip.end_date)}
                                </span>
                                <span className="h-4 w-px bg-border" />
                                <span className="flex items-center gap-1">
                                    <UsersRound className="h-4 w-4" />
                                    {trip.memberCount} members
                                </span>
                            </div>
                        </Link>
                        <div className="flex items-center justify-between text-base">
                            <span className="text-muted-foreground">
                                Total expenses: S$ {bal.total.toFixed(2)}
                            </span>
                            <span
                                className={bal.yourBalance >= 0 ? "text-green" : "text-destructive"}
                            >
                                {bal.yourBalance >= 0
                                    ? `You are owed S$ ${bal.yourBalance.toFixed(2)}`
                                    : `You owe S$ ${Math.abs(bal.yourBalance).toFixed(2)}`}
                            </span>
                        </div>
                        {(tripSettlements[trip.id] ?? []).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-base text-muted-foreground mb-2">
                                    Settlements needed:
                                </p>
                                <div className="space-y-1">
                                    {tripSettlements[trip.id].map((s, i) => (
                                        <div key={i} className="flex items-center justify-between text-sm">
                                            <span>
                                                <span className="text-destructive">
                                                    {profileMap[s.fromUserId] ?? s.fromUserId}
                                                </span>
                                                <ArrowRight className="mx-1 h-3 w-3 text-muted-foreground inline" />
                                                <span className="text-green">
                                                    {profileMap[s.toUserId] ?? s.toUserId}
                                                </span>
                                            </span>
                                            <span className="font-medium">
                                                S$ {s.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            );
        });
    }

    return (
        <Tabs defaultValue="all">
            <TabsList>
                <TabsTrigger value="all">All Trips</TabsTrigger>
                <TabsTrigger value="unsettled">Unsettled</TabsTrigger>
                <TabsTrigger value="settled">Settled</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 mt-6">
                {renderTripCards(trips)}
            </TabsContent>

            <TabsContent value="unsettled" className="space-y-4 mt-6">
                {unsettledTrips.length > 0 ? (
                    renderTripCards(unsettledTrips)
                ) : (
                    <p className="text-muted-foreground">No unsettled trips</p>
                )}
            </TabsContent>

            <TabsContent value="settled" className="space-y-4 mt-6">
                {settledTrips.length > 0 ? (
                    renderTripCards(settledTrips)
                ) : (
                    <p className="text-muted-foreground">No settled trips</p>
                )}
            </TabsContent>
        </Tabs>
    );
}