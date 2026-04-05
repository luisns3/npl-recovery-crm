# Project Manifest — NPL Recovery CRM

**Project:** NPL Recovery CRM
**Date:** 2026-04-04
**Status:** Approved
**Interview:** Questions 1-18 captured in `deep_project_interview.md`

---

## Vision

A multi-tenant SaaS platform for debt recovery managers handling non-performing loans (NPLs) in the Spanish market. Core UX principle: **speed and simplicity** — minimize clicks, reduce cognitive load, make the next call always obvious. Users are unsophisticated; every screen must be intuitive.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS 4 |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| Custom API | Vercel Serverless Functions |
| Hosting | Vercel |
| Future Mobile | React Native or PWA |

---

## Split Structure

```SPLIT_MANIFEST
01-backend-foundation
02-lam-ram-case-management
03-team-leader-dashboards
04-proposal-pipeline
05-automated-nudges
06-performance-kpis
07-portfolio-manager
08-legal-portal
09-reporting
10-support-teams
11-csv-import
12-document-management
13-dialer-integration
14-mobile-app
```

---

## Split Details

### 01-backend-foundation
**Priority:** Pre-requisite (before all phases)
**Dependencies:** None
**Description:** Database schema, Supabase setup, authentication, role-based access, API layer, and migration from mock data to real persistence. This is the foundation everything else builds on.

**Scope:**
- PostgreSQL schema design:
  - Core: Cases (Groups), Loans, Collaterals, LoanCollateral (M2M with lien rank)
  - People: Parties (debtor, guarantor, occupant, tenant, heir), Contacts (phone, email, postal — linked to participant/tenant/lawyer, blockable with reason)
  - Activity: Interactions (with call outcomes: Not Answering, CUP, CUN, Wrong Number, Voicemail, Callback Requested, Refused to Talk, Third Party Answered), Alerts
  - Financial: Valuations (multiple per collateral: appraisal, third-party, case manager), Liens (junior/senior, editable)
  - Proposals: linked to loans + collaterals, with probability stages (Pre-pipe, Focus, Deals, Firmada), bank account movement linkage for closure
  - Affordability: per-participant form (marital status, employment, minors, disabled, income, deceased, heirs, occupancy)
  - Segmentation: 26-bucket classification tree (configurable thresholds for LTV, pre-pipe age)
  - Org: Users, Teams, Portfolios, Roles, Perimeter assignments
- Supabase project setup on Vercel
- Authentication flow (login/logout, session management)
- Role model: Admin, PM, TL, LAM (phone + field subtypes), RAM, LM, External Lawyer, Closing, MO, Compliance
- Row-level security policies for multi-tenancy readiness (tenant_id on all tables)
- Basic API layer (CRUD for core entities) via Supabase client + Vercel serverless functions for business logic
- Seed data migration (convert existing mock data to DB seed)
- User-to-perimeter assignment (which cases belong to which user)
- Global search index: Loan ID, Participant Name, Participant ID, Group ID, Collateral Address, Cadastral Reference, Collateral ID, Plot Registry
- Purchase price is **strictly confidential** — not stored in any user-accessible table/view

**Key decisions:**
- Single-tenant deployment first, but schema includes tenant_id from day one
- Admin role = PM for now
- Strict single-role per user enforced at DB level
- Everyone can view all cases in portfolio (read access is broad; write is perimeter-restricted)
- Groups link related cases (same debtor across multiple loans)

---

### 02-lam-ram-case-management
**Priority:** Phase 1
**Dependencies:** 01-backend-foundation
**Description:** The core daily workflow for Loan and REO Asset Managers. This is what case managers live in all day.

**Scope:**
- **Daily login experience:**
  - First screen: personal to-do list + call queue sorted by priority
  - Pop-up: yesterday's activity vs. last 7 days avg vs. team avg + cases with legal phase changes in last 7 days with no CUP/CUN registered
  - Global search bar (Loan ID, Participant Name/ID, Group ID, Collateral Address/Cadastral/ID, Plot Registry)
- **Dashboard:** Kanban board (cases by stage) + prioritized call queue
- **Case Detail view:**
  - Loan-collateral matrix (loans × collaterals with lien rank)
  - Financial data per loan: UPB, accrued interest, total debt, LTV ratio
  - Junior/senior liens (editable by case manager)
  - Collateral data: property type, address, cadastral reference, surface area, occupancy status (debtor-occupied, legal tenant, illegal occupant, vacant, unknown)
  - Multiple valuations per collateral: appraisal (from portfolio seller), third-party, case manager's own estimate — all visible
  - Parties: debtors, guarantors, occupants, tenants, heirs
  - Contacts: phones, emails, postal addresses — each linked to a participant/tenant/lawyer. Blocking with reason, unblocking supported
  - Interactions history (full audit trail, readable by any future case manager)
  - Documents & services section (back office requests: registry excerpts, debt certificates, etc.)
  - Proposals tab (active, signed, cancelled — read-only list, full pipeline in Split 04)
