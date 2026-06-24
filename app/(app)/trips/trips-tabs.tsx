"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, UsersRound, ChevronRight, Check, Copy } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    getTripStatus,
    getStatusBadge,
    formatDateRange,
} from "@/lib/trips/helpers";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "@/components/ui/table";
import { useState } from "react";

type Trip = {
    id: string;
    name: string;
    destination: string;
    start_date: string;
    end_date: string;
    invite_code: string;
    memberCount: number;
};

function CompletedTripsTable({ trips }: { trips: Trip[] }) {
    const router = useRouter();

    return (
        <div className="bg-card rounded-xl shadow-sm overflow-hidden">
            <Table className="[&_th]:px-4 [&_td]:px-4 [&_th]:py-3 [&_td]:py-3">
                <TableHeader>
                    <TableRow className="border-border">
                        <TableHead className="font-bold">Trip</TableHead>
                        <TableHead className="font-bold">Duration</TableHead>
                        <TableHead className="font-bold">Members</TableHead>
                        <TableHead className="w-5"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {trips.map((trip) => (
                        <TableRow
                            key={trip.id}
                            className="cursor-pointer hover:bg-muted/50 border-border"
                            onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                            <TableCell className="font-medium">
                                {trip.name}
                            </TableCell>
                            <TableCell>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    {formatDateRange(
                                        trip.start_date,
                                        trip.end_date,
                                    )}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <UsersRound className="h-4 w-4" />
                                    {trip.memberCount} members
                                </span>
                            </TableCell>
                            <TableCell>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

function CopyInviteCode({ code }: { code: string }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
            Invite code:{" "}
            <code className="bg-muted text-primary px-2 py-1 rounded">
                {code}
            </code>
            <button
                type="button"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-primary transition-colors"
            >
                {copied ? (
                    <Check className="h-3 w-3" />
                ) : (
                    <Copy className="h-3 w-3" />
                )}
            </button>
        </p>
    );
}

function TripCard({ trip }: { trip: Trip }) {
    const tripStatus = getTripStatus(trip.start_date, trip.end_date);
    const statusBadge = getStatusBadge(tripStatus);

    return (
        <Link href={`/trips/${trip.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle className="font-serif italic text-2xl font-bold">
                            {trip.name}
                        </CardTitle>
                        <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${statusBadge.className}`}
                        >
                            {statusBadge.label}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
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
                    <CopyInviteCode code={trip.invite_code} />
                </CardContent>
            </Card>
        </Link>
    );
}

export function TripsTabs({
    activeTrips,
    completedTrips,
}: {
    activeTrips: Trip[];
    completedTrips: Trip[];
}) {
    return (
        <Tabs defaultValue="all">
            <TabsList>
                <TabsTrigger value="all">All Trips</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-8 mt-6">
                {activeTrips.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Active Trips ({activeTrips.length})
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeTrips.map((trip) => (
                                <TripCard key={trip.id} trip={trip} />
                            ))}
                        </div>
                    </div>
                )}
                {completedTrips.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold mb-4">
                            Completed Trips ({completedTrips.length})
                        </h2>
                        <CompletedTripsTable trips={completedTrips} />
                    </div>
                )}
            </TabsContent>

            <TabsContent value="active" className="mt-6">
                {activeTrips.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activeTrips.map((trip) => (
                            <TripCard key={trip.id} trip={trip} />
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No active trips</p>
                )}
            </TabsContent>

            <TabsContent value="completed" className="mt-6">
                {completedTrips.length > 0 ? (
                    <CompletedTripsTable trips={completedTrips} />
                ) : (
                    <p className="text-muted-foreground">No completed trips</p>
                )}
            </TabsContent>
        </Tabs>
    );
}
