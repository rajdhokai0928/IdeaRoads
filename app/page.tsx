import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Comparison } from "@/components/marketing/comparison";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { FinalCta } from "@/components/marketing/final-cta";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { LiveDemo } from "@/components/marketing/live-demo";
import { Nav } from "@/components/marketing/nav";
import { ProblemFraming } from "@/components/marketing/problem-framing";
import { ProductTour } from "@/components/marketing/product-tour";
import { PageTransition } from "@/components/motion/page-transition";
import { LOGO_PATH, PRODUCT_NAME } from "@/config/platform";
import { getCurrentSession } from "@/lib/authz";

const TITLE = `${PRODUCT_NAME} — Collect feedback, ship faster, close the loop`;
const DESCRIPTION =
  "Customer feedback boards, voting, public roadmap, and changelog for product teams. Notify every voter automatically when you ship.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: PRODUCT_NAME,
    type: "website",
    images: [{ url: LOGO_PATH }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [LOGO_PATH],
  },
};

export default async function HomePage() {
  const session = await getCurrentSession();
  if (session) {
    redirect("/post-auth");
  }

  return (
    <div className="min-h-screen bg-ir-background">
      <Nav />
      <PageTransition>
        <main>
          <Hero />
          {/* <TrustBar /> */}
          <ProblemFraming />
          <ProductTour />
          <FeaturesGrid />
          <LiveDemo />
          <Comparison />
          <FinalCta />
        </main>
      </PageTransition>
      <Footer />
      <script
        src="http://portal.localhost:3000/widget.js"
        data-workspace="kalua-workspaces"
        data-board="feature-requests"
        data-mode="button"
        data-position="bottom-right"
        data-theme="light"
        data-width="500"
        data-height="700"
        data-accent-color="#e5e0e0"
      ></script>
    </div>
  );
}
