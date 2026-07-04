import Image from "next/image";
import Link from "next/link";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";
import { requireSession } from "@/lib/authz";
import { getPendingEmailChangeByToken } from "@/lib/profile/email-change";
import { ConfirmEmailButton } from "./_components/confirm-email-button";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ConfirmEmailChangePage({ params }: Props) {
  const { token } = await params;
  const session = await requireSession();
  const pending = await getPendingEmailChangeByToken(token);

  if (!pending) {
    return (
      <ConfirmEmailLayout>
        <ConfirmEmailStateCard
          body="This confirmation link is invalid or has already been used."
          heading="Link not found"
        />
      </ConfirmEmailLayout>
    );
  }

  if (pending.userId !== session.user.id) {
    return (
      <ConfirmEmailLayout>
        <ConfirmEmailStateCard
          body={`This confirmation link belongs to a different account. You're signed in as ${session.user.email}.`}
          heading="Wrong account"
          link={{ href: "/signin", label: "Sign in with a different account" }}
        />
      </ConfirmEmailLayout>
    );
  }

  if (pending.expiresAt <= new Date()) {
    return (
      <ConfirmEmailLayout>
        <ConfirmEmailStateCard
          body="This confirmation link has expired. Request the email change again from your account settings."
          heading="Link expired"
        />
      </ConfirmEmailLayout>
    );
  }

  return (
    <ConfirmEmailLayout>
      <div className="space-y-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-muted-foreground">
          Confirm email change
        </p>
        <h1 className="text-xl font-semibold text-foreground">
          Change your email to {pending.newEmail}?
        </h1>
        <p className="text-sm text-muted-foreground">
          Your current email stays active until you confirm.
        </p>
      </div>
      <div className="mt-6">
        <ConfirmEmailButton token={token} />
      </div>
    </ConfirmEmailLayout>
  );
}

function ConfirmEmailLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-page px-4 py-10">
      <div className="w-full max-w-sm">
        <Link
          className="mb-8 flex justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className="border border-border bg-background px-4 py-8 sm:px-8">
          {children}
        </div>
      </div>
    </main>
  );
}

function ConfirmEmailStateCard({
  heading,
  body,
  link,
}: {
  body: string;
  heading: string;
  link?: { href: string; label: string };
}) {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-lg font-semibold text-foreground">{heading}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      {link && (
        <Link
          className="inline-block text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground transition-colors duration-150"
          href={link.href}
        >
          {link.label}
        </Link>
      )}
    </div>
  );
}
