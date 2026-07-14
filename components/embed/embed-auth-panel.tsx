"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient, signIn } from "@/lib/auth-client";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface EmbedAuthPanelProps {
  onAuthenticated: () => void;
}

const POLL_INTERVAL_MS = 1500;
const POPUP_CHECK_INTERVAL_MS = 500;

// In-place sign-in for the embed widget: magic link + Google popup, both
// landing on /embed-auth-complete (never /signin) so a signed-in visitor
// never leaves the customer's page. Polls the session while waiting so
// either method resolves back into the widget with no manual "continue"
// step.
export function EmbedAuthPanel({ onAuthenticated }: EmbedAuthPanelProps) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const onAuthenticatedRef = useRef(onAuthenticated);
  onAuthenticatedRef.current = onAuthenticated;

  const callbackURL = "/embed-auth-complete";

  useEffect(() => {
    let cancelled = false;
    fetch("/api/embed/auth-config")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setGoogleEnabled(!!data.googleEnabled);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!(sent || googleLoading)) {
      return;
    }
    const interval = setInterval(async () => {
      const { data } = await authClient.getSession();
      if (data?.session) {
        clearInterval(interval);
        onAuthenticatedRef.current();
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sent, googleLoading]);

  useEffect(() => () => popupRef.current?.close(), []);

  async function handleMagicLinkSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);
    const result = await signIn.magicLink({ email, callbackURL });
    setSubmitting(false);
    if (result.error) {
      setFormError(
        result.error.message ?? "Something went wrong. Please try again."
      );
      return;
    }
    setSent(true);
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.url) {
        setFormError("Google sign-in failed. Please try again.");
        setGoogleLoading(false);
        return;
      }
      const popup = window.open(
        data.url,
        "ir-google-signin",
        "width=480,height=640"
      );
      if (!popup) {
        window.location.href = data.url;
        return;
      }
      popupRef.current = popup;
      const closeCheck = setInterval(() => {
        if (popup.closed) {
          clearInterval(closeCheck);
          setGoogleLoading(false);
        }
      }, POPUP_CHECK_INTERVAL_MS);
    } catch {
      setFormError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm font-medium text-ir-heading">Check your email</p>
        <p className="text-sm text-ir-muted">
          We sent a sign-in link to <strong>{email}</strong>. Click it to
          continue — this panel will pick it up automatically.
        </p>
        <Button
          onClick={() => setSent(false)}
          size="sm"
          type="button"
          variant="outline"
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <Button
            className="w-full gap-2"
            disabled={submitting || googleLoading}
            onClick={handleGoogleSignIn}
            type="button"
            variant="outline"
          >
            <GoogleIcon className="size-4" />
            {googleLoading ? "Waiting for Google…" : "Continue with Google"}
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-ir-border" />
            <span className="text-xs font-semibold uppercase tracking-ui text-ir-muted">
              or continue with email
            </span>
            <div className="h-px flex-1 bg-ir-border" />
          </div>
        </>
      )}

      <form className="space-y-3" onSubmit={handleMagicLinkSubmit}>
        <label className="block" htmlFor="embed-auth-email">
          <span className="mb-1.5 block text-sm font-medium text-ir-heading">
            Email
          </span>
          <Input
            autoComplete="email"
            disabled={submitting || googleLoading}
            id="embed-auth-email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>
        {formError && <p className="text-sm text-ir-danger">{formError}</p>}
        <Button
          className="w-full"
          disabled={submitting || googleLoading}
          type="submit"
        >
          {submitting ? "Sending…" : "Continue with email"}
        </Button>
      </form>
    </div>
  );
}
