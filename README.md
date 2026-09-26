# HouseHack

Our entry for the **AI Horizons 2026 — AI for Housing Hackathon** (virtual, Sept 26–27, 2026).

- Event: https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/
- Hackathon packet: https://docs.google.com/document/d/1L-UYid6Q0JDRH3iy4cpqGIDlZNpJspok_rPxIsILbLQ/edit?usp=sharing

## Tracks

1. **Development Feasibility & Pro Forma Navigator** — AI-assisted first-pass feasibility for parcels and housing concepts, grounded in public records and approved affordability assumptions.
2. **Housing Production, Rents & Household Flow Observatory** — interactive tool combining administrative, market, and community indicators to show how the housing system evolves over time.
3. **Housing Typology, Equity & Climate Matchmaker** — decision support matching locations with plausible housing types and tradeoffs across demand, transit, equity, and climate resilience.

Judging favors practical, source-grounded prototypes with clear benefit to developers, nonprofits, public agencies, community partners, or households.

## Our project

> **Team: start here.** This branch (`vid-branch`) holds the plan and research for our entry. No app code has been written yet. It's the groundwork, so the build goes fast once we split up.
> Shared plan doc (comment there): https://claude.ai/code/artifact/fdc6bb41-5dda-4a0a-a185-f8062534171a

### What we're building
**Track 3 only: Housing Typology, Equity & Climate Matchmaker**, for the City of Pittsburgh. About 60% of teams are on Track 1, so we stand out here. Enter any address, ZIP or neighborhood. For any of the city's ~142k parcels you get:
- the **housing types that fit** (ADU, duplex, triplex, townhomes, small multifamily, mid-rise), each with a fit score and a confidence range;
- the **tradeoffs** of each type across demand, access (jobs, schools, transit, healthcare, parks, shops), equity and displacement risk, and climate (heat, flood, air quality, carbon), weighted by sliders the user controls. Every number is labeled as evidence, assumption or value choice;
- a **household lens**: pick who will live there (family with kids, senior, young worker without a car, and so on) and optionally a workplace. The map re-weights for that household, including commute time to job centers in the suburbs;
- a **reality check**: zoning permission, hazards, and the funding gap per unit, plus which subsidies could close it;
- a **policy simulation** that applies Pittsburgh's pending 2026 zoning reform (ADUs by right, no parking minimums, affordable-housing bonus) and shows what changes;
- an **AI companion** (Claude), a conversational guide beside the map. It answers questions like "why is this better for my mom?" by calling our data tools live, cites every fact, says who benefits and who could be harmed, and explains terms as you go.

**The experience:**
1. Pick an area and, optionally, who you're planning for.
2. The dashboard shows **scenario cards**, each one "this housing type, here, for this household", with fit, confidence, top tradeoffs, and who benefits and who might be harmed.
3. Ask the companion to explain, compare or find alternatives.

**The engine underneath:** fit = benefits − (place exposure × household sensitivity × (1 − what the housing type mitigates)). For example, poor air matters most for seniors, and a filtered, elevator building reduces that harm. See [track3-methodology.md](docs/research/track3-methodology.md).

The goal is a real tool a CDC, planner, small developer or resident could use on Monday. It's not just a demo. **The map and UI are the product**, so aim for Felt/Linear-level polish.

### What's done
| | |
|---|---|
| Design spec | [docs/superpowers/specs/2026-09-26-groundwork-pgh-design.md](docs/superpowers/specs/2026-09-26-groundwork-pgh-design.md). Read "Updates after research" first. |
| Research | [docs/research/](docs/research/): UI/map, data sources, zoning rules, stack setup, pro forma. Every figure comes from live public sources, checked Sep 26. |
| Draft issues | [docs/issues-draft.md](docs/issues-draft.md): 36 issues across 4 lanes and 4 milestones. They aren't on GitHub yet; we'll create them after your feedback. |
| Doc index | [docs/README.md](docs/README.md) lists which doc to read for your lane. |

