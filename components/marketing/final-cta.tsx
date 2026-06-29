import { Button } from "../ui/button";
import Link from "next/link";

export function FinalCta() {
  return (
    <section className="border-t border-border bg-muted overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-8">
        <h2 className="font-black text-3xl text-foreground sm:text-4xl">
          Ready to ship what your users actually want?
        </h2>

        <p className="mt-3 text-lg text-muted-foreground">
          No credit card required. Voters never pay a seat fee.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="btn-liquid"
            data-text="Start Free"
            size="lg"
          >
            <Link href="/login">Start Free</Link>
          </Button>
          <Button
            asChild
            className="btn-liquid"
            data-text="See How It Works"
            size="lg"
            variant="outline"
          >
            <Link href="#how-it-works">See How It Works</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
