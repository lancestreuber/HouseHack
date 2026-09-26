# Hackathon precedents

**Type:** landscape
**One line:** What comparable civic-tech and AEC hackathons built on zoning, permitting, feasibility and typology, and what their judges rewarded.
**Why we care:** These show which ideas have already won comparable events, which are commonplace, and what judges said they valued.
**Last checked:** 2026-09-26

## The events

### Seattle Community Innovation PACT-athon (Oct 2025), permitting

Source: [Seattle Innovation Hub post](https://innovation-hub.seattle.gov/2025/10/28/community-innovation-pactathon-permitting/) `[read]` (read by the round-3 and round-4 sweeps; a re-fetch on 2026-09-26 for this node was blocked by a Cloudflare challenge).

- **1st place, "Permit Predictor":** forecast permit duration and number of review rounds, with confidence scores.
- **2nd place:** a permit chatbot and dashboard.
- **3rd place, "PreAssess":** retrieval over the municipal code, producing plain-language checklists; shows setbacks and height.
- **Judges' praise** (as quoted by the sweep): tools that "illuminate the process… as early as possible."
- **3rd-place team's time split:** about 1.5 hours defining the problem and 30 minutes coding (their own account, as reported in the post).
- No repos were found for these entries.

### AEC Tech hackathons

Source: [AEC Tech hackathon archive](https://www.aectech.us/hackathon-archive) `[read]`.

- **UpZone** (AEC Tech NYC 2024; Best Breakout and Hacker's Choice): LLM plus spatial algorithms turn NYC zoning into a buildable 3D envelope that exports to Rhino. Repo: [ssajedi/upzone](https://github.com/ssajedi/upzone) `[read]`, **no license** (GitHub API, 2026-09-26; last push 2024-10-27). Ideas only, not code.
- **Zone In** (AEC Tech Chicago 2025; Most Collaborative): enter an address, get a plain summary of what you can build under Chicago zoning. License unknown.
- **Anthill** (AEC Tech Chicago 2025, Best Overall) and **PreVu** (AEC Tech 2025): AI-assisted embodied-carbon analysis for structures and early design. Per building, not per typology per place. See [carbon by typology](../track3/carbon-by-typology.md).

### ZoneMind, Code4City @ NYU (Apr 2026), 2nd place

Source: [Code4City](https://www.code4city.com/) `[read]`; repo [William7042/ZoneMInd](https://github.com/William7042/ZoneMInd) `[read]`, **no license** (GitHub API; created 2026-04-26).

- Plain-English rezoning input parsed by Claude Haiku; GeoPandas simulates it over about 70k Manhattan parcels (MapPLUTO); each affected parcel gets a 0–10 displacement score; Claude Sonnet writes a policy brief. Streamlit and PyDeck.
- The round-4 sweep calls it the closest prior art to Track 3. It has no typology matching, no carbon and no adjustable weights.

### YIMBY AI, Seattle Climate Hack (May 2025), $5k

Source: [GeekWire](https://www.geekwire.com/2025/yimby-ai-wins-seattle-climate-hackathon-with-idea-to-support-development-of-backyard-units/) `[skimmed]`. Helps homeowners picture ADUs or multifamily units on their lot, with regulatory information.

### New Jersey statewide AI affordability hackathon (Jan 2026)

Source: [NJBiz](https://njbmagazine.com/njb-news-now/nj-students-tackle-affordability-in-statewide-ai-hackathon/) `[skimmed]`. The winning team pitched "AI-powered zoning intelligence" and ML permitting. The round-4 sweep describes it as a pitch deck only. The round-3 sweep lists the NJ entry as a chatbot/RAG build and tags it as fetched; the two sweeps describe it differently, so we treat the details as `[skimmed]`.

### Devpost projects

PermitPilot and "Seattle Pre-Permit AI" appear as chatbot/RAG-over-permits projects ([r3 sweep](../../sweeps/r3-reality-check-existing-tools.md) `[skimmed]`). Devpost blocked scripted search, so coverage is weak.

## Patterns the round-4 sweep draws (its inferences)

1. Hackathon winners are narrow: one parcel or address, one question (what can I build, how long will the permit take). Code-to-plain-language (RAG, checklists) recurs on the permitting side.
2. The LLM is the interface; a deterministic model does the numbers (ZoneMind, UpZone, PreAssess).
3. Judges reward framing the problem well; Seattle's 3rd-place team said so directly.

Also noteworthy: timeline prediction with uncertainty (Permit Predictor) has **already won** a comparable permitting hackathon.

## This event

The round-3 sweep found no published judges, prior winners or kickoff materials and describes this as apparently the first hackathon of its kind; the only organizer framing it found was "permitting or fragmented data" ([Technical.ly](https://technical.ly/workforce/ai-horizons-summit-pittsburgh-tackles-ai-safety-and-economic-impact/) `[skimmed]`).

## Open questions
- Is the Seattle judges' quote exact? Our re-fetch was blocked; the wording comes from the sweeps.
- What did the Seattle 2nd-place and NJ entries actually build? The two sweeps differ.
- Zone In, Anthill and PreVu repos and licenses were not found.
- Are there prior housing hackathons in Pittsburgh itself? None found.

## Connects to
- [Commercial tools](commercial-tools.md): the non-hackathon versions of these ideas
- [Other participants](other-participants.md): public repos from this event
- [Framings](framings.md): which framings echo these winners
- [Uncertainty and explainability](../methods/uncertainty-and-explainability.md): Permit Predictor's confidence scores
- [LLM role](../methods/llm-role.md): LLM-as-interface pattern
- [Carbon by typology](../track3/carbon-by-typology.md): Anthill / PreVu
- [Brief and judging](../challenge/brief-and-judging.md): this event's criteria

## Sources
- [Seattle PACT-athon post](https://innovation-hub.seattle.gov/2025/10/28/community-innovation-pactathon-permitting/) `[read]` *(accessed 2026-09-26; per sweeps, re-fetch blocked)*: winners, judges' praise, time split
- [AEC Tech hackathon archive](https://www.aectech.us/hackathon-archive) `[read]` *(accessed 2026-09-26)*: UpZone, Zone In, Anthill, PreVu
- [ssajedi/upzone](https://github.com/ssajedi/upzone) `[read]` *(accessed 2026-09-26)*: license and dates via GitHub API
- [Code4City](https://www.code4city.com/) `[read]` *(accessed 2026-09-26)*
- [William7042/ZoneMInd](https://github.com/William7042/ZoneMInd) `[read]` *(accessed 2026-09-26)*: license and dates via GitHub API
- [GeekWire, YIMBY AI](https://www.geekwire.com/2025/yimby-ai-wins-seattle-climate-hackathon-with-idea-to-support-development-of-backyard-units/) `[skimmed]` *(accessed 2026-09-26)*
- [NJBiz, NJ AI hackathon](https://njbmagazine.com/njb-news-now/nj-students-tackle-affordability-in-statewide-ai-hackathon/) `[skimmed]` *(accessed 2026-09-26)*
- [Technical.ly, AI Horizons summit](https://technical.ly/workforce/ai-horizons-summit-pittsburgh-tackles-ai-safety-and-economic-impact/) `[skimmed]` *(accessed 2026-09-26)*
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
- Sweep: [../../sweeps/r4-track3-prior-art-and-hackathons.md](../../sweeps/r4-track3-prior-art-and-hackathons.md)
