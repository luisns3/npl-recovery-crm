# Spec: 01 — Backend Foundation

**Split:** 01-backend-foundation
**Priority:** Pre-requisite (before all phases)
**Depends on:** Nothing
**Status:** Draft

---

## Overview

Set up the entire backend infrastructure that every other split depends on: Supabase project, PostgreSQL schema, authentication, role-based access, row-level security, API layer, and seed data. After this split, the frontend can replace mock data with real persisted data.

---

## 1. Supabase Project Setup

### 1A. Create Supabase Project
- Create a new Supabase project (free tier is fine for PoC)
- Region: EU (Frankfurt or closest to Madrid)
- Note the project URL, anon key, and service role key

### 1B. Environment Configuration
- Create `.env.local` in the project root:
  ```
  VITE_SUPABASE_URL=https://xxxxx.supabase.co
  VITE_SUPABASE_ANON_KEY=xxxxx
  ```
- Add `.env.local` to `.gitignore`
- Install Supabase client: `@supabase/supabase-js`

### 1C. Supabase Client
- Create `src/lib/supabase.ts` — initializes and exports the Supabase client
- Create `src/lib/database.types.ts` — auto-generated TypeScript types from Supabase schema (using `supabase gen types typescript`)

### 1D. Vercel Integration
- Connect Supabase project to Vercel (environment variables)
- Verify the app deploys and can reach the database

---

## 2. PostgreSQL Schema

All tables include `tenant_id` (UUID, NOT NULL) for future multi-tenancy. For now, a single tenant is seeded.

All tables include `created_at` (timestamptz, default now()) and `updated_at` (timestamptz, auto-updated via trigger).

Soft deletes where applicable (no physical row deletion).

### 2A. Organizational Tables

#### `tenants`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | text | Company name |
| created_at | timestamptz | |

#### `users`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | References Supabase auth.users |
| tenant_id | UUID FK | → tenants |
| email | text | Unique per tenant |
| full_name | text | |
| role | enum | admin, pm, tl, lam_phone, lam_field, ram, lm, external_lawyer, closing, middle_office, compliance |
| team_id | UUID FK | → teams (nullable for PM/admin) |
| is_active | boolean | Soft delete |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Constraints:**
- One role per user (enforced by single enum column)
- `role` enum: `('admin', 'pm', 'tl', 'lam_phone', 'lam_field', 'ram', 'lm', 'external_lawyer', 'closing', 'middle_office', 'compliance')`

#### `teams`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| name | text | e.g., "Commercial Team A", "Legal Team" |
| type | enum | `('commercial', 'legal', 'support')` |
| leader_id | UUID FK | → users (the TL) |
| created_at | timestamptz | |

**Constraints:**
- Commercial teams can only have LAM and RAM members
- Legal teams can only have LM members
- Support teams can have Closing, MO, Compliance members
- Enforced via application logic + check constraints

#### `portfolios`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| name | text | e.g., "Project Venus 2024" |
| description | text | |
| created_at | timestamptz | |

### 2B. Core Business Tables

#### `groups`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| name | text | Typically primary debtor name |
| created_at | timestamptz | |

#### `cases`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| portfolio_id | UUID FK | → portfolios |
| group_id | UUID FK | → groups (nullable) |
| reference | text | Unique case reference, e.g., "EXP-2024-00456" |
| stage | enum | `('pre_contact', 'contacted', 'negotiating', 'proposal', 'resolved')` |
| strategy | enum | `('DPO', 'PDV', 'DPO_encubierta', 'Loan_Sale', 'DIL', 'SAU', 'CDR', 'Repossession')` |
| assigned_to | UUID FK | → users (the case manager) |
| legal_status | enum | `('judicial', 'non_judicial')` |
| legal_procedure_type | text | Foreclosure, Insolvency, etc. (nullable) |
| legal_milestone | text | Current legal milestone (nullable) |
| legal_milestone_date | date | When the milestone changed (nullable) |
| insolvency_status | text | (nullable) |
| auction_date | date | Upcoming auction date (nullable) |
| auction_closed_date | date | When auction closed (nullable) |
| adjudication_date | date | When award was granted (nullable, resets REO ageing) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:**
- `(tenant_id, portfolio_id)`
- `(tenant_id, assigned_to)`
- `(tenant_id, group_id)`
- `(tenant_id, reference)` — unique
- Full-text search index on `reference`

