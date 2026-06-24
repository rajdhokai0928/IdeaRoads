import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of IdeaRoads.",
};

const SECTIONS = [
  {
    heading: "Acceptance of Terms",
    body: "By accessing or using IdeaRoads, you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the service.",
  },
  {
    heading: "Use of the Service",
    body: "You may use IdeaRoads only for lawful purposes and in accordance with these terms. You agree not to use the service to submit spam, harass other users, or violate any applicable laws or regulations.",
  },
  {
    heading: "Your Content",
    body: "You retain ownership of any content you submit through IdeaRoads, including feedback posts, comments, and changelog entries. By submitting content, you grant IdeaRoads a license to display that content within the platform.",
  },
  {
    heading: "Accounts",
    body: "You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account. Notify us immediately of any unauthorized use of your account.",
  },
  {
    heading: "Self-Hosted Instances",
    body: "If you deploy a self-hosted instance of IdeaRoads, you are responsible for maintaining that infrastructure, keeping software up to date, and ensuring compliance with applicable laws in your jurisdiction.",
  },
  {
    heading: "Limitation of Liability",
    body: "To the maximum extent permitted by law, IdeaRoads shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.",
  },
  {
    heading: "Changes to Terms",
    body: "We may update these terms from time to time. Continued use of IdeaRoads after changes are posted constitutes acceptance of the updated terms.",
  },
  {
    heading: "Contact",
    body: "Questions about these terms? Contact us at legal@idearoads.com.",
  },
] as const;

export default function TermsPage() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-8">
        <p className="font-bold text-xs uppercase tracking-eyebrow text-muted-foreground">
          Legal
        </p>
        <h1 className="mt-4 font-black text-4xl tracking-normal text-foreground sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Last updated: June 24, 2026
        </p>

        <div className="mt-12 divide-y divide-border border-t border-border">
          {SECTIONS.map(({ heading, body }) => (
            <div className="py-8" key={heading}>
              <h2 className="font-bold text-lg text-foreground">{heading}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <Link
            className="text-sm font-semibold text-foreground transition-colors duration-150 hover:text-muted-foreground"
            href="/"
          >
            ← Back to IdeaRoads
          </Link>
        </div>
      </div>
    </section>
  );
}
