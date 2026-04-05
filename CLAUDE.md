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
- **Supabase backend** — PostgreSQL database with RLS, auth, and storage via `@supabase/supabase-js`
- **Auth** — `AuthContext` wraps the app; `CrmContext` is only mounted when authenticated
- **Single context** (`CrmContext`) holds case data and actions — fetches from Supabase, mutations call Supabase then refetch
- **Tailwind CSS 4** via `@tailwindcss/vite` plugin (not PostCSS). Styles imported as `@import "tailwindcss"` in `index.css`

## Key Conventions

- **verbatimModuleSyntax** is enabled in tsconfig — all type-only imports must use `import type { ... }`. Value imports stay as `import { ... }`. Mixing them in a single import requires `import { CONST, type Type }` syntax.
- **Snake_case fields** — all database column names and TypeScript interfaces use snake_case (e.g. `created_at`, `case_id`, `is_blocked`)
- Components are organized by feature area: `Dashboard/`, `CaseDetail/`, `CallLog/`, `NextAction/`, `Proposals/`, `Auth/`
- All entity types are defined in `src/types.ts` — this is the single source of truth for the data model
- The call flow is enforced: Case Detail → Call Log (mandatory) → Next Action → Next Case
- Database queries live in `src/lib/queries.ts`

## Data Model Notes

- A `Case` (expediente) contains parties, contacts, loans, collaterals, interactions, alerts, and proposals
- Loans and collaterals have a many-to-many relationship via `loan_collaterals` (with lien rank)
- Proposals are linked to loans and collaterals via junction tables (`proposal_loans`, `proposal_collaterals`)
- Phone contacts can be marked as `is_blocked` which blocks them from the call button
- All tables have `tenant_id` for multi-tenant isolation via RLS
- Valuations are a separate table linked to collaterals (not a field on collateral)

## Priority Queue Logic

Located in `src/utils/priorityQueue.ts`. Sort order:
1. Longest time since last interaction (descending)
2. Active alert count (descending)
3. Best proposal probability rank (deals > focus > pre_pipe)
4. Days to auction (ascending — closest first)
5. Strategy priority (DPO > PDV > DPO_encubierta > Loan_Sale > DIL > SAU > CDR > Repossession)

## Database Migrations

Located in `supabase/migrations/`. Run in order 001-010 via Supabase SQL Editor or CLI.
