# Implementation Plan: 01 — Backend Foundation

**Split:** 01-backend-foundation
**Date:** 2026-04-04
**Tech:** Supabase (PostgreSQL + Auth + Storage) + Vercel

---

## What This Plan Achieves

By the end of this plan, the NPL Recovery CRM will:
- Have a real PostgreSQL database with all the tables needed for the full product
- Support user login/logout with email and password
- Show the logged-in user's name instead of hardcoded "Carlos Ruiz"
- Persist all data permanently (calls, proposals, alerts, contacts — everything survives a page refresh)
- Still work with the existing React frontend — same screens, same workflow, but with real data behind them
- Have seed data (migrated from the current mock data) ready for testing

---

## Section 1: Supabase Project Setup

### 1.1 Create Supabase Account and Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project:
   - Name: `npl-recovery-crm`
   - Region: **EU West** (closest to Madrid)
   - Set a strong database password (save it somewhere safe)
3. Wait for the project to finish provisioning (~2 minutes)
4. From the project dashboard, go to **Settings → API** and copy:
   - `Project URL` (e.g., `https://xxxxx.supabase.co`)
   - `anon public` key (this is safe to use in the frontend)

### 1.2 Install Supabase in the Project

In the project directory (`C:\Users\luisn\Desktop\npl-recovery-crm`):

```bash
npm install @supabase/supabase-js
```

### 1.3 Environment Variables

Create a file `.env.local` in the project root:
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
```

Add to `.gitignore` (if not already there):
```
.env.local
.env*.local
```

### 1.4 Supabase Client File

Create `src/lib/supabase.ts`:
- Import `createClient` from `@supabase/supabase-js`
- Read URL and key from `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Export a single `supabase` client instance
- Also export the generated database types (after Section 2)

---

## Section 2: Database Schema

All SQL runs in the **Supabase SQL Editor** (Dashboard → SQL Editor → New query) or via migration files.

The schema is split into logical groups. Each group is one SQL migration. Execute them in order.

### 2.1 Migration 01: Enums and Organizational Tables

**Enums to create:**
- `user_role`: admin, pm, tl, lam_phone, lam_field, ram, lm, external_lawyer, closing, middle_office, compliance
- `team_type`: commercial, legal, support
- `legal_status_type`: judicial, non_judicial
- `case_stage`: pre_contact, contacted, negotiating, proposal, resolved
- `strategy_type`: DPO, PDV, DPO_encubierta, Loan_Sale, DIL, SAU, CDR, Repossession
- `probability_type`: pre_pipe, focus, deals, firmada, cancelled
- `call_result_type`: not_answering, cup, cun, wrong_number, voicemail, callback, refused, third_party
- `party_role_type`: borrower, guarantor, co_borrower, legal_representative, tenant_legal, tenant_illegal, heir
- `contact_type`: phone, email, postal
- `occupancy_type`: debtor_occupied, legal_tenant, illegal_occupant, vacant, unknown
- `interaction_type`: call, note, visit
- `alert_type`: follow_up, auction_date, legal_deadline, payment_due, tl_priority, system, custom
- `valuation_type`: appraisal, third_party, case_manager
- `lien_type`: senior, junior
- `payment_terms_type`: lump_sum, installments
- `installment_frequency_type`: monthly, quarterly
- `document_status_type`: pending, received, not_applicable
- `marital_status_type`: single, married, divorced, widowed, unknown
- `employment_status_type`: employed, unemployed, self_employed, retired, unknown
- `yes_no_unknown`: yes, no, unknown
- `heirs_status`: yes, no, pending
- `audit_action`: insert, update, delete

**Tables:**
- `tenants` (id UUID PK, name TEXT, created_at TIMESTAMPTZ default now())
- `teams` (id UUID PK, tenant_id FK → tenants, name TEXT, type team_type, leader_id UUID nullable, created_at TIMESTAMPTZ)
- `portfolios` (id UUID PK, tenant_id FK → tenants, name TEXT, description TEXT, created_at TIMESTAMPTZ)

**Table: `users`** (linked to Supabase auth.users):
- id UUID PK (same as auth.users.id)
- tenant_id FK → tenants
- email TEXT
- full_name TEXT
- role user_role
- team_id FK → teams (nullable)
- is_active BOOLEAN default true
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

After creating `teams` and `users`, add the FK from `teams.leader_id` → `users.id` via ALTER TABLE.