- **Affordability form:**
  - One per participant (debtor, guarantor, occupant)
  - Fields: marital status, employment, minors in collateral, disabled persons, avg monthly household income, deceased participants, heirs, occupancy status
  - Evolves over time (updated across multiple calls)
  - Printable as part of proposal one-pager for committee and audits
- **Call workflow:**
  - Mandatory call logging: structured outcome (Not Answering, CUP, CUN, Wrong Number, Voicemail, Callback Requested, Refused to Talk, Third Party Answered) + free-text comment
  - Next action screen: create alerts, change strategy, add/block/update contacts, create proposals
- **Strategy selector:** DPO, PDV/PoA, DPO encubierta (reported as DPO), Loan Sale, DIL, SAU, CDR, Repossession
- **Spain map:** Collateral locations, color-coded by legal status / proposal existence. Supports field visit planning and investor-facing regional queries
- **Legal status overview:** Recent milestone changes with configurable window (7/14/30 days, set by PM)
- **Portfolio segmentation:** 26-bucket decision tree (see interview Q13 for full tree). Viewable as case counts. Segmentation is editable. Configurable thresholds (LTV bands, pre-pipe age 90 days, etc.)
- **Contact inactivity tracking:** Cases not contacted in 1 week / 1 month / 2-3 months / 4-5 months / 6+ months / never (by current case manager)
- **Priority queue logic:** Existing algorithm wired to real data
- **RAM-specific:** Perimeter ageing view (bar chart by month, start = auction closed, reset on adjudication award). Also applies to PDV cases.
- **PDV collaboration:** RAM handles broker/sale, LAM handles debtor cooperation. PDV sales tracked separately.
- **Collateral photos:** Upload capability. Mandatory for PDV proposals, optional otherwise.
- **Field agent support:** Visit logging associated to a loan (geolocation tracking in future mobile app)
- **Group view:** See all related cases (same debtor across loans) together
- **Visibility:** All users can see all cases in portfolio (not restricted to own perimeter for reading)

**UX principles:**
- Maximum 2-3 clicks from dashboard to any action
- Call → Log → Next Action → Next Case flow enforced
- Visual simplicity — no data overload, progressive disclosure
- Users are unsophisticated — every screen must be self-explanatory

---

### 03-team-leader-dashboards
**Priority:** Phase 2
**Dependencies:** 02-lam-ram-case-management
**Description:** Team Leader view — everything a case manager sees, but aggregated across the whole team, plus management tools.

