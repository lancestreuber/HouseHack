import { Link } from "@tanstack/react-router";
import { ArrowRight, Ruler, Search, SquareTerminal } from "lucide-react";
import type { ReactNode } from "react";

const DEMO_PIN = "0001N00154000000";

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-yz-line-muted bg-yz-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] justify-end px-6 py-3 md:px-10">
        <Link
          to="/app"
          className="border border-yz-brass px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-yz-brass transition-colors hover:bg-yz-brass hover:text-yz-ink"
        >
          Access Platform
        </Link>
      </div>
    </header>
  );
}

function StickySlot({ children, align = "center" }: { children: ReactNode; align?: "center" | "stretch" }) {
  return (
    <div className="lg:h-[200vh]">
      <div
        className={
          align === "stretch"
            ? "lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:overflow-hidden"
            : "lg:sticky lg:top-0 lg:flex lg:h-svh lg:items-center lg:overflow-hidden"
        }
      >
        {children}
      </div>
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative w-full lg:flex-1">
      <video
        className="absolute inset-0 size-full object-cover"
        src="/media/hero-spin.mp4"
        poster="/media/hero-poster.webp"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-b from-yz-ink/85 via-yz-ink/70 to-yz-ink" aria-hidden />
      <div className="relative mx-auto flex min-h-svh w-full max-w-[1400px] flex-col justify-between px-6 py-10 md:px-10 lg:min-h-0 lg:flex-1">
        <div>
          <h1 className="text-7xl font-semibold uppercase leading-[0.9] tracking-[-0.04em] text-white md:text-9xl">
            Yinzone
          </h1>
          <div className="mt-8 h-px bg-yz-line" />
          <div className="mt-8 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h2 className="max-w-2xl text-4xl font-semibold leading-tight text-white md:text-5xl">
                Your zoning code is the decision system.
              </h2>
              <p className="mt-4 text-2xl text-yz-mut md:text-3xl">
                Viability intelligence from parcel to precinct.
              </p>
              <p className="mt-3 text-xl text-yz-subtle">Automate site feasibility at scale.</p>
            </div>
            <div className="lg:col-span-4 lg:border-l lg:border-yz-line lg:pl-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-yz-brass">
                [ Spatial Operating System ]
              </p>
              <p className="mt-4 text-[13px] leading-relaxed text-yz-mut">
                Yinzone unifies municipal land records, 3D contour topography, environmental hazards, and codified
                statutes into a deterministic clearance pipeline.
              </p>
              <div className="mt-6 space-y-1.5 text-[11px] uppercase tracking-[0.04em] text-yz-subtle tnum-yz">
                <p>Cluster: Allegheny ≥ PA-S (EPSG:2272)</p>
                <p>Parcels ingested: 582,914 record entities</p>
                <p>Statute engine: Title 9 zoning ingestion</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border border-yz-line bg-yz-panel p-3 md:flex-row md:items-center">
          <div className="flex flex-1 items-center gap-3 border border-yz-line bg-yz-ink px-3 py-2.5">
            <Search className="size-4 shrink-0 text-yz-subtle" />
            <input
              readOnly
              value={`1428 Woodruff St. Pittsburgh, PA 15205 [LOT ${DEMO_PIN}]`}
              aria-label="Demo parcel address"
              className="w-full bg-transparent text-[13px] text-yz-body outline-none tnum-yz"
            />
            <span className="hidden shrink-0 border border-yz-line px-1.5 py-0.5 text-[11px] text-yz-subtle md:block">
              ⌘ K
            </span>
          </div>
          <Link
            to="/app"
            search={{ pin: DEMO_PIN }}
            className="flex items-center justify-center gap-2 bg-yz-brass px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-yz-ink transition-[filter] hover:brightness-108"
          >
            Inspect Viability
            <ArrowRight className="size-3.5" />
          </Link>
          <Link
            to="/app"
            className="flex items-center justify-center border border-yz-line bg-yz-panel-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-yz-mut transition-colors hover:text-yz-body"
          >
            Launch Workspace
          </Link>
        </div>
      </div>
    </section>
  );
}

function Tracker({ active }: { active: 1 | 2 | 3 }) {
  const step = (n: 1 | 2 | 3) => (
    <span className={n === active ? "text-yz-brass" : "text-yz-subtle"}>
      {n === active ? `[ 0${n} ]` : `0${n}`}
    </span>
  );
  return (
    <div className="flex items-center gap-4 text-[11px] tracking-[0.04em] tnum-yz">
      {step(1)}
      <span className="h-px w-16 bg-yz-line" />
      {step(2)}
      <span className="h-px w-16 bg-yz-line" />
      {step(3)}
    </div>
  );
}