### What we need from you
1. **Read the plan doc** and leave comments: what's missing, what's too much, what you'd change.
2. **Pick a lane** in Discord (one person per lane; each lane owns its own folders so we don't collide):
   - **A: Data pipeline.** Fetch, join and export all layers, plus satellite sampling. Read [data-sources.md](docs/research/data-sources.md).
   - **B: Scoring + AI.** Zoning rules, Ease Score, typology matching, pro forma, Claude endpoints. Read [zoning-rules.md](docs/research/zoning-rules.md) and [pro-forma.md](docs/research/pro-forma.md).
   - **C: Map + explorer.** MapLibre map, layers, search, sliders, lot finder. Read [ui-map.md](docs/research/ui-map.md).
   - **D: Report, compare, polish.** Site report, compare, reform toggle, landing page, video, submission. Read [ui-map.md](docs/research/ui-map.md) and [pro-forma.md](docs/research/pro-forma.md).
3. **Vote on a name**: Groundwork PGH (working name), Buildable Burgh, LotLogic, SiteLine PGH or Yinz Can Build.
4. **Get set up** by following [stack-setup.md §1](docs/research/stack-setup.md). In short:
   - Install bun: `curl -fsSL https://bun.sh/install | bash`.
   - Create `apps/web/.env` **before** running `bun install`. No database is needed.
   - Run `bun run dev` and open http://localhost:3001.
5. **Git:** branch off `main` per lane, open PRs, and merge with merge commits, not squash, because judges check commit history. Never commit `.env` or API keys; the repo is public.

### Timeline (ET)
| When | Milestone |
|---|---|
| Sat 1:30pm | Setup done: env, shared types, mock data, design tokens |
| Sat 7pm | Checkpoint: end-to-end on real data, deployed to Vercel |
| Sun 2pm | Feature freeze, then bug bash and polish |
| Sun 5–8pm | Record the 3–5 min demo video |
| Sun 9pm | Submit (hard deadline 11:59pm) |

## Tech Stack

Scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines React, TanStack Start, Self, ORPC, and more.

- **TypeScript** - For type safety and improved developer experience
- **TanStack Start** - SSR framework with TanStack Router
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Drizzle** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Database Setup

This project uses PostgreSQL with Drizzle ORM.

1. Make sure you have a PostgreSQL database set up.
2. Update your `apps/web/.env` file with your PostgreSQL connection details.

3. Apply the schema to your database:

```bash
bun run db:push
```

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@HouseHack/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Environment Configuration

Each app owns its environment schema in `.env.schema`. Varlock generates `src/env.ts` during installation; run `bun run env:generate` after changing a schema. Commit schemas, and keep secrets in ignored env files or your deployment platform.

Import the generated `ENV` accessor in application code. Shared database and auth packages receive configuration or initialized clients from the application. See [Varlock's monorepo guide](https://varlock.dev/guides/monorepos/).

Bun's automatic env loading is disabled in `bunfig.toml`; the framework integration or server bootstrap loads Varlock. Node deployments must include Varlock and its dependencies alongside the app schema.

Run standalone Node/Bun tools that use Varlock from the owning app directory so they load that app's schema and env files. `env:generate` only generates TypeScript files; it does not initialize environment values in a subsequent command.

## Deployment

### Vercel Services

- Target: web + server
- Config: `vercel.json`
- Link the project first: bun run deploy:setup
- Local Vercel dev: bun run dev:vercel
- Sync preview env: bun run env:preview
- Sync production env: bun run env:production
- Dry-run check (no upload): bun run deploy:check
- Preview deploy: bun run deploy
- Production deploy: bun run deploy:prod
  Vercel Services share project environment variables, but deploys do not upload local `.env` files automatically. Link the project with `vercel link`, then run the env sync command before your first deploy (otherwise the deployment starts with no env vars), or pass one-off envs with `vercel deploy -e KEY=value`.
  Pass Vercel CLI flags to the env sync command directly, for example: `bun run env:production --scope your-team`.

For more details, see the guide on [Deploying to Vercel](https://www.better-t-stack.dev/docs/guides/vercel).

## Project Structure

```
HouseHack/
├── apps/
│   └── web/         # Fullstack application (React + TanStack Start)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── api/         # API layer / business logic
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run check-types`: Check TypeScript types across all apps
- `bun run db:push`: Push schema changes to database
- `bun run db:generate`: Generate database client/types
- `bun run db:migrate`: Run database migrations
- `bun run db:studio`: Open database studio UI
- `bun run deploy:setup`: Link this repo to a Vercel project (first-time setup)
- `bun run dev:vercel`: Run the Vercel Services dev environment locally
- `bun run env:preview`: Sync local env files to the Vercel preview environment
- `bun run env:production`: Sync local env files to the Vercel production environment
- `bun run deploy`: Create a Vercel preview deployment
- `bun run deploy:prod`: Deploy to Vercel production
- `bun run deploy:check`: Dry-run a deploy to preview framework detection and included files without uploading

## Better Auth Schema Generation

After changing auth plugins or schema options, run `bun run auth:generate` from the project root. The script runs the Better Auth CLI through `varlock run` from the owning app directory, loading the auth instance from `src/services.ts`. Review the schema changes, then use your ORM's migration workflow to apply them.
