import Link from "next/link";
import { PRODUCT_NAME } from "@/config/platform";

export function PoweredByBadge() {
  return (
    <Link
      className="fixed bottom-4 right-4 z-20 flex items-center gap-1.5 border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm transition-colors duration-150 hover:text-foreground"
      href="/"
      rel="noopener noreferrer"
      target="_blank"
    >
      Powered by {PRODUCT_NAME}
    </Link>
  );
}