**Scope:**
- Team-wide Kanban and call queue (filterable by agent)
- Aggregated perimeter view (all team cases, filterable by portfolio)
- Individual agent drill-down (see any agent's full view, including their agenda/to-do list)
- **Priority setting & calling plans:**
  - Manual: assign specific cases to an agent ("call these 20 cases today")
  - Rule-based: "call all cases with no contact in 14+ days"
  - Based on portfolio segmentation (26-bucket tree) at TL discretion
- Agent agenda/to-do list visibility (TL sees what each agent has planned)
- Team activity summary (calls made, proposals submitted, cases touched, contact inactivity breakdown)
- Contact inactivity view per agent: cases not contacted in 1 week / 1 month / 2-3 months / 4-5 months / 6+ months / never
- Filter by portfolio across all views
- Separate TL types enforced: Commercial TL (LAM/RAM agents) vs Legal TL (LM agents) — no mixing

**Key constraint:** Legal TLs are a separate silo. A Legal TL only sees LMs, never LAMs/RAMs.

---

### 04-proposal-pipeline
**Priority:** Phase 3
**Dependencies:** 02-lam-ram-case-management, 03-team-leader-dashboards
**Description:** Full proposal lifecycle from creation to committee review to signing and closure.

**Scope:**
- **Proposal creation:**
  - Linked to specific loans AND collaterals affected
  - Fields: proposal amount, payment terms (lump sum / installments), expected closing date, probability stage
  - Printable one-pager including affordability data for committee review and audits
  - Collateral photos mandatory for PDV proposals
- **Probability pipeline stages:**
  - Pre-pipe → Focus (approved in committee) → Deals (80%+ probability) → Firmada (signed & cashed)
- **Committee workflow:**
  1. Case manager uploads committee result (approval, counteroffer, rejection)
  2. Team Leader verifies info matches meeting notes before advancing proposal
  3. TL advances all weekly proposals, then triggers summary email with Excel export of all proposal history
- **Counteroffers:** Case manager renegotiates with debtor, resubmits. Can bounce multiple times.
- **Post-approval sequence:**
  1. MO contacts counterpart, requests KYC documentation
  2. Compliance approves source of funds
  3. Closing prepares signing documents (~2 weeks before), arranges notary
- **Closure:** Case manager links signed proposal to bank account movement → debt cancelled → legal claim withdrawn (except Loan Sale)
- Proposal history (full audit trail, cancelled proposals greyed out)
- Weekly committee target tracking (3 proposals/week per case manager)
- Weekly signing target tracking (1 signing/week per case manager)
- "DPO encubierta" classification: Loan Sale deals to debtor-related parties reported as DPOs in analytics
- Proposal-to-strategy consistency check (flag when active proposal contradicts case strategy)

---

### 05-automated-nudges
**Priority:** Phase 4
**Dependencies:** 02-lam-ram-case-management, 03-team-leader-dashboards, 04-proposal-pipeline
**Description:** System-driven behavioral nudges to improve case manager habits and flag problems. The system is both the cop and the informant.

**Scope:**
- **Case manager nudges:**
  - Strategy conflict detection: alert when case strategy contradicts active proposal type
  - Stale case warnings: cases not contacted in X days (configurable threshold)
  - Strategy update reminders: prompt case managers to review/confirm strategy periodically
  - Month-end clustering prevention: warn when signings disproportionately scheduled for last week of month / last month of quarter
  - Call activity nudges: "You have X cases not contacted this week"
  - Legal phase change alerts: "X cases changed legal milestone with no CUP/CUN registered"
- **TL alert feed (repeat-offender dashboard):**
  - Which agents consistently forget strategy updates
  - Which agents cluster signings at month/quarter end
  - Which agents have persistent strategy-proposal conflicts
  - Agents with lowest call-to-proposal conversion
  - Recurrent patterns surfaced with data, not just one-off alerts
- Configurable nudge rules (PM/TL can adjust thresholds)
- Notification delivery: in-app alerts, potentially email

---

### 06-performance-kpis
**Priority:** Phase 5
**Dependencies:** 04-proposal-pipeline, 05-automated-nudges
**Description:** Targets, recovery tracking, and performance analytics for all levels.

**Scope:**
- Monthly recovery targets per case manager (amount-based, tied to bonus)
- Target vs. actual tracking with visual progress indicators
- Weekly proposal count tracking (target: 3/week reviewed in committee)
- Weekly signing count tracking (target: 1/week)
- Activity metrics: calls made, cases touched, time on phone
- Signing distribution analysis (flag month-end/quarter-end clustering)
- Team-level aggregation for TLs
- Portfolio-level aggregation for PMs
- "DPO encubierta" correctly attributed as DPO in all performance views
- Historical performance trends (month-over-month, quarter-over-quarter)

---

### 07-portfolio-manager
**Priority:** Phase 6
**Dependencies:** 03-team-leader-dashboards, 06-performance-kpis
**Description:** Portfolio Director view — full oversight, strategic tools, and case distribution management.

**Scope:**
- Cross-portfolio overview (all teams, all portfolios)
- Activity data analysis across all users (who's calling, who's not, who's performing)
- Case reshuffling: reassign cases between case managers based on stock and recovery ability
- Filter everything by portfolio
- Legal milestone change window configuration (7/14/30 days — PM sets the criteria)
- Team comparison dashboards
- Business Plan target definition (modeling-based target setting — simplified first version, full modeling later)
- Admin functions: create/deactivate user accounts, assign roles, assign to teams

---

### 08-legal-portal
**Priority:** Phase 7
**Dependencies:** 01-backend-foundation, 03-team-leader-dashboards
**Description:** Legal Manager workspace and External Lawyer portal.

**Scope:**
- **LM view:**
  - Legal cases dashboard with procedure types (Foreclosures, Insolvency, etc.)
  - Non-judicialized perimeter view (cases not yet in legal proceedings)
  - Milestone tracking per procedure type (milestones TBD — to be defined with user)
  - Stale case detection: cases with no court updates for too long
  - External lawyer supervision: see uploads, summaries, response times
  - Guidelines management: instructions to lawyers on what to present to courts
- **External Lawyer portal (limited login):**
  - Upload court-issued documents (PDF, images)
  - Provide brief text summary per upload
  - See only their assigned cases
  - No access to financial data, proposals, or internal notes
- **Legal TL view:** Aggregated LM view across legal team (same pattern as Split 03)

---

### 09-reporting
**Priority:** Phase 8
**Dependencies:** 06-performance-kpis, 04-proposal-pipeline
**Description:** Management reporting, email summaries, and data exports.

**Scope:**
- Committee summary email with Excel attachment (all weekly proposal history)
- Monthly performance reports per case manager, team, portfolio
- Recovery amount reports for clients/investors
- Export to Excel/CSV for any table/view
- Scheduled email reports (weekly committee summary, monthly performance)
- Signing pipeline report (upcoming signings, status of deals in closing)

---

### 10-support-teams
**Priority:** Later
**Dependencies:** 04-proposal-pipeline
**Description:** Dedicated views for Closing, Middle Office, and Compliance teams.

**Scope:**
- **Closing:** Queue of approved proposals awaiting signing coordination. Status tracking per deal.
- **Middle Office:** Operational processing queue. Document checklist per deal.
- **Compliance/KYC:** Regulatory checks queue. Approval/rejection workflow before signing can proceed.
- Workload distribution view (prevent month-end overload)
- Integration with proposal pipeline (deal can't advance to signed until all support team steps complete)

---

### 11-csv-import
**Priority:** Later
**Dependencies:** 01-backend-foundation
**Description:** Portfolio data ingestion via CSV/Excel uploads.

**Scope:**
- Upload interface for CSV/Excel files
- Column mapping wizard (map CSV columns to DB fields)
- Validation and error reporting before import
- Support for: Cases, Loans, Collaterals, Parties, Contacts
- Incremental updates (add new records, update existing)
- Import history/audit trail
- Template downloads (expected format per entity)

---

### 12-document-management
**Priority:** Much later
**Dependencies:** 08-legal-portal
**Description:** Integration with external document management system.

**Scope:**
- DMS vendor selection and integration (vendor TBD)
- Document linking to cases, proposals, legal proceedings
- Document upload/download from within CRM
- Version control and audit trail
- Back office document request tracking (registry excerpts, debt certificates)

---

### 13-dialer-integration
**Priority:** Much later
**Dependencies:** 02-lam-ram-case-management
**Description:** Click-to-call dialer integration for case managers.

**Scope:**
- Dialer vendor selection and integration
- Click-to-call from case detail and call queue
- Call duration and outcome auto-logging
- Call recording storage (if legally permitted)
- Integration with call logging workflow

---

### 14-mobile-app
**Priority:** Last
**Dependencies:** All previous splits stable
**Description:** Mobile application for monitoring and light case management.

**Scope:**
- React Native or PWA (decision TBD based on requirements at that time)
- Read-heavy: dashboards, KPIs, case overview, notifications
- Light actions: log calls, update strategy, review proposals
- Push notifications for alerts and nudges
- Offline support TBD

---

## Dependency Graph

```
01-backend-foundation
├── 02-lam-ram-case-management
│   ├── 03-team-leader-dashboards
│   │   ├── 04-proposal-pipeline
│   │   │   ├── 05-automated-nudges
│   │   │   ├── 06-performance-kpis
│   │   │   │   ├── 07-portfolio-manager
│   │   │   │   └── 09-reporting
│   │   │   └── 10-support-teams
│   │   └── 07-portfolio-manager
│   └── 13-dialer-integration
├── 08-legal-portal
│   └── 12-document-management
├── 11-csv-import
└── (14-mobile-app depends on overall stability)
```

## Execution Order

**Strictly sequential (each depends on the previous):**
01 → 02 → 03 → 04 → 05 → 06 → 07

**Can be parallelized after 01:**
- 08 (Legal Portal) can start after 01 + 03
- 11 (CSV Import) can start after 01

**Late-stage (after core is stable):**
09 → 10 → 12 → 13 → 14

---

## Notes

- **Multi-tenancy:** tenant_id baked into schema from Split 01, but first deployment is single-tenant
- **Language:** UI in Spanish for case managers, English for system/admin labels TBD
- **Legal procedure milestones:** To be defined with stakeholder before Split 08
- **Business Plan modeling:** Simplified in Split 07, full modeling deferred
- **"DPO encubierta" rule:** Must be enforced consistently across proposals, KPIs, and reporting
- **REO marketing/listing workflow:** Confirmed as in-scope, details deferred to later discussion
- **Broker (API) portal:** Confirmed as future feature, brokers will submit buyer offers through the system
- **Field agent geolocation:** Full tracking deferred to mobile app (Split 14), basic visit logging in Split 02
- **Purchase price confidentiality:** Must never appear in any view, export, or report — not even for PM
- **Segmentation editability:** Standard 26-bucket tree is the default; PM/TL can adjust thresholds and potentially customize