function CadFrame({
  icon,
  left,
  right,
  footerLeft,
  footerRight,
  img,
  alt,
  children,
}: {
  icon?: ReactNode;
  left: string;
  right: string;
  footerLeft?: string;
  footerRight?: string;
  img: string;
  alt: string;
  children?: ReactNode;
}) {
  return (
    <div className="border border-yz-line bg-yz-panel">
      <div className="flex items-center justify-between border-b border-yz-line px-3 py-2 text-[11px] uppercase tracking-[0.04em]">
        <span className="flex items-center gap-2 text-yz-mut">
          {icon}
          {left}
        </span>
        <span className="text-yz-subtle tnum-yz">{right}</span>
      </div>
      <img src={img} alt={alt} className="block w-full" />
      {children}
      {(footerLeft || footerRight) && (
        <div className="flex items-center justify-between border-t border-yz-line px-3 py-2 text-[11px] uppercase tracking-[0.04em]">
          <span className="text-yz-mut">{footerLeft}</span>
          <span className="text-yz-subtle">{footerRight}</span>
        </div>
      )}
    </div>
  );
}

type FeatureProps = {
  active: 1 | 2 | 3;
  tag: string;
  title: string;
  sub: string;
  paragraphs: string[];
  chips: string[];
  telemetry?: { label: string; value: string; tone?: "brass" | "alarm" }[];
  frame: ReactNode;
};

