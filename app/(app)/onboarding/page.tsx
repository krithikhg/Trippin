"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { UserRound } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  async function handleSubmit() {
    if (!displayName.trim()) {
      setError("Please enter a display name.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated.");
      setLoading(false);
      return;
    }

    let avatarUrl = null;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        setError("Failed to upload avatar. Please try again.");
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      avatarUrl = publicUrl;
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id,
      display_name: displayName.trim(),
      avatar_url: avatarUrl,
    });

    if (profileError) {
      setError("Failed to create profile. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/home");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif italic">
            Welcome to Trippin!
          </CardTitle>
          <CardDescription>
            Let&apos;s set up your profile before you get started.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col items-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-24 h-24 text-2xl">
              <AvatarImage src={avatarPreview ?? ""} alt="Avatar preview" />
              <AvatarFallback>
                {displayName ? getInitials(displayName) : <UserRound className="w-12 h-12 text-muted-foreground" />}
              </AvatarFallback>
            </Avatar>
            <label className="cursor-pointer text-sm text-muted-foreground hover:text-primary transition-colors">
              Upload photo (optional)
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </label>
          </div>

          <div className="w-full flex flex-col gap-1">
            <label className="text-sm font-medium">Display name</label>
            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground text-right">
              {displayName.length}/50
            </span>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? "Setting up..." : "Let's go!"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}