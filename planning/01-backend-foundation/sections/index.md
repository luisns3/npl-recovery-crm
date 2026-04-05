# Section Index: 01 — Backend Foundation

```SECTION_MANIFEST
section-01-supabase-setup.md
section-02-schema-enums-org.md
section-03-schema-core.md
section-04-schema-activity.md
section-05-schema-financial.md
section-06-schema-proposals.md
section-07-schema-docs-config.md
section-08-schema-triggers-search.md
section-09-rls-policies.md
section-10-storage-auth.md
section-11-types-update.md
section-12-seed-data.md
section-13-auth-context.md
section-14-crm-context-refactor.md
section-15-verification.md
```

## Section Descriptions

| # | File | Description | Dependencies |
|---|---|---|---|
| 01 | section-01-supabase-setup.md | Install Supabase client, create env config, create `src/lib/supabase.ts` | None |
| 02 | section-02-schema-enums-org.md | SQL Migration 01: All enums + tenants, teams, portfolios, users tables | 01 |
| 03 | section-03-schema-core.md | SQL Migration 02: groups, cases, parties, contacts, loans, collaterals, loan_collaterals, liens | 02 |
| 04 | section-04-schema-activity.md | SQL Migration 03: interactions, alerts | 03 |
| 05 | section-05-schema-financial.md | SQL Migration 04: valuations, affordability | 03 |
| 06 | section-06-schema-proposals.md | SQL Migration 05: proposals, proposal_loans, proposal_collaterals | 03 |
| 07 | section-07-schema-docs-config.md | SQL Migration 06: document_requests, collateral_photos, segmentation_config | 03 |
| 08 | section-08-schema-triggers-search.md | SQL Migration 07-08: audit_log, triggers, pg_trgm indexes, global_search function | 02-07 |
| 09 | section-09-rls-policies.md | RLS policies on all tables with team-scoped TL access | 02-07 |
| 10 | section-10-storage-auth.md | Storage buckets + Supabase auth config + handle_new_user trigger | 01, 02 |
| 11 | section-11-types-update.md | Update src/types.ts with expanded enums, new interfaces, updated constants | None (code only) |
| 12 | section-12-seed-data.md | seed.sql: tenant, portfolio, teams, users, 6 cases with all related data | 02-08 |
| 13 | section-13-auth-context.md | AuthContext.tsx, LoginPage.tsx, protect App.tsx | 01, 10, 11 |
| 14 | section-14-crm-context-refactor.md | Refactor CrmContext to use Supabase queries, create queries.ts | 01, 11, 12, 13 |
| 15 | section-15-verification.md | Install test deps, smoke tests, type check, build verification | All |

## Batch Execution

**Batch 1 (sequential — foundational):** 01, 02
**Batch 2 (parallel — schema tables):** 03, 04, 05, 06, 07
**Batch 3 (sequential — depends on all schema):** 08, 09, 10
**Batch 4 (can start after 01):** 11
**Batch 5 (sequential — depends on schema + config):** 12
**Batch 6 (sequential — depends on types + auth):** 13, 14
**Batch 7:** 15
