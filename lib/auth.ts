import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins/admin";
import { emailOTP } from "better-auth/plugins/email-otp";
import { magicLink } from "better-auth/plugins/magic-link";
import { headers } from "next/headers";
import { PRODUCT_NAME } from "@/config/platform";
import * as schema from "@/db/schema";
import { audit } from "@/lib/audit";
import { db } from "@/lib/db";
import { enqueueEmail } from "@/lib/email";
import { magicLinkTemplate } from "@/lib/email/templates/magic-link";
import { otpTemplate } from "@/lib/email/templates/otp";
import { env } from "@/lib/env";
import { adminBaseUrl, adminHost, portalBaseUrl, portalHost } from "@/lib/urls";

// Both application hosts are trusted request origins (CSRF/origin check). Under
// the two-host split each host sets its OWN host-only session cookie, so signing
// in on one never authenticates the other. Deduped in case they're equal.
const TRUSTED_ORIGINS = Array.from(
  new Set([env.NEXT_PUBLIC_APP_URL, adminBaseUrl(), portalBaseUrl()])
);

/**
 * A magic-link verification URL must land on the SAME host the person signed in
 * from, so the session cookie is set on that host (Workspace vs Portal). Better
 * Auth builds the URL from the configured baseURL (the admin host); rewrite its
 * origin to the host of the incoming sign-in request.
 */
async function rewriteToRequestHost(url: string): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("x-forwarded-host") ?? h.get("host");
    if (!host) {
      return url;
    }
    const proto =
      h.get("x-forwarded-proto") ??
      (host.includes("localhost") ? "http" : "https");
    const original = new URL(url);
    return new URL(
      original.pathname + original.search,
      `${proto}://${host}`
    ).toString();
  } catch {
    return url;
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.APP_SECRET,
  // Resolve the auth origin (OAuth redirect_uri, callbacks, etc.) PER-REQUEST
  // from the incoming host, constrained to our two known hosts. This makes
  // Google sign-in return to the host it started from — so it works on the
  // Portal host as well as the Workspace host — with no global mutable state
  // and no host-specific branches. Better Auth validates the resolved host
  // against `allowedHosts` (rejecting host-header injection) and clones the
  // request context internally. Requests without a host header (e.g. background
  // jobs) use `fallback` — the admin host — preserving prior behavior.
  baseURL: {
    allowedHosts: Array.from(
      new Set([adminHost(), portalHost()].filter((h): h is string => !!h))
    ),
    protocol: "auto",
    fallback: adminBaseUrl(),
  },
  trustedOrigins: TRUSTED_ORIGINS,
  socialProviders: {
    ...(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "magic-link", "email-otp"],
  },
  plugins: [
    admin({
      impersonationSessionDuration: 3600,
      allowImpersonatingAdmins: false,
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        // Point the verification link at the host the user signed in from, so
        // the resulting session cookie is scoped to that app (Workspace/Portal).
        const magicLinkUrl = await rewriteToRequestHost(url);

        // Never log recipient emails or sign-in URLs in production (PII + a live
        // credential). The dev log is a convenience for local sign-in without SMTP.
        if (env.NODE_ENV !== "production") {
          console.log(`[magic-link] recipient=${email} url=${magicLinkUrl}`);
        }

        const { html, text } = await magicLinkTemplate({
          email,
          magicLinkUrl,
        });

        await enqueueEmail({
          to: email,
          subject: `Sign in to ${PRODUCT_NAME}`,
          html,
          text,
        });

        await audit({
          action: "auth.magic_link_sent",
          actorEmail: email,
          description: `Magic link sent to ${email}`,
          entityType: "user",
          metadata: { email, url: magicLinkUrl },
        });
      },
    }),
    // One-time code sign-in — used by the embed widget so authentication
    // never needs a second tab (unlike the magic-link email, which has to be
    // opened somewhere): the visitor types the code back into the same
    // panel they requested it from. Better Auth's /sign-in/email-otp returns
    // a session directly (no redirect), so there's no host to get wrong.
    emailOTP({
      otpLength: 6,
      expiresIn: 600,
      sendVerificationOTP: async ({ email, otp }) => {
        // Never log recipient emails or OTP codes in production (PII + a live
        // credential). The dev log is a convenience for local sign-in without SMTP.
        if (env.NODE_ENV !== "production") {
          console.log(`[email-otp] recipient=${email} otp=${otp}`);
        }

        const { html, text } = await otpTemplate({ email, otp });

        await enqueueEmail({
          to: email,
          subject: `Your ${PRODUCT_NAME} sign-in code`,
          html,
          text,
        });

        await audit({
          action: "auth.otp_sent",
          actorEmail: email,
          description: `Sign-in code sent to ${email}`,
          entityType: "user",
          metadata: { email },
        });
      },
    }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await audit({
            action: "user.created",
            actorEmail: user.email,
            actorId: user.id,
            description: `User created: ${user.email}`,
            entityId: user.id,
            entityType: "user",
          });
        },
      },
    },
  },
});
