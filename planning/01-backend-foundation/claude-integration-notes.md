# Review Integration Notes

**Reviewer:** Claude Opus subagent
**Date:** 2026-04-04

## Issues Integrated (fixing in plan)

| # | Severity | Issue | Fix |
|---|---|---|---|
| 1 | CRITICAL | TL write policy too broad — gives all TLs write access to all cases, should be team-scoped | Add team-scoping check to TL write policies |
| 2 | CRITICAL | `cases.legal_status` is TEXT but should be enum | Create `legal_status_type` enum |
| 3 | CRITICAL | Audit trigger fails during seed (auth.uid() is NULL) | Make `changed_by` nullable, use COALESCE |
| 4 | CRITICAL | `handle_new_user()` trigger under-specified | Add explicit metadata keys and defaults |
| 5 | IMPORTANT | Missing `documents` storage bucket | Add second bucket |
| 7 | IMPORTANT | No full-text search indexes for ILIKE | Add trigram indexes (pg_trgm) for ILIKE performance |
| 8 | IMPORTANT | Missing indexes on cadastral_ref, plot_registry, loans(tenant_id, case_id) | Add them |
| 9 | IMPORTANT | Junction tables missing tenant_id | Add tenant_id to proposal_loans and proposal_collaterals |
| 12 | SUGGESTION | Missing 'visit' in Interaction type | Add to type update section |

## Issues NOT Integrated (deferred or already handled)

| # | Issue | Reason |
|---|---|---|
| 6 | Missing Vercel serverless functions (segmentation, activity-summary) | Segmentation and activity-summary are Phase 2+ features. For Split 01, the DB function for search is sufficient. User creation via Supabase Dashboard is fine for PoC. |
| 10 | Write-then-refetch causes UI flicker | Noted as future optimization. Correctness first. |
| 11 | global_search as Postgres function vs REST endpoint | Plan already notes using supabase.rpc() — this is fine. |