#### `parties`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| name | text | Full name |
| id_number | text | DNI/NIF/CIF (nullable) |
| role | enum | `('borrower', 'guarantor', 'co_borrower', 'legal_representative', 'tenant_legal', 'tenant_illegal', 'heir')` |
| created_at | timestamptz | |

**Indexes:**
- `(tenant_id, case_id)`
- Full-text search index on `name`
- Index on `id_number`

#### `contacts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| party_id | UUID FK | → parties (nullable) |
| lawyer_name | text | If contact belongs to a lawyer (nullable) |
| type | enum | `('phone', 'email', 'postal')` |
| value | text | The phone number / email / address |
| is_blocked | boolean | Default false |
| block_reason | text | (nullable) |
| blocked_by | UUID FK | → users (nullable) |
| blocked_at | timestamptz | (nullable) |
| added_by | UUID FK | → users |
| added_at | timestamptz | |

**Constraints:**
- Either `party_id` OR `lawyer_name` must be set (not both null)

#### `loans`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| loan_reference | text | External loan ID |
| upb | numeric(15,2) | Unpaid Principal Balance |
| accrued_interest | numeric(15,2) | |
| total_debt | numeric(15,2) | Computed or stored (UPB + interest) |
| strategy | enum | Same as case strategy enum — per-loan strategy |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:**
- `(tenant_id, case_id)`
- Full-text search index on `loan_reference`

#### `collaterals`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| property_type | text | Residential, Commercial, Land, Industrial, Parking, Storage, etc. |
| address | text | Full address |
| cadastral_ref | text | Cadastral reference |
| plot_registry | text | Registro de la Propiedad reference (nullable) |
| surface_sqm | numeric(10,2) | |
| occupancy_status | enum | `('debtor_occupied', 'legal_tenant', 'illegal_occupant', 'vacant', 'unknown')` |
| latitude | numeric(9,6) | For map display (nullable) |
| longitude | numeric(9,6) | For map display (nullable) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

**Indexes:**
- Full-text search index on `address`
- Index on `cadastral_ref`
- Index on `plot_registry`

#### `loan_collaterals` (junction table)
| Column | Type | Notes |
|---|---|---|
| loan_id | UUID FK | → loans |
| collateral_id | UUID FK | → collaterals |
| lien_rank | integer | 1 = first lien, 2 = second, etc. |
| tenant_id | UUID FK | → tenants |

**PK:** `(loan_id, collateral_id)`

#### `liens`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| loan_id | UUID FK | → loans |
| collateral_id | UUID FK | → collaterals |
| rank | enum | `('senior', 'junior')` |
| holder | text | Who holds the lien |
| amount | numeric(15,2) | Estimated lien amount (nullable) |
| notes | text | (nullable) |
| updated_by | UUID FK | → users |
| updated_at | timestamptz | |

### 2C. Activity Tables

#### `interactions`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| type | enum | `('call', 'note', 'visit')` |
| call_result | enum | `('not_answering', 'cup', 'cun', 'wrong_number', 'voicemail', 'callback', 'refused', 'third_party')` — nullable (null for notes/visits) |
| participant_contacted_id | UUID FK | → parties (nullable) |
| phone_called | text | The phone number that was called (nullable) |
| comment | text | |
| created_by | UUID FK | → users |
| created_at | timestamptz | |

**Indexes:**
- `(tenant_id, case_id, created_at DESC)` — for interaction history
- `(tenant_id, created_by, created_at DESC)` — for agent activity queries

#### `alerts`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| type | enum | `('follow_up', 'auction_date', 'legal_deadline', 'payment_due', 'tl_priority', 'system', 'custom')` |
| description | text | |
| due_date | date | |
| created_by | UUID FK | → users |
| created_at | timestamptz | |
| resolved_at | timestamptz | (nullable) |
| resolved_by | UUID FK | → users (nullable) |

