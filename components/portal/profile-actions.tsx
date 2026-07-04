"use client";

import { Bell, LogOut, Pencil } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { AccountIdentityForms } from "@/components/profile/account-forms";
import { NotificationPreferencesForm } from "@/components/profile/notification-preferences-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ProfileActionsProps {
  email: string;
  image: string | null;
  name: string;
  notificationPrefs: {
    emailChangelog: boolean;
    emailNewComment: boolean;
    emailStatusChange: boolean;
    inAppChangelog: boolean;
    inAppNewComment: boolean;
    inAppStatusChange: boolean;
  };
}

export function ProfileActions({
  email,
  image,
  name,
  notificationPrefs,
}: ProfileActionsProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <Dialog>
        <DialogTrigger asChild>
          <button
            className="flex items-center justify-center gap-1.5 bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary/90"
            type="button"
          >
            <Pencil className="size-4" />
            Edit Profile
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>
              Update your profile picture, name, and email address.
            </DialogDescription>
          </DialogHeader>
          <AccountIdentityForms email={email} image={image} name={name} />
        </DialogContent>
      </Dialog>

      <Dialog>
        <DialogTrigger asChild>
          <button
            className="flex items-center justify-center gap-1.5 border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-muted"
            type="button"
          >
            <Bell className="size-4" />
            Notification Settings
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Notification settings</DialogTitle>
            <DialogDescription>
              Choose which email and in-app notifications you'd like to receive.
            </DialogDescription>
          </DialogHeader>
          <NotificationPreferencesForm initialPrefs={notificationPrefs} />
        </DialogContent>
      </Dialog>

      <button
        className="flex items-center justify-center gap-1.5 border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
        onClick={() => logoutAction()}
        type="button"
      >
        <LogOut className="size-4" />
        Sign Out
      </button>
    </div>
  );
}