function FeatureSection({ active, tag, title, sub, paragraphs, chips, telemetry, frame }: FeatureProps) {
  return (
    <section className="w-full py-16 lg:py-0">
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-10">
        <div className="flex items-center justify-between">
          <Tracker active={active} />
          <span className="hidden text-[11px] uppercase tracking-[0.12em] text-yz-subtle md:block">[ {tag} ]</span>
        </div>
        <div className="mt-10 grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5">
            <h2 className="text-4xl font-semibold leading-tight text-white md:text-5xl">{title}</h2>
            <p className="mt-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-yz-brass">{sub}</p>
            {paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="mt-5 max-w-prose text-[14px] leading-relaxed text-yz-mut">
                {p}
              </p>
            ))}
            <div className="mt-7 flex gap-2">
              {chips.map((c) => (
                <span
                  key={c}
                  className="border border-yz-line px-3 py-1.5 text-[11px] uppercase tracking-[0.04em] text-yz-mut"
                >
                  {c}
                </span>
              ))}
            </div>
            {telemetry && (
              <div className="mt-8 grid grid-cols-2 gap-x-8 gap-y-5">
                {telemetry.map((t) => (
                  <div key={t.label}>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-yz-subtle">{t.label}</p>
                    <p
                      className={`mt-1 text-[13px] font-semibold uppercase tracking-[0.02em] tnum-yz ${
                        t.tone === "alarm"
                          ? "text-yz-alarm"
                          : t.tone === "brass"
                            ? "text-yz-brass"
                            : "text-yz-body"
                      }`}
                    >
                      {t.value}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="lg:col-span-7">{frame}</div>
        </div>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="border-t border-yz-line-muted px-6 py-28 text-center">
      <h2 className="text-4xl font-semibold text-white md:text-5xl">Are you ready?</h2>
      <svg viewBox="0 0 64 64" className="mx-auto mt-10 size-16" aria-hidden>
        <circle cx="32" cy="32" r="26" fill="none" stroke="#D4A359" strokeWidth="2" strokeDasharray="3 7" />
        <path d="M32 32 L32 15 M32 32 L43 40" stroke="#D4A359" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <p className="mx-auto mt-10 max-w-md text-xl leading-relaxed text-yz-mut">
        Transform how municipal land is evaluated and cleared.
      </p>
      <div className="mt-10 flex justify-center">
        <Link
          to="/app"
          className="bg-yz-brass px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-yz-ink transition-[filter] hover:brightness-108"
        >
          Access Yinzone Workspace
        </Link>
      </div>
    </section>
  );
}

function LandingFooter() {
  return (
    <footer className="border-t border-yz-line-muted px-6 py-6 md:px-10">
      <div className="flex flex-col gap-3 text-[11px] uppercase tracking-[0.04em] md:flex-row md:items-center md:justify-between">
        <p className="text-yz-subtle">
          <span className="font-semibold text-white">Yinzone</span>
          <span className="ml-3">© 2026 Yinzone Spatial Systems Inc. All rights reserved.</span>
        </p>
        <p className="flex flex-wrap items-center gap-4 text-yz-subtle tnum-yz">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-yz-brass" aria-hidden />
            Spatial engine v2.4 operational
          </span>
          <span>EPSG:2272 USft</span>
          <span>Latency: 24ms US-East</span>
        </p>
      </div>
      <p className="mt-4 max-w-3xl text-[11px] leading-relaxed normal-case tracking-normal text-yz-subtle">
        Decision support software only. All dimensional audits, permissible lot coverage metrics, and variance
        indicators must be verified with certified municipal zoning administrators before construction. Basemap ©
        CARTO, © OpenStreetMap contributors.
      </p>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="font-yz bg-yz-ink text-yz-body antialiased">
      <LandingHeader />
      <main>
        <StickySlot align="stretch">
          <HeroSection />
        </StickySlot>
        <StickySlot>
          <FeatureSection
            active={1}
            tag="Targeting & Zoning Clearance"
            title="Powering the Viability chain"
            sub="// Reconciling Title Nine statutes with elevation matrices"
            paragraphs={[
              "Yinzone's automated targeting engine supports municipal planners and development analysts with an algorithmic viability chain. It seamlessly cross-references physical topography against legislative zoning barriers, calculating required variances before capital allocation.",
              "Teams experience enhanced spatial awareness and complete statute deconfliction across parcel boundaries—streamlining approval cycles across complex hillside geographies.",
            ]}
            chips={["Spec Sheet", "Details"]}
            telemetry={[
              { label: "Parcel Identifier", value: DEMO_PIN },
              { label: "Base District", value: "R1D-H (Hillside Res)" },
              { label: "Slope Threshold", value: "36% steep", tone: "brass" },
              { label: "Score Determination", value: "50 / 100", tone: "brass" },
            ]}
            frame={
              <CadFrame
                icon={<span className="size-1.5 rounded-full bg-yz-brass" aria-hidden />}
                left="Engine: Allegheny Manor. Homes geoparquet"
                right="Projection EPSG:2272"
                footerLeft="Status: Ingestion complete"
                footerRight="Decision engine verified"
                img="/media/section-01.webp"
                alt="Yinzone explorer with the demo parcel selected, showing overall viability score and critical alerts"
              />
            }
          />
        </StickySlot>
        <StickySlot>
          <FeatureSection
            active={2}
            tag="Sensor Layers & Code Deconfliction"
            title="Task sensors & overlays"
            sub="// Orchestrate compliance across housing typologies"
            paragraphs={[
              "Yinzone continuously monitors and indexes municipal tables of authorized land use against physical ground hazards. By converting written zoning code into executable spatial queries, developers identify buildable envelopes in milliseconds.",
              "Ingest multi-tier geotechnical surveys, LiDAR elevation rasters, and FEMA flood overlays into an integrated situational map.",
            ]}
            chips={["Specifications", "Statutory Audit"]}
            frame={
              <CadFrame
                icon={<Ruler className="size-3.5 text-yz-brass" />}
                left="Permitted Typology Clearance Matrix"
                right="Title 9 — Chapter 911"
                img="/media/section-02.webp"
                alt="Yinzone layers sidebar with steep-slope overlay enabled and the typology clearance cards for the selected parcel"
              />
            }
          />
        </StickySlot>
        <StickySlot>
          <FeatureSection
            active={3}
            tag="Field-Ready Spatial Command"
            title="Ops Center anywhere"
            sub="// Natural language cadastre & statute synthesis"
            paragraphs={[
              "Harness the full power of the cadastral platform from municipal hearing chambers to remote field inspection trucks. Immerse your planning team in an ambient interface that unifies raw GIS coordinate geography with legislative text.",
              "Ask unstructured inquiries across parcel boundaries: dimensional setback calculations, precedent variances, and allowable density thresholds calculated instantly in sub-second inference passes.",
            ]}
            chips={["Telemetry", "Docs"]}
            frame={
              <CadFrame
                icon={<SquareTerminal className="size-3.5 text-yz-brass" />}
                left="Yinzone Language Runtime"
                right="SQ-95-LM-T latency 40ms"
                img="/media/section-03.webp"
                alt="Yinzone parcel assistant answering a viability question with statute citations"
              >
                <div className="flex flex-wrap gap-2 border-t border-yz-line px-3 py-2.5">
                  {["Why is the overall score 50?", "Calculate max FAR & building footprint", "Can I subdivide this parcel?"].map(
                    (p) => (
                      <span key={p} className="border border-yz-line bg-yz-panel-2 px-2.5 py-1 text-[11px] text-yz-mut">
                        {p}
                      </span>
                    ),
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-yz-line px-3 py-2.5">
                  <span className="text-yz-brass">›</span>
                  <input
                    readOnly
                    value=""
                    placeholder="Ask a technical parcel or municipal statute question..."
                    aria-label="Demo query input"
                    className="w-full bg-transparent text-[12px] text-yz-body outline-none placeholder:text-yz-subtle"
                  />
                  <Link
                    to="/app"
                    className="shrink-0 bg-yz-brass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-yz-ink transition-[filter] hover:brightness-108"
                  >
                    Execute
                  </Link>
                </div>
              </CadFrame>
            }
          />
        </StickySlot>
        <CtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