### 2.2 Migration 02: Core Business Tables

**Table: `groups`**
- id UUID PK, tenant_id FK, name TEXT, created_at TIMESTAMPTZ

**Table: `cases`**
- id UUID PK, tenant_id FK, portfolio_id FK → portfolios, group_id FK → groups (nullable)
- reference TEXT (unique per tenant)
- stage case_stage
- strategy strategy_type
- assigned_to FK → users
- legal_status legal_status_type (enum: 'judicial', 'non_judicial')
- legal_procedure_type TEXT (nullable)
- legal_milestone TEXT (nullable)
- legal_milestone_date DATE (nullable)
- insolvency_status TEXT (nullable)
- auction_date DATE (nullable)
- auction_closed_date DATE (nullable)
- adjudication_date DATE (nullable)
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

**Indexes on cases:**
- (tenant_id, portfolio_id)
- (tenant_id, assigned_to)
- (tenant_id, group_id)
- UNIQUE (tenant_id, reference)

**Table: `parties`**
- id UUID PK, tenant_id FK, case_id FK → cases
- name TEXT, id_number TEXT (nullable), role party_role_type
- created_at TIMESTAMPTZ

**Indexes:** (tenant_id, case_id), index on id_number, trigram index on name, trigram index on id_number

**Table: `contacts`**
- id UUID PK, tenant_id FK, case_id FK → cases
- party_id FK → parties (nullable)
- lawyer_name TEXT (nullable)
- type contact_type, value TEXT
- is_blocked BOOLEAN default false
- block_reason TEXT (nullable), blocked_by FK → users (nullable), blocked_at TIMESTAMPTZ (nullable)
- added_by FK → users, added_at TIMESTAMPTZ

**CHECK constraint:** party_id IS NOT NULL OR lawyer_name IS NOT NULL

**Table: `loans`**
- id UUID PK, tenant_id FK, case_id FK → cases
- loan_reference TEXT, upb NUMERIC(15,2), accrued_interest NUMERIC(15,2), total_debt NUMERIC(15,2)
- strategy strategy_type
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

**Table: `collaterals`**
- id UUID PK, tenant_id FK
- property_type TEXT, address TEXT, cadastral_ref TEXT, plot_registry TEXT (nullable)
- surface_sqm NUMERIC(10,2)
- occupancy_status occupancy_type default 'unknown'
- latitude NUMERIC(9,6) (nullable), longitude NUMERIC(9,6) (nullable)
- created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ

**Table: `loan_collaterals`** (junction)
- loan_id FK → loans, collateral_id FK → collaterals, lien_rank INTEGER, tenant_id FK
- PK: (loan_id, collateral_id)

**Table: `liens`**
- id UUID PK, tenant_id FK, loan_id FK → loans, collateral_id FK → collaterals
- rank lien_type, holder TEXT, amount NUMERIC(15,2) (nullable), notes TEXT (nullable)
- updated_by FK → users, updated_at TIMESTAMPTZ

### 2.3 Migration 03: Activity Tables

**Table: `interactions`**
- id UUID PK, tenant_id FK, case_id FK → cases
- type interaction_type
- call_result call_result_type (nullable — null for notes/visits)
- participant_contacted_id FK → parties (nullable)
- phone_called TEXT (nullable)
- comment TEXT
- created_by FK → users, created_at TIMESTAMPTZ

**Indexes:** (tenant_id, case_id, created_at DESC), (tenant_id, created_by, created_at DESC)

**Table: `alerts`**
- id UUID PK, tenant_id FK, case_id FK → cases
- type alert_type, description TEXT, due_date DATE
- created_by FK → users, created_at TIMESTAMPTZ
- resolved_at TIMESTAMPTZ (nullable), resolved_by FK → users (nullable)

**Indexes:** (tenant_id, case_id, resolved_at), (tenant_id, due_date)

### 2.4 Migration 04: Financial Tables

**Table: `valuations`**
- id UUID PK, tenant_id FK, collateral_id FK → collaterals
- type valuation_type, source TEXT, amount NUMERIC(15,2), valuation_date DATE
- created_by FK → users, created_at TIMESTAMPTZ