**Indexes:**
- `(tenant_id, case_id, resolved_at)` — for active alerts
- `(tenant_id, due_date)` — for agenda views

### 2D. Financial Tables

#### `valuations`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| collateral_id | UUID FK | → collaterals |
| type | enum | `('appraisal', 'third_party', 'case_manager')` |
| source | text | Who provided it |
| amount | numeric(15,2) | |
| valuation_date | date | |
| created_by | UUID FK | → users |
| created_at | timestamptz | |

#### `affordability`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| party_id | UUID FK | → parties |
| marital_status | enum | `('single', 'married', 'divorced', 'widowed', 'unknown')` |
| employment_status | enum | `('employed', 'unemployed', 'self_employed', 'retired', 'unknown')` |
| minors_in_collateral | enum | `('yes', 'no', 'unknown')` |
| disabled_in_collateral | enum | `('yes', 'no', 'unknown')` |
| avg_monthly_income | numeric(10,2) | (nullable) |
| deceased | boolean | Default false |
| heirs_identified | enum | `('yes', 'no', 'pending')` |
| heir_details | text | (nullable) |
| occupancy_status | enum | Same as collaterals occupancy enum |
| notes | text | (nullable) |
| updated_by | UUID FK | → users |
| updated_at | timestamptz | |

**Constraint:** Unique on `(case_id, party_id)` — one affordability record per participant per case.

### 2E. Proposal Tables

#### `proposals`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| strategy_type | enum | Same as strategy enum |
| amount | numeric(15,2) | |
| payment_terms | enum | `('lump_sum', 'installments')` |
| installment_count | integer | (nullable) |
| installment_frequency | enum | `('monthly', 'quarterly')` (nullable) |
| probability | enum | `('pre_pipe', 'focus', 'deals', 'firmada', 'cancelled')` |
| expected_closing_date | date | |
| bank_movement_id | text | Linked after signing (nullable) |
| created_by | UUID FK | → users |
| created_at | timestamptz | |
| cancelled_at | timestamptz | (nullable) |
| cancelled_by | UUID FK | → users (nullable) |

#### `proposal_loans` (junction)
| Column | Type | Notes |
|---|---|---|
| proposal_id | UUID FK | → proposals |
| loan_id | UUID FK | → loans |

**PK:** `(proposal_id, loan_id)`

#### `proposal_collaterals` (junction)
| Column | Type | Notes |
|---|---|---|
| proposal_id | UUID FK | → proposals |
| collateral_id | UUID FK | → collaterals |

**PK:** `(proposal_id, collateral_id)`

### 2F. Document & Photo Tables

#### `document_requests`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| case_id | UUID FK | → cases |
| document_type | text | Registry excerpt, Debt certificate, etc. |
| status | enum | `('pending', 'received', 'not_applicable')` |
| notes | text | (nullable) |
| requested_by | UUID FK | → users |
| requested_at | timestamptz | |
| received_at | timestamptz | (nullable) |

#### `collateral_photos`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| collateral_id | UUID FK | → collaterals |
| storage_path | text | Path in Supabase Storage |
| uploaded_by | UUID FK | → users |
| uploaded_at | timestamptz | |

### 2G. Configuration Tables

#### `segmentation_config`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| ltv_low_threshold | numeric(5,2) | Default: 50.00 (%) |
| ltv_high_threshold | numeric(5,2) | Default: 80.00 (%) |
| prepipe_realistic_days | integer | Default: 90 |
| cun_high_threshold | integer | Default: 5 |
| contact_attempt_threshold | integer | Default: 5 |
| small_ticket_amount | numeric(15,2) | Default: TBD |
| legal_milestone_window_days | integer | Default: 14 |
| updated_by | UUID FK | → users |
| updated_at | timestamptz | |

**Constraint:** One row per tenant.

### 2H. Audit Trail

