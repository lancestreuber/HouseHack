import type { ContextFact } from "./types";

function definition(id: string, text: string): ContextFact {
  return { id, text, source: "Yinzone methodology", source_url: "/resources", as_of: "2026-09-27", kind: "definition" };
}

/** Plain-language definitions the chatbot may always cite, whatever is on screen. */
export const DEFINITIONS: ContextFact[] = [
  definition("def.by_right", "Allowed by right means current zoning permits it without a public hearing; a building permit is still needed."),
  definition("def.needs_approval", "Needs approval means it could be allowed through an Administrator Exception, a special exception, a variance or a conditional use, each of which adds review time and sometimes a public hearing."),
  definition("def.not_allowed", "Not allowed means current zoning does not permit it on this parcel."),
  definition("def.uncertain", "Uncertain means the zoning rules are unclear for this case; verify with the Zoning Administrator."),
  definition("def.weights", "Weights are value judgments, not data. Changing them changes the scores, so different priorities can lead to different answers."),
  definition("def.suggestions", "Everything here is a suggestion to help you decide, not legal, financial or zoning advice. Zoning is a simplified interpretation; verify with the Zoning Administrator."),
  definition("def.limits", "Crime and race never enter any score. The chat only sees what the panels show for this parcel (scores, breakdowns, typology tiles, site fit, verdicts, the pencil check, alerts and zoning), not the map's other layers, and it can't tell you whether a specific project will be approved. Building costs and sale prices appear only as the rough pencil check: practitioner cost ranges against nearby sale prices and rents, with land, financing and subsidy left out."),
  definition("def.adu", "ADUs are not permitted in any Pittsburgh zoning district today. Pending Bill 2025-1545 would allow them by right; it is not law yet."),
];
