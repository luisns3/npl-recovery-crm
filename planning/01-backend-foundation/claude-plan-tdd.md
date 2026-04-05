# TDD Plan: 01 — Backend Foundation

**Mirrors:** claude-plan.md sections
**Testing approach:** Database tests via Supabase SQL assertions, frontend integration tests via Vitest + React Testing Library

---

## Section 1: Supabase Project Setup — Tests

**No automated tests.** Verified manually:
- `.env.local` exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- `src/lib/supabase.ts` exports a client that can connect
- `npm run build` succeeds with Supabase dependency installed

---

## Section 2: Database Schema — Tests

Run as SQL assertions in Supabase SQL Editor after each migration.

### Test 2.1: Enums and Organizational Tables
```sql
-- Verify enums exist
SELECT enum_range(NULL::user_role);        -- should return all 11 roles
SELECT enum_range(NULL::strategy_type);    -- should return all 8 strategies
SELECT enum_range(NULL::call_result_type); -- should return all 8 outcomes
SELECT enum_range(NULL::legal_status_type); -- should return judicial, non_judicial

-- Verify tables exist
SELECT count(*) FROM tenants;       -- 0 (empty)
SELECT count(*) FROM teams;         -- 0
SELECT count(*) FROM portfolios;    -- 0
SELECT count(*) FROM users;         -- 0
```

### Test 2.2: Core Business Tables
```sql
-- Verify FK constraints work
INSERT INTO cases (id, tenant_id, portfolio_id, reference, stage, strategy, assigned_to, legal_status)
VALUES (gen_random_uuid(), 'non-existent-uuid', ...);
-- Should FAIL with FK violation (no such tenant)

-- Verify unique constraint on (tenant_id, reference)
-- Insert two cases with same tenant + reference → should fail

-- Verify contact CHECK constraint
INSERT INTO contacts (..., party_id, lawyer_name) VALUES (..., NULL, NULL);
-- Should FAIL (at least one must be non-null)
```

### Test 2.3-2.6: Remaining Tables
```sql
-- Verify affordability unique constraint
-- Insert two affordability rows for same (case_id, party_id) → should fail

-- Verify segmentation_config unique on tenant_id
-- Insert two config rows for same tenant → should fail

-- Verify junction tables have tenant_id
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'proposal_loans' AND column_name = 'tenant_id';
-- Should return 1 row
```

### Test 2.7: Triggers
```sql
-- Verify updated_at trigger
INSERT INTO cases (...) VALUES (...);
SELECT updated_at FROM cases WHERE id = '...';  -- Note the time
UPDATE cases SET strategy = 'PDV' WHERE id = '...';
SELECT updated_at FROM cases WHERE id = '...';  -- Should be newer

-- Verify audit_log trigger
SELECT count(*) FROM audit_log WHERE table_name = 'cases' AND record_id = '...';
-- Should be 2 (1 insert + 1 update)

-- Verify audit works with NULL auth.uid() (seed scenario)
-- Run an INSERT without auth context → audit_log.changed_by should be NULL or zero UUID
```

### Test 2.8: Search Function
```sql
-- After seed data is loaded:
SELECT * FROM global_search('Martinez', (SELECT id FROM tenants LIMIT 1));
-- Should return at least 1 result (party name match)

SELECT * FROM global_search('EXP-', (SELECT id FROM tenants LIMIT 1));
-- Should return case reference matches

SELECT * FROM global_search('nonexistent_gibberish_xyz', (SELECT id FROM tenants LIMIT 1));
-- Should return 0 rows
```

---

## Section 3: Row-Level Security — Tests

These tests require creating multiple test users with different roles.

### Test 3.1: Tenant Isolation
```sql
-- As user in Tenant A: SELECT from cases → should see only Tenant A cases
-- As user in Tenant B: SELECT from cases → should see only Tenant B cases
-- (Requires 2 tenants in seed data, or manual test setup)
```

For PoC with single tenant, this is verified structurally (policy exists) rather than functionally.

### Test 3.2: TL Team Scoping
```sql
-- As Commercial TL: UPDATE a case assigned to their LAM → should succeed
-- As Commercial TL: UPDATE a case assigned to Legal team's LM → should FAIL
-- As PM: UPDATE any case → should succeed
-- As LAM: UPDATE their own case → should succeed
-- As LAM: UPDATE another LAM's case → should FAIL
```

### Test 3.3: Case Manager Write Restrictions
```sql
-- As LAM: INSERT interaction on own case → should succeed
-- As LAM: INSERT interaction on another agent's case → should FAIL
-- As LAM: INSERT into users table → should FAIL
```

---

## Section 4: Storage — Tests

**Manual verification:**
- Upload a test image to `collateral-photos` bucket as authenticated user → should succeed
- Download the image → should succeed
- Try to upload without authentication → should fail
- Verify `documents` bucket exists

---

## Section 5: Authentication — Tests

### Test 5.1: Vitest — AuthContext
```typescript
// File: src/context/__tests__/AuthContext.test.tsx

describe('AuthContext', () => {
  it('provides null user when not logged in', () => {
    // Render AuthProvider, check user is null, loading resolves to false
  });

  it('provides user profile after login', () => {
    // Mock supabase.auth.getSession to return a session
    // Mock supabase.from('users').select() to return a user profile
    // Verify useAuth() returns the correct user with role, team, tenant
  });

  it('signOut clears user and session', () => {
    // Start with a mocked session
    // Call signOut
    // Verify user becomes null
  });
});
```

