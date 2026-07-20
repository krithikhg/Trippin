import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { AccountSettings } from "./account-settings";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <AccountSettings currentEmail={user.email ?? ""} />;
}