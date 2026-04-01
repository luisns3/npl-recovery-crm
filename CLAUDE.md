# CLAUDE.md

## Project Overview

NPL Recovery CRM — a React SPA for debt recovery managers handling non-performing loans. The core UX principle is **speed**: minimize clicks, reduce cognitive load, make the next call always obvious.

## Commands

- `npm run dev` — start Vite dev server (http://localhost:5173)
- `npm run build` — type-check (`tsc -b`) then production build
- `npm run lint` — ESLint
- `npx tsc --noEmit` — type-check only

## Architecture

- **No routing library** — view switching is state-driven via `ViewMode` in `CrmContext`
- **Single context** (`CrmContext`) holds all state and actions — no Redux, no external state library
- **Mock data only** — no backend, no API calls. All data lives in `src/data/mockData.ts`
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (not PostCSS). Styles imported as `@import "tailwindcss"` in `index.css`

## Key Conventions

- **verbatimModuleSyntax** is enabled in tsconfig — all type-only imports must use `import type { ... }`. Value imports stay as `import { ... }`. Mixing them in a single import requires `import { CONST, type Type }` syntax.
- Components are organized by feature area: `Dashboard/`, `CaseDetail/`, `CallLog/`, `NextAction/`, `Proposals/`
- All entity types are defined in `src/types.ts` — this is the single source of truth for the data model
- The call flow is enforced: Case Detail → Call Log (mandatory) → Next Action → Next Case

## Data Model Notes

- A `Case` (expediente) contains parties, contacts, loans, collaterals, interactions, alerts, and proposals
- Loans and collaterals have a many-to-many relationship via `LoanCollateral` (with lien rank)
- Proposals are linked to a specific collateral, not directly to a loan
- Phone contacts can be marked as `isInvalid` which blocks them from the call button

## Priority Queue Logic

Located in `src/utils/priorityQueue.ts`. Sort order:
1. Longest time since last interaction (descending)
2. Active alert count (descending)
3. Best proposal probability rank (Deals > Focus > Pre-Pipe)
4. Days to auction (ascending — closest first)
5. Strategy priority (DPO > PDV > Loan Sale > Auction > Repossession)