**Table: `affordability`**
- id UUID PK, tenant_id FK, case_id FK → cases, party_id FK → parties
- marital_status marital_status_type default 'unknown'
- employment_status employment_status_type default 'unknown'
- minors_in_collateral yes_no_unknown default 'unknown'
- disabled_in_collateral yes_no_unknown default 'unknown'
- avg_monthly_income NUMERIC(10,2) (nullable)
- deceased BOOLEAN default false
- heirs_identified heirs_status default 'pending'
- heir_details TEXT (nullable)
- occupancy_status occupancy_type default 'unknown'
- notes TEXT (nullable)
- updated_by FK → users, updated_at TIMESTAMPTZ

**UNIQUE constraint:** (case_id, party_id)

### 2.5 Migration 05: Proposal Tables

**Table: `proposals`**
- id UUID PK, tenant_id FK, case_id FK → cases
- strategy_type strategy_type, amount NUMERIC(15,2)
- payment_terms payment_terms_type
- installment_count INTEGER (nullable), installment_frequency installment_frequency_type (nullable)
- probability probability_type
- expected_closing_date DATE
- bank_movement_id TEXT (nullable)
- created_by FK → users, created_at TIMESTAMPTZ
- cancelled_at TIMESTAMPTZ (nullable), cancelled_by FK → users (nullable)

**Table: `proposal_loans`** (junction)
- proposal_id FK → proposals, loan_id FK → loans, tenant_id FK → tenants
- PK: (proposal_id, loan_id)

**Table: `proposal_collaterals`** (junction)
- proposal_id FK → proposals, collateral_id FK → collaterals, tenant_id FK → tenants
- PK: (proposal_id, collateral_id)

### 2.6 Migration 06: Documents, Photos, Config

**Table: `document_requests`**
- id UUID PK, tenant_id FK, case_id FK → cases
- document_type TEXT, status document_status_type default 'pending'
- notes TEXT (nullable)
- requested_by FK → users, requested_at TIMESTAMPTZ
- received_at TIMESTAMPTZ (nullable)

**Table: `collateral_photos`**
- id UUID PK, tenant_id FK, collateral_id FK → collaterals
- storage_path TEXT
- uploaded_by FK → users, uploaded_at TIMESTAMPTZ

**Table: `segmentation_config`** (one row per tenant)
- id UUID PK, tenant_id FK (UNIQUE)
- ltv_low_threshold NUMERIC(5,2) default 50.00
- ltv_high_threshold NUMERIC(5,2) default 80.00
- prepipe_realistic_days INTEGER default 90
- cun_high_threshold INTEGER default 5
- contact_attempt_threshold INTEGER default 5
- small_ticket_amount NUMERIC(15,2) default 50000.00
- legal_milestone_window_days INTEGER default 14
- updated_by FK → users, updated_at TIMESTAMPTZ

### 2.7 Migration 07: Audit Trail and Triggers

**Table: `audit_log`**
- id UUID PK (default gen_random_uuid())
- tenant_id UUID, table_name TEXT, record_id UUID
- action audit_action
- old_values JSONB (nullable), new_values JSONB (nullable)
- changed_by UUID, changed_at TIMESTAMPTZ default now()

**Database function: `update_updated_at()`**
- BEFORE UPDATE trigger that sets `NEW.updated_at = NOW()`
- Apply to: cases, users, loans, collaterals, affordability, segmentation_config, liens

**Database function: `audit_trigger()`**
- AFTER INSERT OR UPDATE OR DELETE trigger
- Logs old/new values as JSONB to audit_log
- Uses `COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid)` for changed_by (nullable-safe for seed scripts where auth.uid() is NULL)
- `audit_log.changed_by` must be nullable
- Apply to: cases, interactions, proposals, affordability, contacts, alerts, liens, valuations

### 2.8 Migration 08: Full-Text Search

Create a PostgreSQL full-text search function that searches across multiple tables:

**Function: `global_search(search_term TEXT, p_tenant_id UUID)`**
Returns a table of results with columns: entity_type, entity_id, case_id, display_text, match_field

Searches:
- `cases.reference`
- `loans.loan_reference`
- `parties.name` and `parties.id_number`
- `groups.name` and `groups.id`
- `collaterals.address`, `collaterals.cadastral_ref`, `collaterals.plot_registry`

