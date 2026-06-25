import { createClient } from "@/utils/supabase/server";

export default async function SettlementsPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    return (
        <div>
            <h1 className="text-4xl font-serif italic text-heading mb-2">
                Settlements
            </h1>
            <p className="text-muted-foreground">Settlements coming soon</p>
        </div>
    );
}