#### `audit_log`
| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| tenant_id | UUID FK | → tenants |
| table_name | text | Which table was changed |
| record_id | UUID | Which record |
| action | enum | `('insert', 'update', 'delete')` |
| old_values | jsonb | Previous values (nullable for inserts) |
| new_values | jsonb | New values (nullable for deletes) |
| changed_by | UUID FK | → users |
| changed_at | timestamptz | Default now() |

Populated via PostgreSQL triggers on key tables: cases, interactions, proposals, affordability, contacts, alerts.

---

## 3. Authentication & Authorization

### 3A. Supabase Auth Setup
- Enable email/password authentication
- Disable email confirmation for PoC (enable later for production)
- Create a custom `users` table (2A above) linked to `auth.users` via `id`
- On user signup/creation, insert into both `auth.users` and public `users`

### 3B. Role-Based Access
- User's role is stored in the `users` table
- After login, the frontend fetches the user's profile (role, team, tenant) and stores it in React context
- Role determines which views/routes are accessible (enforced in frontend for now, RLS for data)

### 3C. Row-Level Security (RLS)

**All tables have RLS enabled.**

**Base policy (all tables):**
```sql
-- Users can only see data from their own tenant
CREATE POLICY tenant_isolation ON [table]
  FOR ALL
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
```

**Write policies (perimeter-restricted):**
```sql
-- Case managers can only modify cases assigned to them
-- (read access is unrestricted within tenant)
CREATE POLICY case_write ON cases
  FOR UPDATE
  USING (assigned_to = auth.uid() OR 
         EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'pm', 'tl')));
```

Similar patterns for interactions (only log on your assigned cases or if TL/PM), proposals, contacts, etc.

**PM and Admin** have write access to all records within their tenant.
**TL** has write access to all records for their team's cases.

### 3D. Admin User Seeding
- Create an initial admin/PM user via Supabase dashboard or seed script
- This user can then create other users through the app (PM admin functions, deferred to Split 07 for full UI, but the API must work now)

---

## 4. API Layer

### 4A. Supabase Client (Direct)
Most CRUD operations go through the Supabase JS client directly from the frontend. RLS handles authorization.

**Standard operations:**
- Fetch cases (with joins to parties, loans, collaterals, etc.)
- Fetch interactions for a case
- Create interaction (log a call)
- Create/update alert
- Create/update contact
- Create/update affordability
- Create proposal
- Update case strategy
- Upload collateral photo (Supabase Storage)

### 4B. Vercel Serverless Functions (Custom Business Logic)
For operations that need server-side logic beyond simple CRUD:

| Function | Description |
|---|---|
| `POST /api/search` | Global search across multiple tables (Loan ID, participant name, etc.) — uses PostgreSQL full-text search |
| `GET /api/segmentation/:caseId` | Compute the 26-bucket classification for a case based on current data |
| `GET /api/segmentation/summary` | Bucket counts for a user's perimeter or full portfolio |
| `GET /api/activity-summary/:userId` | Yesterday's activity, 7-day avg, team avg for the login popup |
| `POST /api/users` | Create a new user (admin/PM only) — creates auth.users + public.users |

### 4C. Database Functions (PostgreSQL)

```sql
-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (repeat for all relevant tables)
```

```sql
-- Audit log trigger
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (tenant_id, table_name, record_id, action, old_values, new_values, changed_by, changed_at)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP::text,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    auth.uid(),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to audited tables
CREATE TRIGGER audit_cases AFTER INSERT OR UPDATE OR DELETE ON cases
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();
-- (repeat for: interactions, proposals, affordability, contacts, alerts, liens, valuations)
```

---

## 5. Supabase Storage

### 5A. Buckets
- `collateral-photos` — public read, authenticated write
- `documents` — private (for future lawyer uploads, Split 08)

### 5B. Storage Policies
```sql
-- Collateral photos: any authenticated user in the same tenant can upload
CREATE POLICY photo_upload ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'collateral-photos' AND auth.role() = 'authenticated');

-- Collateral photos: any authenticated user can read
CREATE POLICY photo_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'collateral-photos' AND auth.role() = 'authenticated');
```

---

## 6. Seed Data

