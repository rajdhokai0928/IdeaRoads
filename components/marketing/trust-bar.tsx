const CLAIMS = [
  "Voters never pay a seat fee",
  "Feedback connects to your roadmap",
  "Voters notified automatically on ship",
  "Self-hosted or fully managed",
] as const;

export function TrustBar() {
  return (
    <div className="border-y border-border">
      <div className="mx-auto max-w-6xl">
        <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
          {CLAIMS.map((claim) => (
            <div className="bg-muted px-6 py-5 text-center" key={claim}>
              <p className="text-xs font-semibold uppercase tracking-ui text-muted-foreground">
                {claim}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
