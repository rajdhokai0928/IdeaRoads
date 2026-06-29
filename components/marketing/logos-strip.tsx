import { Boxes, Hexagon, Layers, Orbit, Triangle, Zap } from "lucide-react";

const LOGOS = [
  { name: "Northwind", Icon: Orbit },
  { name: "Lumen", Icon: Zap },
  { name: "Cedar", Icon: Triangle },
  { name: "Apexly", Icon: Hexagon },
  { name: "Hatch", Icon: Layers },
  { name: "Vantage", Icon: Boxes },
] as const;

/* Each group animates translateX(-100%) — its own full width.
   pr-16 adds trailing space equal to the inter-item gap so the
   gap between the two groups matches the gap between items inside. */
function LogoGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div
      aria-hidden={hidden ? "true" : undefined}
      className="logos-group flex shrink-0 items-center gap-16 pr-16"
    >
      {LOGOS.map(({ name, Icon }) => (
        <div className="flex shrink-0 items-center gap-2.5 text-slate-1" key={name}>
          <Icon aria-hidden="true" className="size-[1.1rem] shrink-0" />
          <span className="mk-display whitespace-nowrap text-lg font-bold tracking-tight">
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LogosStrip() {
  return (
    <section className="overflow-hidden border-y border-hairline bg-canvas">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes logos-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-100%); }
        }
        .logos-group {
          animation: logos-marquee 28s linear infinite;
          will-change: transform;
        }
        .logos-fade::before,
        .logos-fade::after {
          content: '';
          position: absolute;
          inset-block: 0;
          width: 10%;
          pointer-events: none;
          z-index: 2;
        }
        .logos-fade::before {
          left: 0;
          background: linear-gradient(to right, var(--color-canvas), transparent);
        }
        .logos-fade::after {
          right: 0;
          background: linear-gradient(to left, var(--color-canvas), transparent);
        }
        @media (prefers-reduced-motion: reduce) {
          .logos-group { animation-play-state: paused; }
        }
      `,
        }}
      />

      <div className="py-9">
        <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.14em] text-slate-2">
          Trusted by product teams at fast-growing companies
        </p>

        <div className="logos-fade relative overflow-hidden">
          <div className="flex">
            <LogoGroup />
            <LogoGroup hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