### 6A. Migrate Mock Data
Convert the 6 existing mock cases from `src/data/mockData.ts` into a SQL seed file or Supabase seed script.

**Seed contents:**
- 1 tenant
- 1 portfolio
- 3 users: 1 PM, 1 TL, 1 LAM (Carlos Ruiz — the current mock user)
- 1 team (Commercial Team A)
- 6 cases (from current mock data) with all related entities
- Expand mock data to include: affordability records, valuations, liens, document requests

### 6B. Additional Seed Data
Add at least:
- 2 more users (1 RAM, 1 additional LAM) to test multi-user scenarios
- 2 groups (to test group view)
- Multiple valuations per collateral
- Some blocked contacts with reasons
- A mix of call outcomes across interactions
- Segmentation config with default thresholds

---

## 7. Frontend Integration Layer

### 7A. Replace CrmContext
Replace the current in-memory `CrmContext` with Supabase-backed state:

- `src/lib/supabase.ts` — Supabase client initialization
- `src/context/AuthContext.tsx` — Authentication state (current user, role, tenant)
- Refactor `src/context/CrmContext.tsx` — Replace `useState(mockCases)` with Supabase queries

### 7B. Data Fetching Pattern
Use Supabase client directly in context/hooks:
```typescript
// Example: fetch cases for current user's perimeter
const { data: cases } = await supabase
  .from('cases')
  .select(`
    *,
    parties (*),
    loans (*),
    collaterals:loan_collaterals(collateral:collaterals(*)),
    interactions (*, order: created_at.desc, limit: 1),
    alerts (*),
    proposals (*)
  `)
  .eq('assigned_to', userId)
  .order('updated_at', { ascending: false });
```

### 7C. Auth Flow
- Login page (email + password)
- On login: fetch user profile → store in AuthContext → redirect to dashboard
- Protected routes: if not logged in → redirect to login
- Role stored in context for conditional UI rendering

### 7D. Type Generation
- Run `supabase gen types typescript` to generate `database.types.ts`
- Use these types throughout the frontend for type safety
- Update `src/types.ts` to re-export or extend generated types as needed

---

## 8. Confidentiality Rule

**Purchase price must NEVER be stored in any user-accessible table.** It does not appear in the schema above. If it needs to be stored for internal calculations in the future, it must be in a separate table with no RLS SELECT policy for any role. This is a hard business rule.

---

## 9. Non-Functional Requirements

### Performance
- Schema must support up to 50,000 cases per tenant efficiently
- All foreign keys indexed
- Full-text search indexes on: case reference, loan reference, party name, party id_number, collateral address, cadastral_ref, plot_registry
- Composite indexes on common query patterns (tenant_id + assigned_to, tenant_id + case_id + created_at)

### Security
- RLS enabled on ALL tables, no exceptions
- Service role key never exposed to frontend
- Anon key used for all frontend operations (RLS handles authorization)
- All user input sanitized (Supabase client handles SQL injection prevention)

### Reliability
- All schema changes via migration files (versioned, repeatable)
- Seed data in a separate file from schema migrations

---

## 10. Deliverables

After this split is complete:
1. Supabase project running and connected to Vercel
2. Complete PostgreSQL schema (all tables from Section 2) with indexes and constraints
3. RLS policies on all tables
4. Database functions (updated_at trigger, audit trigger)
5. Storage buckets configured
6. Seed data loaded (migrated mock data + expanded test data)
7. `src/lib/supabase.ts` — client initialization
8. `src/context/AuthContext.tsx` — auth state management
9. Login page working (email/password)
10. `CrmContext` refactored to fetch from Supabase instead of mock data
11. Generated TypeScript types from schema
12. Basic API functions for search and segmentation
13. The existing prototype screens still work, but now with real persisted data

---

## Out of Scope

- User management UI (creating users through the app) → Split 07
- Team Leader priority assignment → Split 03
- Proposal committee workflow → Split 04
- Automated nudges → Split 05
- Performance metrics → Split 06
- Legal Manager views → Split 08
- CSV import → Split 11
- Document management → Split 12