Uses `ILIKE '%' || search_term || '%'` with **trigram indexes** (`pg_trgm` extension) for performance:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_cases_reference_trgm ON cases USING gin (reference gin_trgm_ops);
CREATE INDEX idx_loans_reference_trgm ON loans USING gin (loan_reference gin_trgm_ops);
CREATE INDEX idx_parties_name_trgm ON parties USING gin (name gin_trgm_ops);
CREATE INDEX idx_parties_id_number_trgm ON parties USING gin (id_number gin_trgm_ops);
CREATE INDEX idx_collaterals_address_trgm ON collaterals USING gin (address gin_trgm_ops);
CREATE INDEX idx_collaterals_cadastral_trgm ON collaterals USING gin (cadastral_ref gin_trgm_ops);
CREATE INDEX idx_collaterals_plot_trgm ON collaterals USING gin (plot_registry gin_trgm_ops);
```

This makes ILIKE queries use indexes instead of full table scans, scaling to 50k+ cases.

---

## Section 3: Row-Level Security (RLS)

### 3.1 Enable RLS on All Tables

Run `ALTER TABLE [table] ENABLE ROW LEVEL SECURITY` on every table.

### 3.2 Tenant Isolation Policy

For every table, create a SELECT policy:
```sql
CREATE POLICY "tenant_isolation" ON [table]
  FOR SELECT USING (
    tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())
  );
```

### 3.3 Write Policies

**Cases:** UPDATE allowed if user is assigned to the case, OR user's role is admin/pm, OR user is a TL whose team contains the assigned case manager
**Interactions:** INSERT allowed same pattern as cases
**Proposals:** INSERT/UPDATE allowed same pattern as cases
**Contacts:** INSERT/UPDATE same pattern
**Alerts:** INSERT allowed by anyone (case managers create their own, TLs create for agents)
**Affordability:** INSERT/UPDATE same as cases pattern
**Users:** Only admin/pm can INSERT/UPDATE

**TL team-scoping (critical):** TL write policies must check that the case's assigned_to user belongs to the TL's team:
```sql
EXISTS (
  SELECT 1 FROM users assigned_user
  WHERE assigned_user.id = cases.assigned_to
    AND assigned_user.team_id = (SELECT team_id FROM users WHERE id = auth.uid())
)
```
This prevents a Commercial TL from editing Legal team cases and vice versa.

### 3.4 Service Role Bypass

The `service_role` key (never used in frontend) bypasses all RLS. Only used in seed scripts and serverless functions that need full access.

---

## Section 4: Supabase Storage

### 4.1 Create Storage Bucket

In Supabase Dashboard → Storage → Create new bucket:
- Name: `collateral-photos`
- Public: No (authenticated access only)

Create a second bucket:
- Name: `documents`
- Public: No (authenticated access only)
- For future use: lawyer uploads, court documents (Split 08)

### 4.2 Storage Policies

Create policies via SQL:
- **Upload:** Authenticated users can upload to `collateral-photos`
- **Download:** Authenticated users can read from `collateral-photos`
- **File path convention:** `{tenant_id}/{collateral_id}/{filename}`

---

## Section 5: Authentication Setup

### 5.1 Supabase Auth Configuration

In Supabase Dashboard → Authentication → Providers:
- Enable **Email** provider
- Disable email confirmation for PoC (Settings → Auth → toggle off "Confirm email")
- Set minimum password length to 8

### 5.2 User Creation Flow

For the PoC, users are created manually via the Supabase Dashboard or via the seed script. The flow:

1. Create the user in Supabase Auth (Dashboard → Authentication → Users → Add user)
2. This creates a row in `auth.users`
3. A database trigger automatically creates the corresponding row in public `users` table

**Database trigger: `handle_new_user()`**
- AFTER INSERT on `auth.users`
- Inserts into public `users` with: id = auth.users.id, email = auth.users.email
- Reads from `raw_user_meta_data` JSONB: `full_name` (TEXT), `role` (TEXT, cast to user_role), `tenant_id` (UUID), `team_id` (UUID, nullable)
- **Defaults if metadata missing:** role = 'lam_phone', full_name = email, tenant_id = (first tenant in tenants table)
- The metadata keys are passed during user creation: `supabase.auth.admin.createUser({ email, password, user_metadata: { full_name, role, tenant_id, team_id } })`

### 5.3 Frontend Auth Context

Create `src/context/AuthContext.tsx`:

**AuthProvider** wraps the app and manages:
- `session` — the Supabase auth session (contains access token)
- `user` — the public user profile (role, team, tenant, full_name)
- `loading` — true while checking if user is logged in

**On mount:**
1. Call `supabase.auth.getSession()` to check for existing session
2. If session exists, fetch the user's profile from public `users` table
3. Subscribe to `supabase.auth.onAuthStateChange` for login/logout events

**Exports:**
- `useAuth()` hook — returns session, user, loading, signIn, signOut
- `signIn(email, password)` — calls `supabase.auth.signInWithPassword()`
- `signOut()` — calls `supabase.auth.signOut()`

### 5.4 Login Page

Create `src/components/Auth/LoginPage.tsx`:
- Simple centered card with email input, password input, "Sign In" button
- Shows error message on failed login
- No registration form (users are created by admin for PoC)
- On successful login → redirects to dashboard

### 5.5 Protected Routes

Modify `App.tsx`:
- Wrap content in `AuthProvider`
- If `loading` → show spinner
- If no session → show `LoginPage`
- If session exists → show the normal app (Layout + views)

---

## Section 6: Refactor CrmContext to Use Supabase

This is the most critical section. The goal: replace in-memory state with Supabase queries while keeping the same API that all components already use.

### 6.1 Strategy: Keep the Same Interface

Components call `useCrm()` and get back `CrmState & CrmActions`. We keep this interface identical. Components don't change. Only the internals of CrmContext change.

### 6.2 State Changes

**Before (mock):**
```typescript
const [cases, setCases] = useState<Case[]>(mockCases);
```

**After (Supabase):**
```typescript
const [cases, setCases] = useState<Case[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchCases(); // Loads from Supabase on mount
}, []);
```

### 6.3 Data Fetching

Create `src/lib/queries.ts` — a module with all Supabase query functions:

**`fetchCasesForUser(userId)`** — Fetches all cases for the user's tenant (read access is broad), with nested joins:
- cases → parties, loans, collaterals (via loan_collaterals), interactions (latest 20), alerts (active), proposals

**`fetchCaseById(caseId)`** — Fetches a single case with all related data (for case detail view)

**`logInteraction(data)`** — Inserts into interactions table

**`createAlert(data)`** — Inserts into alerts table

**`updateCaseStrategy(caseId, strategy)`** — Updates case.strategy

**`addContact(data)`** — Inserts into contacts table

**`blockContact(contactId, reason, userId)`** — Updates contact: is_blocked=true, block_reason, blocked_by, blocked_at

**`createProposal(data)`** — Inserts into proposals + proposal_loans + proposal_collaterals

**`updateProposal(proposalId, updates)`** — Updates proposal fields

### 6.4 Action Refactoring

Each action in CrmContext changes from an in-memory mutation to a Supabase call + local state refresh:

**Example: `logCall`**
```
Before: Mutate cases array in memory
After:  1. Call logInteraction() to insert into DB
        2. Refetch the current case to get updated data
        3. Update local state with fresh data
