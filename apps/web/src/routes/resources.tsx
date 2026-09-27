import { createFileRoute } from "@tanstack/react-router";
import katexCss from "katex/dist/katex.min.css?url";
import { useEffect, useRef, useState } from "react";

import { OVERLAYS } from "@/components/map/overlays";
import { TYPOLOGIES } from "@/components/map/overlays/legal-feasibility";
import {
  AssumptionsSection,
  CatalogSection,
  LayersSection,
  LimitationsSection,
  ReferencesSection,
  ServicesSection,
} from "@/components/resources/sections-data";
import { AiSection, EquationsSection, MultipliersSection, OverviewSection, PillarsSection, TypologySection } from "@/components/resources/sections-model";
import { DISCLAIMER } from "@/components/disclaimer";
import { Stat } from "@/components/resources/ui";
import config from "@/lib/pillars/pillars.config.json";
import catalog from "@/lib/resources/catalog.generated.json";

export const Route = createFileRoute("/resources")({
  head: () => ({ meta: [{ title: "Resources · Yinzone" }], links: [{ rel: "stylesheet", href: katexCss }] }),
  component: ResourcesPage,
});

const TOC: [string, string, string][] = [
  ["overview", "01", "How it works"],
  ["equations", "02", "Equations"],
  ["pillars", "03", "Pillars"],
  ["multipliers", "04", "Multipliers"],
  ["housing-types", "05", "Housing types"],
  ["ai", "06", "AI components"],
  ["map-layers", "07", "Map layers"],
  ["datasets", "08", "Datasets"],
  ["licenses", "09", "Licenses & services"],
  ["assumptions", "10", "Assumptions"],
  ["limitations", "11", "Limitations"],
  ["references", "12", "References"],
];

function ResourcesPage() {
  const [active, setActive] = useState(TOC[0][0]);
  const scroller = useRef<HTMLDivElement>(null);

  // The last section whose top has scrolled past the upper part of the view is the current one.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const update = () => {
      const limit = el.getBoundingClientRect().top + 120;
      let current = TOC[0][0];
      for (const [id] of TOC) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top != null && top <= limit) current = id;
      }
      setActive(current);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, []);

  return (
    <div ref={scroller} className="min-h-0 overflow-y-auto bg-background">
      <div className="mx-auto grid max-w-[1600px] grid-cols-1 lg:grid-cols-[13rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-border lg:block">
          <nav className="sticky top-0 p-4">
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Contents</div>
            <ul className="space-y-0.5">
              {TOC.map(([id, code, label]) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className={`flex gap-2 rounded-sm px-1.5 py-1 text-xs ${active === id ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <span className="font-mono text-[10px] leading-4 opacity-60">{code}</span>
                    {label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-1 border-t border-border pt-3 font-mono text-[10px] text-muted-foreground">
              <div>config v{config.version}</div>
              <div>zoning matrix 2026-09-26</div>
              <div>sources pulled 2026-09-26/27</div>
            </div>
          </nav>
        </aside>

        <main className="min-w-0 px-4 pb-24 sm:px-6 lg:px-8">
          <header className="border-b border-border pt-6 pb-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Yinzone · Methodology &amp; sources</div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">How we got every number on the map</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Sources, equations, weights, assumptions and limitations behind the parcel scores and housing-type fits. Weights are value judgments, not data. Zoning is a simplified
              interpretation, so verify it with the Zoning Administrator.
            </p>
            <div className="mt-4 rounded-sm border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em]">Decision support, not advice · </span>
              {DISCLAIMER}
            </div>
            <div className="mt-4 grid grid-cols-2 overflow-hidden rounded-sm border border-border sm:grid-cols-3 lg:grid-cols-6">
              <Stat value={catalog.catalog.length} label="datasets" />
              <Stat value={OVERLAYS.length} label="map layers" />
              <Stat value={config.indicators.length} label="indicators" />
              <Stat value={config.pillars.length} label="pillars" />
              <Stat value={TYPOLOGIES.length} label="housing types" />
              <Stat value={catalog.methodology.length} label="method refs" />
            </div>
          </header>

          <OverviewSection />
          <EquationsSection />
          <PillarsSection />
          <MultipliersSection />
          <TypologySection />
          <AiSection />
          <LayersSection />
          <CatalogSection />
          <ServicesSection />
          <AssumptionsSection />
          <LimitationsSection />
          <ReferencesSection />
        </main>
      </div>
    </div>
  );
}
