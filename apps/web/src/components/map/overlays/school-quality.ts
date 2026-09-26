import type { OverlayDefinition } from "./types";

const TYPE_LABELS: Record<string, string> = {
  regular: "Public school",
  charter: "Charter school",
  occctc: "Career & technical center",
  specialed: "Special education school",
};

const v = (x: unknown, suffix = "") => (x == null ? "n/a" : `${x}${suffix}`);

// Deliberately not color-ranked by test scores: proficiency tracks family income
// closely (r ≈ −0.87 across Allegheny schools), so it would mostly map income.
export const schoolQualityOverlay: OverlayDefinition = {
  id: "school-quality",
  label: "School performance (PA Future Ready)",
  group: "places",
  description: "Public and charter schools with PA Future Ready 2024–25 growth, proficiency and attendance.",
  source: { kind: "static", url: "/data/overlays/school-quality.geojson" },
  layers: (sourceId) => [
    {
      id: "school-quality-dots",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-color": "#38bdf8",
        "circle-radius": [
          "interpolate",
          ["linear"],
          ["sqrt", ["coalesce", ["get", "enrollment"], 100]],
          5,
          3,
          20,
          6,
          45,
          10,
        ] as never,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 1,
        "circle-opacity": 0.85,
      },
    },
  ],
  tooltipLayerIds: ["school-quality-dots"],
  tooltip: (p) =>
    [
      String(p.name),
      `${TYPE_LABELS[String(p.type)] ?? "School"}${p.grades ? `, grades ${p.grades}` : ""}${p.enrollment ? ` · ${Math.round(Number(p.enrollment))} students` : ""}`,
      `Growth (PVAAS, 50–100): ELA ${v(p.ela_growth)} · math ${v(p.math_growth)}`,
      `Proficient: ELA ${v(p.ela_prof_pct, "%")} · math ${v(p.math_prof_pct, "%")} (economically disadvantaged: ${v(p.econ_disadv_pct, "%")})`,
      `Regular attendance: ${v(p.attendance_pct, "%")}${p.grad_4yr_pct != null ? ` · 4-yr graduation: ${p.grad_4yr_pct}%` : ""}`,
      p.essa && p.essa !== "DFLT" ? `State support designation: ${p.essa}` : "",
    ].filter(Boolean),
  legend: () => [{ color: "#38bdf8", label: "School (size = enrollment)", shape: "dot" }],
  meta: {
    source: "PA Department of Education, Future Ready PA Index 2024–25",
    sourceUrl: "https://futurereadypa.org/",
    asOf: "2024–25 school year",
    geography: "School locations (cyber schools excluded)",
    evidence: "observed",
    caveats: [
      "Proficiency closely tracks family income (r ≈ −0.87 across Allegheny schools); growth reflects what the school adds.",
      "Schools are not color-ranked by scores on purpose.",
      "PVAAS growth score is on a 50–100 scale (higher = more growth than the statewide average for similar students); there is no pass/fail line.",
      "Attendance zones differ from enrollment (charters, magnets, district lines).",
    ],
  },
};
