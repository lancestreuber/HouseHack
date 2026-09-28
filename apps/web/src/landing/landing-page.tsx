import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Ruler, Search, SquareTerminal } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { useAddressSearch } from "@/components/map/address-search";
import { isCityParcel } from "@/lib/city-scope";

const DEMO_PIN = "0001N00154000000";
// Allegheny County PINs: 4 digits, a letter, 5 digits, then 6 digits or letters.
const PIN_RE = /^\d{4}[A-Z]\d{5}[0-9A-Z]{6}$/;
const asPin = (text: string) => {
  const t = text.replace(/[\s-]/g, "").toUpperCase();
  return PIN_RE.test(t) ? t : null;
};

/** Hero search: an address (geocoded) or a PIN opens that parcel in the explorer. */
function LandingSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [focused, setFocused] = useState(false);
  const [miss, setMiss] = useState(false);
  const pin = asPin(query);
  const { results, loading } = useAddressSearch(pin ? "" : query);
  const options = results.filter((r) => r.pin).slice(0, 5);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    setActive(0);
    setMiss(false);
  }, [query]);

  const open = (target: string) => void navigate({ to: "/app", search: { pin: target } });
  const inspect = () => {
    if (!query.trim()) return open(DEMO_PIN);
    if (pin) return open(pin);
    const pick = options[active] ?? options.find((r) => isCityParcel(r.municode));
    if (pick?.pin) return open(pick.pin);
    setMiss(!loading);
  };

  return (
    <div className="mt-10 flex flex-col gap-3 border border-yz-line bg-yz-panel p-3 md:flex-row md:items-center">
      <div className="relative flex-1">
        <div className="flex items-center gap-3 border border-yz-line bg-yz-ink px-3 py-2.5 focus-within:border-yz-brass">
          <Search className="size-4 shrink-0 text-yz-subtle" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === "Enter") inspect();
              else if (e.key === "ArrowDown") setActive((i) => Math.min(i + 1, options.length - 1));
              else if (e.key === "ArrowUp") setActive((i) => Math.max(i - 1, 0));
            }}
            placeholder={`Pittsburgh address or parcel PIN, e.g. ${DEMO_PIN}`}
            aria-label="Address or parcel PIN"
            role="combobox"
            aria-expanded={focused && options.length > 0}
            aria-controls="landing-search-results"
            className="w-full bg-transparent text-[13px] text-yz-body outline-none placeholder:text-yz-subtle tnum-yz"
          />
          <span className="hidden shrink-0 border border-yz-line px-1.5 py-0.5 text-[11px] text-yz-subtle md:block">⌘ K</span>
        </div>
        {focused && !pin && (options.length > 0 || loading || miss) && (
          <ul id="landing-search-results" role="listbox" className="absolute inset-x-0 top-full z-20 mt-1 border border-yz-line bg-yz-panel text-[13px]">
            {loading && !options.length && <li className="px-3 py-2 text-yz-subtle">Searching…</li>}
            {miss && !options.length && <li className="px-3 py-2 text-yz-subtle">No parcel found for that address.</li>}
            {options.map((r, i) => (
              <li key={`${r.pin}-${i}`} role="option" aria-selected={i === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => r.pin && open(r.pin)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left ${i === active ? "bg-yz-panel-2 text-white" : "text-yz-mut"}`}
                >
                  <span className="truncate">{r.label}</span>
                  <span className="shrink-0 text-[11px] text-yz-subtle tnum-yz">{isCityParcel(r.municode) ? r.pin : "outside the City"}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        onClick={inspect}
        className="flex items-center justify-center gap-2 bg-yz-brass px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-yz-ink transition-[filter] hover:brightness-108"
      >
        Inspect parcel
        <ArrowRight className="size-3.5" />
      </button>
      <Link
        to="/app"
        className="flex items-center justify-center border border-yz-line bg-yz-panel-2 px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.04em] text-yz-mut transition-colors hover:text-yz-body"
      >
        Open the map
      </Link>
    </div>
  );
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-yz-line-muted bg-yz-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-[1400px] justify-end px-6 py-3 md:px-10">
        <Link
          to="/app"
          className="border border-yz-brass px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-yz-brass transition-colors hover:bg-yz-brass hover:text-yz-ink"
        >
          Open Yinzone
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
              <p className="mt-4 text-2xl text-yz-mut md:text-3xl">See which homes fit each Pittsburgh parcel.</p>
              <p className="mt-3 text-xl text-yz-subtle">Decision support, not approvals.</p>
            </div>
            <div className="lg:col-span-4 lg:border-l lg:border-yz-line lg:pl-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-yz-brass">
                [ Housing matchmaker ]
              </p>
              <p className="mt-4 text-[13px] leading-relaxed text-yz-mut">
                Parcel records, zoning rules, hazards and neighborhood data, combined into one deterministic score per
                housing type.
              </p>
              <div className="mt-6 space-y-1.5 text-[11px] uppercase tracking-[0.04em] text-yz-subtle tnum-yz">
                <p>Coverage: City of Pittsburgh</p>
                <p>Parcels scored: 142,370</p>
                <p>Housing types: 16</p>
              </div>
            </div>
          </div>
        </div>
        <LandingSearch />
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
        See what fits each Pittsburgh parcel, and why.
      </p>
      <div className="mt-10 flex justify-center">
        <Link
          to="/app"
          className="bg-yz-brass px-6 py-3 text-[12px] font-semibold uppercase tracking-[0.04em] text-yz-ink transition-[filter] hover:brightness-108"
        >
          Open Yinzone
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
          <span className="ml-3">Built for the AI Horizons 2026 AI for Housing Hackathon, Pittsburgh.</span>
        </p>
        <p className="flex flex-wrap items-center gap-4 text-yz-subtle tnum-yz">
          <Link to="/resources" className="hover:text-yz-body">
            Methodology & sources
          </Link>
        </p>
      </div>
      <p className="mt-4 max-w-3xl text-[11px] leading-relaxed normal-case tracking-normal text-yz-subtle">
        Decision support only: not legal, financial or zoning advice. Check with the City's Zoning Administrator before
        acting. Basemap © CARTO, © OpenStreetMap contributors.
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
            tag="Zoning & site fit"
            title="Every parcel, scored"
            sub="// Zoning, lot and hazards in one view"
            paragraphs={[
              "Yinzone checks each parcel's zoning district, lot, slope and flood risk against 16 housing types: allowed by right, with approval, or only with a rezoning.",
              "Scores are deterministic. Missing data shows as unknown, never as a fail.",
            ]}
            chips={["Zoning", "Lot", "Hazards"]}
            telemetry={[
              { label: "Parcel", value: DEMO_PIN },
              { label: "Zoning", value: "R1D-H (hillside residential)" },
              { label: "Steep slope", value: "36% of lot", tone: "brass" },
              { label: "Overall score", value: "50 / 100", tone: "brass" },
            ]}
            frame={
              <CadFrame
                icon={<span className="size-1.5 rounded-full bg-yz-brass" aria-hidden />}
                left="Explorer: one parcel"
                right="City of Pittsburgh"
                img="/media/section-01.webp"
                alt="Yinzone explorer with the demo parcel selected, showing overall viability score and critical alerts"
              />
            }
          />
        </StickySlot>
        <StickySlot>
          <FeatureSection
            active={2}
            tag="Layers & tradeoffs"
            title="See the tradeoffs"
            sub="// Equity, climate and market on the map"
            paragraphs={[
              "Turn on flood zones, steep slopes, transit, housing costs and market layers to see what shapes each site.",
              "Weights are value judgments, so you set them.",
            ]}
            chips={["Equity", "Climate", "Market"]}
            frame={
              <CadFrame
                icon={<Ruler className="size-3.5 text-yz-brass" />}
                left="Housing type fit"
                right="Pittsburgh Zoning Code"
                img="/media/section-02.webp"
                alt="Yinzone layers sidebar with the steep-slope overlay on and housing type cards for the selected parcel"
              />
            }
          />
        </StickySlot>
        <StickySlot>
          <FeatureSection
            active={3}
            tag="Parceltongue assistant"
            title="Ask about any parcel"
            sub="// Answers cite the data on screen"
            paragraphs={[
              "Parceltongue explains scores, zoning and tradeoffs in plain language, and cites the facts behind each answer.",
              "It explains. It never sets a score.",
            ]}
            chips={["Plain language", "Cited"]}
            frame={
              <CadFrame
                icon={<SquareTerminal className="size-3.5 text-yz-brass" />}
                left="Parceltongue"
                right="Cites its sources"
                img="/media/section-03.webp"
                alt="Yinzone parcel assistant answering a viability question with statute citations"
              >
                <div className="flex flex-wrap gap-2 border-t border-yz-line px-3 py-2.5">
                  {["Why is the overall score 50?", "Could a duplex go here?", "What would a rezoning change?"].map(
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
                    placeholder="Ask about this parcel…"
                    aria-label="Demo query input"
                    className="w-full bg-transparent text-[12px] text-yz-body outline-none placeholder:text-yz-subtle"
                  />
                  <Link
                    to="/app"
                    className="shrink-0 bg-yz-brass px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-yz-ink transition-[filter] hover:brightness-108"
                  >
                    Ask
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
