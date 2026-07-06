import { AuthForm } from "@/app/(auth)/_components/auth-form";
import { env } from "@/lib/env";
import { isFeatureEnabled } from "@/lib/orbit/feature-flags";

export const metadata = {
  title: "Get started",
};

export default async function LoginPage() {
  // Google sign-in requires both OAuth credentials AND the platform-wide
  // `google_auth` feature flag (an Orbit Admin can disable it without a deploy).
  // It works on both the Workspace and Portal hosts — Better Auth resolves the
  // OAuth origin per-request (see baseURL in lib/auth.ts) so the callback always
  // returns to the host the user started from — so it is offered wherever it is
  // configured, on either host.
  const googleConfigured = !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
  const googleEnabled =
    googleConfigured && (await isFeatureEnabled("google_auth"));
  return <AuthForm googleEnabled={googleEnabled} />;
}
