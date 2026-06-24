const PROBLEMS = [
  {
    before: "Feature requests buried in email, Notion, and Slack",
    after:
      "One board. Every request in one place, ranked by the users who care most.",
  },
  {
    before: "Roadmap decisions based on whoever complained loudest",
    after:
      "Vote counts give you real signal. Build what's actually blocking users.",
  },
  {
    before: "Shipping features users asked for — without them ever finding out",
    after: "Every voter gets an email the day their requested feature ships.",
  },
] as const;

export function ProblemFraming() {
  return (
    <section className="bg-muted">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-8">
        <p className="font-bold text-xs uppercase tracking-eyebrow text-success">
          Sound Familiar?
        </p>

        <h2 className="mt-4 font-bold text-3xl text-foreground sm:text-4xl">
          Feedback is everywhere.
          <br className="hidden sm:block" />
          Structure is nowhere.
        </h2>

        <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
          Most product teams collect feedback in five different places, make
          roadmap decisions by instinct, and ship features into silence.
          IdeaRoads fixes all three.
        </p>

        <div className="mt-12 grid gap-px bg-border sm:grid-cols-3">
          {PROBLEMS.map(({ before, after }) => (
            <div className="bg-card p-6" key={before}>
              <p className="text-sm text-muted-foreground">{before}</p>
              <div className="mt-4 flex items-start gap-2">
                <span
                  aria-hidden="true"
                  className="mt-0.5 font-mono text-success"
                >
                  ✓
                </span>
                <p className="text-sm font-semibold text-foreground">{after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