### Test 5.2: Vitest — LoginPage
```typescript
// File: src/components/Auth/__tests__/LoginPage.test.tsx

describe('LoginPage', () => {
  it('renders email and password inputs', () => {
    // Render LoginPage, verify inputs exist
  });

  it('shows error on failed login', () => {
    // Mock signIn to reject
    // Fill form, submit
    // Verify error message appears
  });

  it('calls signIn with correct credentials', () => {
    // Fill email and password, submit
    // Verify signIn was called with correct values
  });
});
```

### Test 5.3: Vitest — Protected Routes
```typescript
// File: src/__tests__/App.test.tsx

describe('App routing', () => {
  it('shows LoginPage when not authenticated', () => {
    // Mock no session
    // Render App
    // Verify LoginPage is shown
  });

  it('shows Dashboard when authenticated', () => {
    // Mock valid session + user profile
    // Render App
    // Verify Dashboard/Layout is shown
  });
});
```

---

## Section 6: CrmContext Refactor — Tests

### Test 6.1: Vitest — Data Fetching
```typescript
// File: src/lib/__tests__/queries.test.ts

describe('queries', () => {
  it('fetchCasesForUser returns cases with nested data', () => {
    // Mock supabase.from('cases').select() with nested joins
    // Verify returned shape matches Case interface
    // Verify parties, loans, collaterals, interactions, alerts, proposals are included
  });

  it('logInteraction inserts and returns the new interaction', () => {
    // Mock supabase.from('interactions').insert().select()
    // Verify correct fields are sent
  });

  it('blockContact updates is_blocked and block_reason', () => {
    // Mock supabase.from('contacts').update()
    // Verify is_blocked = true, block_reason set, blocked_by set
  });

  it('createProposal inserts into proposals + junction tables', () => {
    // Mock insert into proposals, proposal_loans, proposal_collaterals
    // Verify all three tables are written
  });
});
```

### Test 6.2: Vitest — CrmContext Actions
```typescript
// File: src/context/__tests__/CrmContext.test.tsx

describe('CrmContext (Supabase-backed)', () => {
  it('loads cases on mount', () => {
    // Mock fetchCasesForUser
    // Render CrmProvider
    // Verify cases are populated after loading
  });

  it('logCall creates interaction and refreshes case', () => {
    // Mock logInteraction + fetchCaseById
    // Call logCall action
    // Verify interaction was sent to DB
    // Verify case data was refreshed
  });

  it('changeStrategy updates DB and local state', () => {
    // Mock updateCaseStrategy
    // Call changeStrategy action
    // Verify Supabase update was called with correct params
  });

  it('uses authenticated user ID instead of hardcoded name', () => {
    // Mock auth context with user { id: 'xxx', full_name: 'Carlos Ruiz' }
    // Call logCall
    // Verify created_by is user.id, not 'Carlos Ruiz' string
  });
});
```

---

## Section 7: Types — Tests

```bash
# Type checking is the test
npx tsc --noEmit
# Should pass with zero errors after all type updates
```

---

## Section 8: Seed Data — Tests

```sql
-- After running seed.sql:
SELECT count(*) FROM tenants;           -- 1
SELECT count(*) FROM portfolios;        -- 1
SELECT count(*) FROM teams;             -- 1
SELECT count(*) FROM users;             -- 4
SELECT count(*) FROM groups;            -- 2
SELECT count(*) FROM cases;             -- 6
SELECT count(*) FROM parties;           -- >= 9 (from mock data)
SELECT count(*) FROM contacts;          -- >= 12 (from mock data, some blocked)
SELECT count(*) FROM loans;             -- >= 8
SELECT count(*) FROM collaterals;       -- >= 6
SELECT count(*) FROM interactions;      -- >= 6
SELECT count(*) FROM proposals;         -- >= 4
SELECT count(*) FROM valuations;        -- >= 6 (1 appraisal per collateral)
SELECT count(*) FROM segmentation_config; -- 1

-- Verify relationships
SELECT c.reference, u.full_name 
FROM cases c JOIN users u ON c.assigned_to = u.id;
-- All 6 cases should have assigned users

-- Verify blocked contacts exist
SELECT count(*) FROM contacts WHERE is_blocked = true;
-- Should be >= 1
```

---

## Section 10: Smoke Test — Automated

### Vitest — End-to-End Flow
```typescript
// File: src/__tests__/smoke.test.tsx

describe('Smoke test - full flow', () => {
  it('renders dashboard with cases from Supabase', () => {
    // Mock Supabase to return seed-like data
    // Render App with authenticated user
    // Verify Kanban board shows cases
    // Verify call queue shows sorted cases
  });

  it('can complete call → log → next action flow', () => {
    // Open a case → click CALL NOW → fill call log → submit
    // Verify interaction was saved (mock check)
    // Verify next action screen appears
  });
});
```

---

## Test Infrastructure Setup

### Install Testing Dependencies
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Vitest Config
Add to `vite.config.ts`:
```typescript
/// <reference types="vitest/config" />
export default defineConfig({
  // ... existing config
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

### Test Setup File
Create `src/test-setup.ts`:
```typescript
import '@testing-library/jest-dom';
```

### Package.json Script
```json
"test": "vitest",
"test:run": "vitest run"
```
