"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      setEmail(user.email ?? "");

      const { data: profile } = await supabase.from("profiles")
        .select("display_name, avatar_url, updated_at")
        .eq("id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
        setAvatarUrl(profile.avatar_url);
        setUpdatedAt(profile.updated_at);
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  }

  function formatUpdatedAt(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleString("en-SG", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSave() {
    if (!displayName.trim()) {
      toast.error("Display name cannot be empty.");
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        setSaving(false);
        toast.error("Failed to save changes. Please try again.");
        return;
    };

    let newAvatarUrl = avatarUrl;

    if (avatarFile) {
      const fileExt = avatarFile.name.split(".").pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) {
        toast.error("Failed to upload photo. Please try again.");
        setSaving(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      newAvatarUrl = publicUrl;
    }

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        avatar_url: newAvatarUrl,
      })
      .eq("id", user.id)
      .select("updated_at")
      .single();

    if (updateError) {
      toast.error("Failed to save changes. Please try again.");
      setSaving(false);
      return;
    }

    setAvatarUrl(newAvatarUrl);
    setAvatarFile(null);
    setAvatarPreview(null);
    setUpdatedAt(updated.updated_at);
    toast.success("Profile updated successfully!");
    setSaving(false);
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-center text-4xl font-serif text-heading">My Profile</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile photo</CardTitle>
          <CardDescription>
            Add a photo to personalise your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-3">
          <Avatar className="w-24 h-24 text-2xl">
            {(avatarPreview || avatarUrl) && (
                <AvatarImage
                    src={avatarPreview ?? avatarUrl ?? ""}
                    alt={displayName}
                />
            )}

            <AvatarFallback className="bg-primary text-primary-foreground text-3xl">
              {displayName ? getInitials(displayName) : "?"}
            </AvatarFallback>
          </Avatar>
          <label className="flex items-center gap-2 cursor-pointer border border-primary text-primary rounded-md px-4 py-2 text-sm font-medium hover:bg-primary/10 transition-colors">
            <Camera className="w-4 h-4" />
            Change photo
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </label>

          {(avatarPreview || avatarUrl) && (
            <button
              onClick={() => {
                setAvatarFile(null);
                setAvatarPreview(null);
                setAvatarUrl(null);
              }}
              className="text-xs text-destructive hover:underline"
            >
              Remove photo
            </button>
          )}

          <p className="text-xs text-muted-foreground">
            JPG or PNG. Max size 5MB.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Profile information</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Display name</p>
            <p className="text-xs text-muted-foreground">
              This is how your name will appear to other users
            </p>
            <input
              type="text"
              maxLength={50}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <span className="text-xs text-muted-foreground text-right">
              {displayName.length}/50
            </span>
          </div>

          <hr className="border-border" />

          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Email address</p>
            <p className="text-xs text-muted-foreground">
              To change the email address tied to your account, please go to Account Settings
            </p>
            <div className="mt-2 relative">
              <input
                type="email"
                value={email}
                disabled
                className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground pr-10 cursor-not-allowed"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <LockKeyhole className="w-4 h-4" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

        <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
            {saving ? "Saving..." : "Save changes"}
        </button>

      {updatedAt && (
        <p className="text-xs text-muted-foreground text-center">
          Last updated {formatUpdatedAt(updatedAt)}
        </p>
      )}
    </div>
  );
}