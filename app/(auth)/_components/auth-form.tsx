"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, Suspense, useEffect, useState } from "react";
import { useIsEmbedded } from "@/components/embed/use-is-embedded";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const isEmbedded = useIsEmbedded();
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

  const rawNext = searchParams.get("next") ?? "/post-auth";
  // Prevent open redirect: only allow relative paths (not protocol-relative // or absolute URLs)
  const callbackURL =
    rawNext.startsWith("/") && !rawNext.startsWith("//")
      ? rawNext
      : "/post-auth";

  useEffect(() => {
    if (session) {
      router.replace(callbackURL);
    }
  }, [router, session, callbackURL]);

  if (isPending || session) {
    return null;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
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
    <main className="grid min-h-screen place-items-center overflow-y-auto bg-ir-primary-light/20 px-4 py-6 sm:py-8">
      <div className="grid w-full max-w-3xl overflow-hidden rounded-ir-xl border border-ir-border bg-ir-surface shadow-ir-lg lg:grid-cols-2">
        {/* Left — sign-in form */}
        <div className="flex flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
          {/* Inside the embed widget's iframe, this logo would otherwise
              navigate the whole panel to the marketing homepage — render it
              as plain branding, not a link, when embedded. */}
          {isEmbedded ? (
            <div className="mb-6 flex justify-center lg:justify-start">
              <Image
                alt={PRODUCT_NAME}
                className="h-9 w-auto"
                height={164}
                priority
                src={LOGO_PATH}
                width={500}
              />
            </div>
          ) : (
            <Link
              className="mb-6 flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ir-primary/40 lg:justify-start"
              href="/"
            >
              <Image
                alt={PRODUCT_NAME}
                className="h-9 w-auto"
                height={164}
                priority
                src={LOGO_PATH}
                width={500}
              />
            </Link>
          )}

          <h1 className="text-xl font-bold text-ir-heading sm:text-2xl">
            {sent ? "Check your email" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-ir-muted">
            {sent
              ? "Your sign-in link is on its way. Click it to continue."
              : "Sign in or create a free account — no password needed."}
          </p>

          <div className="mt-6">
            {sent ? (
              <div className="space-y-3">
                <p className="rounded-ir-sm bg-ir-success/10 p-3 text-sm text-ir-success">
                  Sign-in link sent to <strong>{email}</strong>. Check your
                  inbox and spam folder.
                </p>
                <Button
                  className="w-full"
                  onClick={() => setSent(false)}
                  type="button"
                  variant="outline"
                >
                  Use a different email
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {urlError && (
                  <p className="rounded-ir-sm bg-ir-danger/10 p-3 text-sm text-ir-danger">
                    {urlError}
                  </p>
                )}

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
                      {googleLoading ? "Redirecting…" : "Continue with Google"}
                    </Button>

                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-ir-border" />
                      <span className="text-xs font-semibold tracking-ui text-ir-muted uppercase">
                        or continue with email
                      </span>
                      <div className="h-px flex-1 bg-ir-border" />
                    </div>
                  </>
                )}

                <form className="space-y-3" onSubmit={onSubmit}>
                  <label className="block" htmlFor="email">
                    <span className="mb-1.5 block text-sm font-semibold text-ir-heading">
                      Email
                    </span>
                    <Input
                      autoComplete="email"
                      id="email"
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      required
                      type="email"
                      value={email}
                    />
                  </label>
                  {formError && (
                    <p className="rounded-ir-sm bg-ir-danger/10 p-3 text-sm text-ir-danger">
                      {formError}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    <Button
                      className="w-full"
                      disabled={submitting || googleLoading}
                      type="submit"
                    >
                      {submitting ? "Sending…" : "Continue with email"}
                    </Button>
                    <p className="text-center text-xs text-ir-muted">
                      New here? We'll create your account automatically.
                    </p>
                  </div>
                </form>
              </div>
            )}
          </div>

          {!sent && (
            <p className="mt-6 text-center text-xs text-ir-muted lg:text-left">
              By continuing you agree to our{" "}
              <Link
                className="text-ir-body underline hover:no-underline"
                href="/terms"
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                className="text-ir-body underline hover:no-underline"
                href="/privacy"
              >
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </div>

        {/* Right — brand panel, hidden below the split-screen breakpoint */}
        <div className="hidden flex-col items-center justify-center gap-5 overflow-hidden bg-ir-primary-light/15 px-8 py-8 lg:flex">
          <h2 className="max-w-sm text-center text-xl font-bold text-ir-heading">
            Ship what your users actually want.
          </h2>
          <Image
            alt="A feature roadmap with upvoted ideas, trending feedback, and a voting box — capturing how IdeaRoads turns user feedback into a shared product roadmap"
            className="h-auto w-full"
            height={1123}
            src="/auth-illustration.png"
            width={1401}
          />
        </div>
      </div>
    </main>
  );
}
