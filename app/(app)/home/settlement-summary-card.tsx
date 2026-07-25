import Link from "next/link";
import { ArrowUpRight, ArrowDownLeft, PiggyBank, ChevronRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function SettlementSummaryCard({
  totalYouOwe,
  totalOwedToYou,
  tripsYouOweCount,
  tripsOwedToYouCount,
}: {
  totalYouOwe: number;
  totalOwedToYou: number;
  tripsYouOweCount: number;
  tripsOwedToYouCount: number;
}) {
  return (
    <Card className="shadow-sm px-4 py-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl font-semibold font-serif">
          <PiggyBank className="h-6 w-6" />
          Settlement Summary
        </CardTitle>
        <Link
          href="/settlements"
          className="text-sm text-primary flex items-center gap-1 hover:underline"
        >
          View details
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardHeader>

        <CardContent className="pt-0">
        <div className="grid grid-cols-2 gap-4 relative">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2" />

            <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                <ArrowUpRight className="h-5 w-5 text-destructive" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">You owe</p>
                <p className="text-2xl font-bold text-destructive">S$ {totalYouOwe.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                to {tripsYouOweCount} trip{tripsYouOweCount !== 1 ? "s" : ""}
                </p>
            </div>
            </div>
            <div className="flex items-center gap-3 px-5">
            <div className="h-10 w-10 rounded-full bg-green/10 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="h-5 w-5 text-green" />
            </div>
            <div>
                <p className="text-sm text-muted-foreground">Owed to you</p>
                <p className="text-2xl font-bold text-green">S$ {totalOwedToYou.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                from {tripsOwedToYouCount} trip{tripsOwedToYouCount !== 1 ? "s" : ""}
                </p>
            </div>
            </div>
        </div>
        </CardContent>
    </Card>
  );
}