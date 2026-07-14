"use client";

import { useEffect, useState } from "react";

// Shared landing page for both the Google popup and the magic-link email —
// self-closes when opened as a popup (window.opener set); otherwise (the
// magic-link email opened a new tab) shows a short confirmation, since
// EmbedAuthPanel in the original tab is already polling the session and
// will pick this up on its own.
export default function EmbedAuthCompletePage() {
  const [canAutoClose, setCanAutoClose] = useState(true);

  useEffect(() => {
    if (!window.opener) {
      setCanAutoClose(false);
      return;
    }
    window.close();
    const timer = setTimeout(() => setCanAutoClose(false), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="grid min-h-screen place-items-center bg-ir-background px-4">
      <div className="max-w-sm text-center">
        <p className="text-base font-semibold text-ir-heading">
          You're signed in.
        </p>
        <p className="mt-1.5 text-sm text-ir-muted">
          {canAutoClose
            ? "This window will close automatically…"
            : "You can close this tab and go back to where you started."}
        </p>
      </div>
    </div>
  );
}
