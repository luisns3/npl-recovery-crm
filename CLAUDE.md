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
- Components are organized by feature area: `Dashboard/`, `CaseDetail/`, `CallLog/`, `NextAction/`, `Proposals/`, `Auth/`, `GroupView/`, `Perimeter/`, `Tasks/`, `CallQueue/`, `ActiveCall/`
- All entity types are defined in `src/types.ts` — this is the single source of truth for the data model
- The call flow is enforced: Active Call → Call Log (mandatory) → Next Action → Next Case
- Database queries live in `src/lib/queries.ts`

## Case = Group (important)

**"Case" and "group" are the same thing.** Every expediente is both a case and a group — one entity, one view. `GroupViewScreen` is the universal case detail view. `openCase(id)` is an alias for `openGroup(id)` and always opens `GroupViewScreen`. Never use `group_id` as a navigation target — always use `c.id`. The `case_detail` ViewMode still exists in code but is unreachable via normal navigation.

## Data Model Notes

- A `Case` (expediente) contains parties, contacts, loans, collaterals, interactions, alerts, and proposals
- Loans and collaterals have a many-to-many relationship via `loan_collaterals` (fields: `loan_id`, `collateral_id`, `lien_rank`, `is_enforced`)
- **Judicial procedures:** One procedimiento per loan (`loan.procedimiento_id`). Collaterals do NOT have their own `procedimiento_id`. Which collaterals are included in the enforcement is tracked via `loan_collaterals.is_enforced = TRUE`.
- Proposals are linked to loans and collaterals via junction tables (`proposal_loans`, `proposal_collaterals`)
- Phone contacts can be marked as `is_blocked` which blocks them from the call button
- All tables have `tenant_id` for multi-tenant isolation via RLS
- Valuations are a separate table linked to collaterals (not a field on collateral)

## GroupView Tabs

`GroupViewScreen` has 8 tabs: Resumen · Participantes · Actividad · Propuestas · Deuda · Legal · Documentos · Conciliación Bancaria

## Priority Queue Logic

Located in `src/utils/priorityQueue.ts`. Sort order:
1. Longest time since last interaction (descending)
2. Active alert count (descending)
3. Best proposal probability rank (deals > focus > pre_pipe)
4. Days to auction (ascending — closest first)
5. Strategy priority (DPO > PDV > DPO_encubierta > Loan_Sale > DIL > SAU > CDR > Repossession)

## Database Migrations

Located in `supabase/migrations/`. Run in order 001-012 via Supabase SQL Editor or CLI.
