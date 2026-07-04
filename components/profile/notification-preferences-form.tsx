"use client";

import { useState } from "react";
import { toast } from "sonner";
import { updateNotificationPreferencesAction } from "@/app/actions/notifications";

interface Prefs {
  emailChangelog: boolean;
  emailNewComment: boolean;
  emailStatusChange: boolean;
  inAppChangelog: boolean;
  inAppNewComment: boolean;
  inAppStatusChange: boolean;
}

interface NotificationPreferencesFormProps {
  initialPrefs: Prefs;
}

function PreferenceRow({
  label,
  description,
  emailEnabled,
  inAppEnabled,
  onEmailChange,
  onInAppChange,
  emailDisabled,
  inAppDisabled,
}: {
  label: string;
  description: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  onEmailChange: (v: boolean) => void;
  onInAppChange: (v: boolean) => void;
  emailDisabled: boolean;
  inAppDisabled: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <div className="flex items-center gap-6 shrink-0">
        <label className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            Email
          </span>
          <button
            aria-checked={emailEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${
              emailEnabled ? "bg-primary" : "bg-muted"
            }`}
            disabled={emailDisabled}
            onClick={() => onEmailChange(!emailEnabled)}
            role="switch"
            type="button"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                emailEnabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
        <label className="flex flex-col items-center gap-1 cursor-pointer">
          <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
            In-app
          </span>
          <button
            aria-checked={inAppEnabled}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed ${
              inAppEnabled ? "bg-primary" : "bg-muted"
            }`}
            disabled={inAppDisabled}
            onClick={() => onInAppChange(!inAppEnabled)}
            role="switch"
            type="button"
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                inAppEnabled ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </label>
      </div>
    </div>
  );
}

export function NotificationPreferencesForm({
  initialPrefs,
}: NotificationPreferencesFormProps) {
  const [prefs, setPrefs] = useState<Prefs>(initialPrefs);
  // Tracks which individual switches are in flight, so clicking one doesn't
  // disable every switch in the form (each preference updates independently).
  const [pendingKeys, setPendingKeys] = useState<Set<keyof Prefs>>(new Set());

  function handleChange(key: keyof Prefs, value: boolean) {
    const previous = prefs[key];
    setPrefs((p) => ({ ...p, [key]: value }));
    setPendingKeys((prev) => new Set(prev).add(key));

    updateNotificationPreferencesAction({ [key]: value })
      .then((result) => {
        if (!result.success) {
          setPrefs((p) => ({ ...p, [key]: previous })); // rollback
          toast.error(result.error);
        }
      })
      .finally(() => {
        setPendingKeys((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      });
  }

  return (
    <div className="border border-border divide-y divide-border">
      <div className="px-4 py-3 bg-muted/40 flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Notification type
        </span>
        <div className="flex items-center gap-6 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span className="w-9 whitespace-nowrap text-center">Email</span>
          <span className="w-9 whitespace-nowrap text-center">In-app</span>
        </div>
      </div>

      <div className="divide-y divide-border px-4">
        <PreferenceRow
          description="When a post you voted on changes status (e.g. Planned, In Progress)"
          emailDisabled={pendingKeys.has("emailStatusChange")}
          emailEnabled={prefs.emailStatusChange}
          inAppDisabled={pendingKeys.has("inAppStatusChange")}
          inAppEnabled={prefs.inAppStatusChange}
          label="Status changes"
          onEmailChange={(v) => handleChange("emailStatusChange", v)}
          onInAppChange={(v) => handleChange("inAppStatusChange", v)}
        />
        <PreferenceRow
          description="When someone comments on your post or replies to your comment"
          emailDisabled={pendingKeys.has("emailNewComment")}
          emailEnabled={prefs.emailNewComment}
          inAppDisabled={pendingKeys.has("inAppNewComment")}
          inAppEnabled={prefs.inAppNewComment}
          label="Comments & Replies"
          onEmailChange={(v) => handleChange("emailNewComment", v)}
          onInAppChange={(v) => handleChange("inAppNewComment", v)}
        />
        <PreferenceRow
          description="When a new changelog entry is published for a post you voted on"
          emailDisabled={pendingKeys.has("emailChangelog")}
          emailEnabled={prefs.emailChangelog}
          inAppDisabled={pendingKeys.has("inAppChangelog")}
          inAppEnabled={prefs.inAppChangelog}
          label="Changelog updates"
          onEmailChange={(v) => handleChange("emailChangelog", v)}
          onInAppChange={(v) => handleChange("inAppChangelog", v)}
        />
      </div>
    </div>
  );
}
