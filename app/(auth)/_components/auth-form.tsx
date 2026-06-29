"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";
import { signIn, useSession } from "@/lib/auth-client";

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


function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
    </svg>
  );
}

const URL_ERROR_MESSAGES: Record<string, string> = {
  INVALID_TOKEN:
    "This sign-in link has expired or has already been used. Please request a new one.",
  EXPIRED_TOKEN: "This sign-in link has expired. Please request a new one.",
  access_denied: "Sign-in was cancelled.",
  OAuthAccountNotLinked:
    "An account with this email already exists. Please sign in using your original method.",
};

interface AuthFormProps {
  googleEnabled: boolean;
}

export function AuthForm({ googleEnabled }: AuthFormProps) {
  return (
    <Suspense fallback={null}>
      <AuthFormInner googleEnabled={googleEnabled} />
    </Suspense>
  );
}

function AuthFormInner({ googleEnabled }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const urlErrorCode = searchParams.get("error");
  const urlError = urlErrorCode
    ? (URL_ERROR_MESSAGES[urlErrorCode] ??
      "Something went wrong. Please try again.")
    : null;

  const callbackURL = searchParams.get("next") ?? "/post-auth";

  useEffect(() => {
    if (session) {
      router.replace("/post-auth");
    }
  }, [router, session]);

  if (isPending || session) {
    return null;
  }

  async function onSubmit(event: { preventDefault(): void }) {
    event.preventDefault();
    setFormError(null);
    setSubmitting(true);

    const result = await signIn.magicLink({ callbackURL, email });

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
      const result = await signIn.social({ provider: "google", callbackURL });
      if (result?.error) {
        setFormError(
          result.error.message ?? "Google sign-in failed. Please try again."
        );
        setGoogleLoading(false);
      }
    } catch {
      setFormError("Google sign-in failed. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <main className="bg-page relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Glass card */}
      <div
        className="relative z-10 w-full max-w-4xl mx-4 flex overflow-hidden"
        style={{
          borderRadius: "1rem",
          background: "rgba(250, 240, 230, 0.22)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 4px 6px rgba(0,0,0,0.04), 0 12px 40px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255,255,255,0.55)",
        }}
      >
        {/* Left — form panel */}
        <div
          className="flex flex-col justify-center w-full md:w-1/2 px-10 py-12"
          style={{
            borderRadius: "1rem 0 0 1rem",
            background: "rgba(255, 251, 248, 0.82)",
          }}
        >
          {sent ? (
            /* ── Email sent state ── */
            <div className="space-y-6">
              {/* Logo */}
              <Link href="/">
                <Image
                  alt={PRODUCT_NAME}
                  className="h-10 w-auto"
                  height={164}
                  priority
                  src={LOGO_PATH}
                  width={500}
                />
              </Link>

              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-wide text-gray-900 uppercase">
                  Check Your Email
                </h1>
                <p className="text-sm leading-relaxed text-gray-500">
                  Your sign-in link is on its way to{" "}
                  <strong className="text-gray-700">{email}</strong>. Check your
                  inbox and spam folder.
                </p>
              </div>

              <button
                className="w-full border border-gray-300 bg-white py-3 text-xs font-bold uppercase tracking-widest text-gray-600 transition hover:bg-gray-50"
                onClick={() => setSent(false)}
                style={{ borderRadius: "0.5rem" }}
                type="button"
              >
                Use a different email
              </button>

              <Link
                className="block text-center text-xs font-semibold uppercase tracking-widest transition hover:underline"
                href="/"
                style={{ color: "oklch(0.512 0.088 40)" }}
              >
                ← Back to home
              </Link>
            </div>
          ) : (
            /* ── Login form ── */
            <div className="space-y-6">
              {/* Logo */}
              <Link href="/">
                <Image
                  alt={PRODUCT_NAME}
                  className="h-10 w-auto"
                  height={164}
                  priority
                  src={LOGO_PATH}
                  width={500}
                />
              </Link>

              {/* Heading + description */}
              <div className="space-y-2">
                <h1 className="text-2xl font-extrabold tracking-wide text-gray-900 uppercase">
                  Sign In
                </h1>
                <p className="text-sm leading-relaxed text-gray-500">
                  Enter your email and we&apos;ll send you a magic link —{" "}
                  no password needed.
                </p>
              </div>

              {/* Error */}
              {(urlError || formError) && (
                <div
                  className="p-3 text-sm"
                  style={{
                    borderRadius: "0.5rem",
                    background: "oklch(0.575 0.092 40 / 0.08)",
                    color: "oklch(0.452 0.082 40)",
                  }}
                >
                  {urlError ?? formError}
                </div>
              )}

              {/* Google button */}
              {googleEnabled && (
                <button
                  className="flex w-full items-center justify-center gap-3 border border-gray-300 bg-white py-3 text-xs font-bold uppercase tracking-widest text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                  disabled={submitting || googleLoading}
                  onClick={handleGoogleSignIn}
                  style={{ borderRadius: "0.5rem" }}
                  type="button"
                >
                  {googleLoading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  ) : (
                    <GoogleIcon className="h-4 w-4" />
                  )}
                  {googleLoading ? "Redirecting…" : "Continue with Google"}
                </button>
              )}

              {/* Divider */}
              {googleEnabled && (
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs text-gray-400">or continue with email</span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
              )}

              {/* Email form */}
              <form className="space-y-1" onSubmit={onSubmit}>
                <label
                  className="block text-xs font-bold uppercase tracking-widest text-gray-800"
                  htmlFor="email"
                >
                  Email Address
                </label>
                <input
                  autoComplete="email"
                  className="w-full border-0 border-b-2 border-gray-200 bg-transparent px-0 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-b-2"
                  id="email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{
                    borderBottomColor: "oklch(0.800 0.065 40)",
                  }}
                  type="email"
                  value={email}
                />

                <div className="pt-5">
                  <button
                    className="flex w-full items-center justify-center gap-2.5 py-3 text-xs font-bold uppercase tracking-widest text-white transition disabled:opacity-60"
                    disabled={submitting || googleLoading}
                    style={{
                      borderRadius: "0.5rem",
                      background: submitting
                        ? "oklch(0.452 0.082 40)"
                        : "linear-gradient(135deg, oklch(0.512 0.088 40) 0%, oklch(0.575 0.092 40) 100%)",
                    }}
                    type="submit"
                  >
                    <span className="h-4 w-4">
                      <SendIcon />
                    </span>
                    {submitting ? "Sending…" : "Send Magic Link"}
                  </button>
                </div>
              </form>

              {/* Divider */}
              <div className="h-px w-full bg-gray-200" />

              {/* Terms */}
              <div>
                <p className="text-xs leading-relaxed text-gray-400">
                  By signing in you agree to our{" "}
                  <Link
                    className="underline transition hover:text-gray-600"
                    href="/terms"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    className="underline transition hover:text-gray-600"
                    href="/privacy"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right — illustration */}
        <div className="hidden md:flex md:w-1/2 items-center justify-center overflow-hidden p-8">
          <Image
            alt="Login illustration"
            className="w-full h-auto object-contain"
            height={560}
            priority
            src="/login-ILLU.svg"
            width={460}
          />
        </div>
      </div>
    </main>
  );
}