```

This pattern (write to DB → refetch → update local state) is simple and reliable. It's not the most performant approach, but it's correct and easy to debug. Optimistic updates can come later.

### 6.5 User Identity

Replace all hardcoded "Carlos Ruiz" references:
- `CrmContext` gets the current user from `useAuth()`
- `createdBy`, `addedBy`, etc. use `user.id` instead of a string name
- Display uses `user.full_name`

### 6.6 ID Generation

Replace all `Date.now()` ID generation:
- Supabase auto-generates UUIDs on INSERT (columns have `DEFAULT gen_random_uuid()`)
- After INSERT, read back the returned row to get the generated ID
- The Supabase client's `.insert().select()` returns the inserted row with its new ID

---

## Section 7: Update Types

### 7.1 Generate Types from Supabase

After the schema is created, run:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

This generates TypeScript types that exactly match the database schema.

### 7.2 Update src/types.ts

Keep `src/types.ts` as the application-level type definitions, but align them with the new database schema:

**Expand existing types:**
- `Strategy` — add DPO_encubierta, DIL, SAU, CDR
- `CallResult` — replace with cup, cun, not_answering, wrong_number, voicemail, callback, refused, third_party
- `InteractionType` — add 'visit' alongside 'call' and 'note'
- `PartyRole` — add tenant_legal, tenant_illegal, heir
- `ContactType` — add postal
- `Probability` — rename Signed to firmada, align casing

**Add new types:**
- `Affordability` interface
- `Valuation` interface
- `Lien` interface
- `DocumentRequest` interface
- `CollateralPhoto` interface
- `UserProfile` interface (id, email, fullName, role, teamId, tenantId)

**Update existing interfaces:**
- `Contact` — add is_blocked, block_reason, blocked_by, blocked_at, lawyer_name; rename isInvalid to is_blocked
- `Proposal` — add affectedLoanIds, affectedCollateralIds, amount, paymentTerms, etc.
- `Collateral` — add occupancy_status, latitude, longitude; expand valuation to be a separate entity
- `Loan` — rename outstandingAmount to upb, add accrued_interest, total_debt
- `Case` — add group_id, portfolio_id, auction_closed_date, adjudication_date

**Update constants:**
- `CALL_RESULT_LABELS` — new labels for 8 outcomes
- `STRATEGY_PRIORITY` — expanded list
- Add `STRATEGY_LABELS` for display names

---

## Section 8: Seed Data

### 8.1 Create Seed SQL File

Create `supabase/seed.sql` that inserts:

1. **1 tenant:** "NPL Servicer Demo"
2. **1 portfolio:** "Project Venus 2024"
3. **1 team:** "Commercial Team A" (type: commercial)
4. **4 users:**
   - Admin/PM: Luis (admin role)
   - Team Leader: Javier (tl role)
   - LAM: Carlos Ruiz (lam_phone role) — the existing mock user
   - RAM: Elena Vega (ram role)
5. **2 groups:** "Martinez-Fernandez Group", "Lopez Group"
6. **6 cases:** Migrated from current mockData.ts, with proper UUIDs, linked to tenant/portfolio/group/user
7. **All related entities:** Parties, contacts, loans, collaterals, loan_collaterals, interactions, alerts, proposals — all migrated from mock data
8. **New entities:** Sample affordability records, valuations (appraisal for each collateral), segmentation_config defaults
9. **Some blocked contacts** with reasons (to test the blocking feature)

### 8.2 Run the Seed

Execute via Supabase SQL Editor or via:
```bash
npx supabase db reset  # If using Supabase CLI locally
```

Or paste directly into Supabase Dashboard → SQL Editor.

---

## Section 9: Delete Mock Data

Once the seed data is working and the frontend is connected to Supabase:

1. Delete `src/data/mockData.ts`
2. Remove the import from `CrmContext.tsx`
3. Verify the app still works with real data

---

## Section 10: Verify Everything Works

### 10.1 Smoke Test Checklist

Run through this manually after completing all sections:

- [ ] App loads without errors
- [ ] Login page appears for unauthenticated users
- [ ] Can log in as Carlos Ruiz (LAM)
- [ ] Dashboard shows 6 cases from seed data
- [ ] Kanban board displays cases by stage
- [ ] Call queue is sorted by priority
- [ ] Can open a case detail view
- [ ] Case shows: parties, contacts, loans, collaterals, interactions, alerts, proposals
- [ ] Can click "CALL NOW" and log a call with a result
- [ ] Call is persisted (refresh page → call still there)
- [ ] Can create an alert → persisted
- [ ] Can change strategy → persisted
- [ ] Can add a contact → persisted
- [ ] Can block a phone → persisted with reason
- [ ] Can create a proposal → persisted
- [ ] Can log out and log back in
- [ ] Data is still there after logout/login cycle

### 10.2 Type Check

```bash
npx tsc --noEmit
```

Should pass with zero errors.

### 10.3 Build

```bash
npm run build
```

Should complete successfully.

---

## Execution Order Summary

| Step | Section | What it does | Estimated complexity |
|---|---|---|---|
| 1 | Section 1 | Supabase project + client setup | Low |
| 2 | Section 2.1-2.8 | Database schema (8 migrations) | Medium |
| 3 | Section 3 | Row-level security policies | Medium |
| 4 | Section 4 | Storage bucket for photos | Low |
| 5 | Section 5 | Auth setup + login page + AuthContext | Medium |
| 6 | Section 7 | Update TypeScript types | Medium |
| 7 | Section 8 | Seed data | Medium |
| 8 | Section 6 | Refactor CrmContext to Supabase | High (most work) |
| 9 | Section 9 | Delete mock data | Low |
| 10 | Section 10 | Verify everything | Low |

**The critical path is Section 6** — refactoring CrmContext. Everything else is infrastructure that enables it.
