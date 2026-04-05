# Research: 01 — Backend Foundation

## Existing Codebase Summary

- **22 source files** in a React 19 + TypeScript + Vite + Tailwind CSS 4 SPA
- **No backend** — all data in `src/data/mockData.ts` (6 cases, in-memory)
- **Single React Context** (`CrmContext`) manages all state and actions
- **State-driven routing** via `ViewMode` enum (no router library)
- **Hardcoded user** "Carlos Ruiz" — no auth
- **Auto-generated IDs** using `Date.now()` — must be replaced with UUIDs
- **verbatimModuleSyntax** enabled — type-only imports must use `import type`

## Mock Data Shape

6 cases with mixed stages, demonstrating:
- Multi-party cases (borrower + guarantor)
- Invalid contacts (`isInvalid: true`)
- Multi-loan cases linked to collaterals via junction table
- Active and cancelled proposals
- Auction dates and insolvency statuses

## Key Refactoring Points

1. `CrmContext.tsx` — Replace `useState(mockCases)` with Supabase queries
2. `types.ts` — Expand enums (Strategy, CallResult, PartyRole, ContactType) and add new entities
3. All components that call `useCrm()` — Will work unchanged if context API stays the same
4. `mockData.ts` — Convert to SQL seed, then delete
5. ID generation — Replace `Date.now()` with Supabase-generated UUIDs
6. User identity — Replace hardcoded "Carlos Ruiz" with authenticated user from AuthContext

## Supabase Integration Notes

- Supabase JS client v2 works with Vite out of the box
- RLS policies use `auth.uid()` to get the current user
- Type generation: `supabase gen types typescript` produces a `database.types.ts`
- Supabase Storage for file uploads (collateral photos)
- Realtime subscriptions available for future live updates
