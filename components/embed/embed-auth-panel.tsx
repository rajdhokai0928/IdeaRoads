"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

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

const POPUP_CHECK_INTERVAL_MS = 500;
const GOOGLE_CALLBACK_URL = "/embed-auth-complete";

type Step = "email" | "otp";

// In-place sign-in for the embed widget: a one-time code (never a link) plus
// an optional Google popup — both resolve without ever navigating the
// visitor away from the host page. The code is entered directly into this
// panel, so unlike a magic-link email there's no second tab to lose track
// of and no host to get wrong: /sign-in/email-otp returns a session in the
// same response, synchronously.
export function EmbedAuthPanel({ onAuthenticated }: EmbedAuthPanelProps) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const onAuthenticatedRef = useRef(onAuthenticated);
  onAuthenticatedRef.current = onAuthenticated;

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
    if (!googleLoading) {
      return;
    }
    const interval = setInterval(async () => {
      const { data } = await authClient.getSession();
      if (data?.session) {
        clearInterval(interval);
        onAuthenticatedRef.current();
      }
    }, POPUP_CHECK_INTERVAL_MS * 3);
    return () => clearInterval(interval);
  }, [googleLoading]);

  // The Google popup is the only path left that can complete outside this
  // component's direct control (its own window, its own redirect chain), so
  // recheck immediately whenever the tab regains focus rather than waiting
  // on the poll above.
  useEffect(() => {
    let cancelled = false;
    async function checkSession() {
      const { data } = await authClient.getSession();
      if (!cancelled && data?.session) {
        onAuthenticatedRef.current();
      }
    }
    function onVisible() {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", checkSession);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", checkSession);
    };
  }, []);

  useEffect(() => () => popupRef.current?.close(), []);

  async function sendCode() {
    setFormError(null);
    const result = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "sign-in",
    });
    if (result.error) {
      setFormError(
        result.error.message ?? "Something went wrong. Please try again."
      );
      return false;
    }
    return true;
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSendingCode(true);
    const ok = await sendCode();
    setSendingCode(false);
    if (ok) {
      setStep("otp");
    }
  }

  async function handleResend() {
    setResending(true);
    await sendCode();
    setResending(false);
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setVerifying(true);
    const result = await authClient.signIn.emailOtp({
      email,
      otp,
      name: name.trim() || undefined,
    });
    setVerifying(false);
    if (result.error) {
      setFormError(result.error.message ?? "Invalid code. Please try again.");
      return;
    }
    onAuthenticatedRef.current();
  }

  async function handleGoogleSignIn() {
    setFormError(null);
    setGoogleLoading(true);
    try {
      const res = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "google",
          callbackURL: GOOGLE_CALLBACK_URL,
        }),
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

  if (step === "otp") {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm font-medium text-ir-heading">Enter your code</p>
          <p className="mt-1 text-sm text-ir-muted">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>
        </div>

        <form className="space-y-3" onSubmit={handleOtpSubmit}>
          <label className="block" htmlFor="embed-auth-otp">
            <span className="mb-1.5 block text-sm font-medium text-ir-heading">
              Code
            </span>
            <Input
              autoComplete="one-time-code"
              autoFocus
              className="text-center font-mono text-lg tracking-[0.3em]"
              id="embed-auth-otp"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setOtp(event.target.value.replace(/\D/g, ""))
              }
              placeholder="000000"
              required
              value={otp}
            />
          </label>
          <label className="block" htmlFor="embed-auth-name">
            <span className="mb-1.5 block text-sm font-medium text-ir-heading">
              Your name{" "}
              <span className="font-normal text-ir-muted">
                (only needed if you're new here)
              </span>
            </span>
            <Input
              autoComplete="name"
              id="embed-auth-name"
              onChange={(event) => setName(event.target.value)}
              placeholder="Jane Doe"
              value={name}
            />
          </label>
          {formError && <p className="text-sm text-ir-danger">{formError}</p>}
          <Button
            className="w-full"
            disabled={verifying || otp.length < 6}
            type="submit"
          >
            {verifying ? "Verifying…" : "Verify code"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs">
          <button
            className="font-medium text-ir-muted hover:text-ir-heading hover:underline"
            onClick={() => {
              setStep("email");
              setOtp("");
              setFormError(null);
            }}
            type="button"
          >
            Use a different email
          </button>
          <button
            className="font-medium text-ir-primary hover:underline disabled:opacity-50"
            disabled={resending}
            onClick={handleResend}
            type="button"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {googleEnabled && (
        <>
          <Button
            className="w-full gap-2"
            disabled={sendingCode || googleLoading}
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

      <form className="space-y-3" onSubmit={handleEmailSubmit}>
        <label className="block" htmlFor="embed-auth-email">
          <span className="mb-1.5 block text-sm font-medium text-ir-heading">
            Email
          </span>
          <Input
            autoComplete="email"
            disabled={sendingCode || googleLoading}
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
          disabled={sendingCode || googleLoading}
          type="submit"
        >
          {sendingCode ? "Sending code…" : "Continue with email"}
        </Button>
      </form>
    </div>
  );
}
