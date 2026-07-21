"use client";

import { useState } from "react";
import { Mail, Lock, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

interface Props {
  currentEmail: string;
}

export function AccountSettings({ currentEmail }: Props) {
  const supabase = createClient();

  //email change state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  async function handleChangeEmail() {
    if (!newEmail || newEmail === currentEmail) {
      toast.error("Please enter a new, different email address.");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: newEmail });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Verification email sent to your new address.");
      setEmailDialogOpen(false);
      setNewEmail("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsUpdatingEmail(false);
    }
  }

  //password change state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  async function handleChangePassword() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      // Verify the current password is correct before allowing the change
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: currentEmail,
        password: currentPassword,
      });

      if (signInError) {
        toast.error("Current password is incorrect.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        toast.error(updateError.message);
        return;
      }

      toast.success("Password updated successfully.");
      setPasswordDialogOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  //delete account state
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  async function handleDeleteAccount() {
    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.rpc("delete_own_account");

      if (error) {
        toast.error(error.message);
        return;
      }

      await supabase.auth.signOut();
      toast.success("Account deleted");
      window.location.href = "/login";
    } catch (error) {
      toast.error("Failed to delete account. Please try again.");
    } finally {
      setIsDeletingAccount(false);
      setDeleteDialogOpen(false);
      setDeleteConfirmText("");
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-center text-4xl font-serif">Account Settings</h1>
      </div>

      {/* Email Address */}
      <Card className="border-border">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-heading">
                Email Address (linked to account)
              </p>
              <p className="text-foreground mt-1">{currentEmail}</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-primary text-primary hover:bg-secondary hover:text-primary"
                >
                  Change email address
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="font-serif text-xl font-semibold text-center">
                    Change email address
                  </DialogTitle>
                  <DialogDescription>
                    A verification email will be sent to your new email address
                    to confirm the change.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-2">
                  <Label htmlFor="new-email">New email address</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                  />
                </div>

                <Button onClick={handleChangeEmail} disabled={isUpdatingEmail}>
                  {isUpdatingEmail ? "Sending..." : "Send verification email"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEmailDialogOpen(false)}
                >
                  Cancel
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-border">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-heading">Password</p>
              <p className="text-foreground mt-1 text-lg">* * * * * * * *</p>
            </div>
          </div>

          <Dialog
            open={passwordDialogOpen}
            onOpenChange={setPasswordDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="shrink-0 border-primary text-primary hover:bg-secondary hover:text-primary"
              >
                Change password
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl font-semibold text-center">
                  Change password
                </DialogTitle>
                <DialogDescription>
                  Enter your current password and create a new password.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm new password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleChangePassword}
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? "Updating..." : "Update password"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Delete Account */}
      <Card className="border-destructive/30">
        <CardContent className="flex items-start justify-between gap-4 p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-destructive">Delete Account</p>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all data. <br />
                This action cannot be undone.
              </p>
            </div>
          </div>

          <Dialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open);
              if (!open) setDeleteConfirmText("");
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Delete account
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl font-semibold text-center">
                  Delete Account
                </DialogTitle>
                <DialogDescription>
                  This will permanently delete your account and all data
                  associated with it. This action cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-2">
                <Label htmlFor="delete-confirm">
                  Type{" "}
                  <span className="font-semibold text-destructive">DELETE</span>{" "}
                  to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                />
              </div>

              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== "DELETE"}
              >
                {isDeletingAccount ? "Deleting..." : "Yes, delete my account"}
              </Button>

              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
