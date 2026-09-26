# Rules and deliverables

**Type:** challenge
**One line:** The timeline, the code and repo rules, AI-use conditions, and what must be submitted.
**Why we care:** Several rules are disqualifying if broken (prior code, private repo, broken commit history, missing limitations statement), and the demo video is what judges see first.
**Last checked:** 2026-09-26

## Timeline (all ET)

From the [packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`:

| When | What |
|---|---|
| Thu Sept 17 | Registration opens |
| Sat Sept 19 | Slack opens; teams form there |
| Wed Sept 23 | Schedule and resources published |
| Thu Sept 24, 11:59 p.m. | Registration closes |
| Fri Sept 25 | Kickoff, housing subject-matter training, Cursor training (the packet says "Recorded") |
| **Sat Sept 26, 9:00 a.m.** | **Building begins.** "Write your first line of code. Not before" |
| Sat and Sun, 10 a.m.–6 p.m. | Office hours in Slack (housing, planning, permitting, development experts; technical mentors). Sunday is "weighted toward technical triage" |
| **Sun Sept 27, 11:59 p.m.** | **Submissions close.** "Hard deadline. No extensions" |
| Mon–Wed Sept 28–30 | Asynchronous judging |
| Thu Oct 1 / Fri Oct 2 | Winners notified / announced |

The packet describes the window as "about thirty-nine hours." Prize: "The 1st, 2nd, and 3rd place college student and startup teams will share a $30,000 cash prize."

## Building rules

Quoted from the [packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]` ("Adapted from the Major League Hacking standard hackathon rules"):

- "You can bring an idea." Sketching, reading briefs and exploring data beforehand are encouraged.
- "**You can't bring code.** Reusing your own prior project code isn't allowed, and neither is open-sourcing something beforehand so you can use it during the event."
- "Your idea doesn't have to be original. If someone's built something similar, build yours anyway and build it well."
- "You can use libraries, frameworks, open-source code, public datasets, and third-party APIs. **List them in your README.**"
- "When time is up, stop. You can fix a small bug you find while recording your demo. You can't add features."

## Code and repository rules

- "Your code must be in a **public repository**, and it has to stay public after the event to remain eligible for prizes."
- "Your **commit history must be intact and start from kickoff**. We check this — it's how the no-prior-code rule is enforced rather than merely stated."
- "Strip your API keys and credentials before making the repo public."
- "One project per team. You can't submit the same project to another hackathon running at the same time."
- Ownership stays with the team; organizers ask only for permission to show the project.

Note: the packet says history must "start from kickoff" (Fri Sept 25) but also says building begins Sat 9:00 a.m. and to write no code before then. The stricter reading is the safe one: no code commits before Sat 9:00 a.m. ET.

## AI tools

From the [packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`: AI tools are permitted, with "Two conditions. Be honest about what you used… And build something: **a thin wrapper around an existing AI product isn't a project**, and judges can tell the difference between a team that used AI to build faster and a team that asked AI to build it."

## Teams

- The packet says teams are "1 to 5 people," and that "three or four is where most good projects land."
- ⚠ The [landing page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/) `[read]` says teams "of 3-5 people." The packet is the more detailed rules document; we treat 1–5 as the rule.
- Participants must be 18+. Organizers, mentors, judges and sponsor representatives cannot compete.

## Submission form fields

The form asks for ([packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`):

| Item | Detail |
|---|---|
| Team and member details | Names, emails, affiliation |
| **Challenge track** | "Which of the three you're entering" (one track) |
| Project title and description | "What it does, who it's for, what you'd build next" |
| Demo video | 3 to 5 minutes |
| Public repository link | "Publicly accessible, commit history intact" |
| Data sources used | "Which datasets, and where you got them" |
| AI tool disclosure | "Which AI tools you used and how" |
| Attestation | "Everyone is 18+ and no code predates kickoff" |

The packet advises: "Start your submission Saturday afternoon, not Sunday night — you can edit it right up to the deadline."

The mandatory eligibility checks add two items the form table does not list: **documentation** and a **limitations statement** ("Required Deliverables: Working code repository, demo video (3-5 min), documentation, data/source citations, and limitations statement"). The form table does not say where the limitations statement goes; putting it in the repo and in the description covers both.

## Demo video

From the [packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`:

- "The most underrated part of the submission. Judges watch it before they look at anything else, and some will form most of their opinion from it."
- "Start by saying the name of the hackathon and who you are."
- "Show the thing working. A screen recording of the actual tool beats slides every time."
- "Be honest about what's functional and what's mocked."
- "Record it during the hackathon weekend, and keep it public afterward."
- On unfinished work: "An unfinished project that's honest about where it stopped scores better than you'd expect."

## Responsible framing

"Tool must be positioned strictly as decision support, not binding legal, financial, or zoning advice" ([packet](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]`, mandatory checks).

## Open questions
- Where exactly does the form want the limitations statement and documentation: repo, description, or both?
- Does "start from kickoff" mean Fri Sept 25 or Sat Sept 26, 9:00 a.m.? The safe assumption is Saturday.
- Does the "list them in your README" rule extend to datasets and licenses (for example the CC BY-NC Pro-Housing Pittsburgh CSV)? We assume yes; see [commercial tools](../landscape/commercial-tools.md) for licenses.
- The kickoff was recorded; we have not located the recording.

## Connects to
- [Brief and judging](brief-and-judging.md): what is scored
- [Timeline and workstreams](../build-plan/timeline-and-workstreams.md): planning against the deadline
- [LLM role](../methods/llm-role.md): avoiding the "thin wrapper" problem
- [Combining with Track 1](../track3/combining-with-track1.md): one track on the form
- [Other participants](../landscape/other-participants.md): public repos created on build day
- [Commercial and open tools](../landscape/commercial-tools.md): which third-party code is license-clean to list in the README

## Sources
- [Participant packet (Google Doc, plain-text export)](https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ) `[read]` *(accessed 2026-09-26)*: timeline, rules, AI conditions, form fields, video guidance
- [Event landing page](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/) `[read]` *(accessed 2026-09-26)*: dates, "3-5 people" team wording
- Sweep: [../../sweeps/r3-reality-check-existing-tools.md](../../sweeps/r3-reality-check-existing-tools.md)
