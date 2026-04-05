# Spec: 02 — LAM/RAM Case Management

**Split:** 02-lam-ram-case-management
**Priority:** Phase 1
**Depends on:** 01-backend-foundation (Supabase DB, auth, API layer)
**Status:** Draft

---

## Overview

This is the core daily workspace for Loan Asset Managers (LAM) and REO Asset Managers (RAM). Everything in this split serves one goal: **maximize the time case managers spend on the phone persuading debtors, and minimize everything else.**

Users are unsophisticated. Every screen must be self-explanatory. Maximum 2-3 clicks from dashboard to any action.

---

## What Already Exists (Prototype)

The current codebase has a working prototype with:
- Kanban board with 5 stages (pre_contact, contacted, negotiating, proposal, resolved)
- Call queue sorted by priority (days since contact → alerts → proposal probability → auction proximity → strategy)
- Case detail view: phone/call button, parties, last interaction, alerts, debt summary, collateral info, legal status, proposals
- Call log modal: 5 result codes + free-text comment
- Next action screen: create alert, change strategy, add contact, invalidate phone, create proposal
- Proposal list (read-only)
- All data is in-memory mock (6 Spanish NPL cases)
- State management via single React Context (`CrmContext`)
- Types defined in `src/types.ts`

**This split replaces the mock data layer with Supabase and significantly expands the data model, screens, and workflows.**

---

## Screens

### Screen 1: Dashboard (Home)

The first screen a LAM/RAM sees after login.

#### 1A. Login Pop-up (Activity Summary)

Displayed once on first load of the day. Dismissable.

| Element | Description |
|---|---|
| Yesterday's calls | Count of calls made yesterday |
| 7-day avg | Average daily calls over last 7 days |
| Team avg | Average daily calls across the agent's team |
| Comparison indicator | Green/red arrow showing trend vs. 7-day avg |
| Legal phase alerts | "X cases changed legal phase in last 7 days with no CUP or CUN registered" — clickable, opens filtered list |

#### 1B. Global Search Bar

Always visible in the top navigation. Searches across:

| Field | Example |
|---|---|
| Loan ID | `L-2024-00123` |
| Participant Name | `García López` |
| Participant ID (DNI/NIF/CIF) | `12345678A` |
| Group ID | `GRP-001` |
| Collateral Address | `Calle Mayor 15, Madrid` |
| Cadastral Reference | `1234567AB1234C0001` |
| Collateral ID | `COL-001` |
| Plot Registry (Registro de la Propiedad) | `Finca 1234, Tomo 567` |

**Behavior:**
- Typeahead search (debounced, 300ms)
- Results grouped by type (Cases, Participants, Collaterals)
- Clicking a result opens the Case Detail for that case
- Everyone can see all cases in portfolio (not restricted to own perimeter)

#### 1C. Call Queue

Auto-sorted list of cases the agent should call next. Same priority algorithm as current prototype, wired to real data:

1. Longest time since last interaction (descending)
2. Active alert count (descending)
3. Best proposal probability rank (Deals > Focus > Pre-Pipe)
4. Days to auction (ascending — closest first)
5. Strategy priority (DPO > PDV > Loan Sale > Auction > Repossession)

**Each queue item shows:**
- Case reference + Group ID
- Primary debtor name
- Strategy badge (color-coded)
- Days since last contact
- Active alert count (if > 0)
- Best proposal stage badge (if any)
- Auction date (if within 90 days)

**Actions:**
- Click row → opens Case Detail
- "Start Calls" button → enters sequential call mode (case detail → call log → next action → next case in queue)

#### 1D. Kanban Board

Cases displayed as cards in columns by stage.

**Stages** (to be refined — current prototype stages may need updating to match real business stages):
- Pre-Contact
- Contacted
- Negotiating
- Proposal
- Resolved

**Each card shows:**
- Case reference
- Primary debtor name
- Strategy badge
- Days since last contact
- Alert indicator (if active alerts)

#### 1E. To-Do List / Alerts Panel

Side panel or tab showing:
- Alerts due today (sorted by time)
- Alerts overdue (highlighted in red)
- Upcoming alerts (next 7 days)
- TL-assigned priorities ("Your TL says: call these cases")

Each alert item shows: case reference, alert type, description, due date. Clicking opens the case.

#### 1F. Contact Inactivity Summary

Small widget or tab showing the agent's own cases by contact recency:
- Not contacted in 1 week
- Not contacted in 1 month
- Not contacted in 2-3 months
- Not contacted in 4-5 months
- Not contacted in 6+ months
- Never contacted (by current case manager)

Each row is a clickable count that opens a filtered case list.

---

### Screen 2: Case Detail

The main workspace for a single case. Everything the case manager needs to know and do for this case.

#### 2A. Top Bar

| Element | Description |
|---|---|
| Back button | Returns to dashboard or previous view |
| Case reference | e.g., `EXP-2024-00456` |
| Group ID | e.g., `GRP-001` — clickable to see all cases in group |
| Primary debtor name | |
| Strategy badge | Color-coded, current strategy |
| Legal status badge | `Judicial` / `Non-Judicial` |
| Assigned to | Agent name |

#### 2B. Phone / Call Section

Prominent section at the top. This is the most important action on the page.

| Element | Description |
|---|---|
| Primary phone number | Large, bold text |
| Phone owner | Who this number belongs to (e.g., "Debtor - Juan García") |
| CALL NOW button | Large, primary color. Triggers call log modal after the call. Disabled if no valid phone. |
| Other phones | List of all phones — each showing: number, owner (participant/tenant/lawyer), valid/blocked status |
| Blocked phones | Greyed out with strikethrough, showing block reason. Unblock button available. |
| Email addresses | Listed below phones |
| Postal addresses | Listed below emails |

#### 2C. Parties & Affordability

**Parties list:**
Each party (debtor, guarantor, co-borrower, legal representative, tenant, heir) shown as a card:
- Name
- Role
- ID (DNI/NIF)
- Affordability status: "Complete" / "Incomplete" / "Not started" badge
- Click to expand → shows affordability form

**Affordability Form (per participant):**

| Field | Type | Options/Notes |
|---|---|---|
| Marital status | Dropdown | Single, Married, Divorced, Widowed, Unknown |
| Employment status | Dropdown | Employed, Unemployed, Self-employed, Retired, Unknown |
| Minors in collateral | Yes/No/Unknown | |
| Disabled persons in collateral | Yes/No/Unknown | |
| Avg monthly household income | Number (EUR) | Free text, optional |
| Deceased | Yes/No | If Yes, blocks direct contact attempts |
| Heirs identified | Yes/No/Pending | If deceased = Yes |
| Heir names/contact | Text | Free text if heirs identified |
| Occupancy status | Dropdown | Debtor-occupied, Legal tenant, Illegal occupant, Vacant, Unknown |
| Notes | Free text | Any additional affordability context |
| Last updated | Auto | Date + who updated it |

**Key behaviors:**
- Evolves over time — updated across multiple calls
- All fields optional (can be filled incrementally)
- History preserved (who changed what, when)
- Printable as part of proposal one-pager

#### 2D. Interactions History

Chronological list (most recent first) of all interactions with this case.

| Column | Description |
|---|---|
| Date | Interaction date |
| Agent | Who made the call/note |
| Type | Call / Note / Visit |
| Outcome | CUP, CUN, Not Answering, etc. (badge, color-coded) |
| Comment | Free text summary |

**Behaviors:**
- Infinite scroll or pagination
- All historical interactions visible (including from previous agents)
- Filter by type, by outcome, by date range

#### 2E. Loan-Collateral Matrix

A table showing the relationship between loans and collaterals.

**Loan rows show:**

| Field | Description |
|---|---|
| Loan ID | Clickable to expand details |
| UPB | Unpaid Principal Balance |
| Accrued Interest | |
| Total Debt | UPB + Interest |
| LTV Ratio | Auto-calculated from debt vs collateral valuation |
| Strategy | Per-loan strategy badge |
| Junior liens | Editable — case manager can add/edit lien info |
| Senior liens | Editable |

**Collateral columns show:**

| Field | Description |
|---|---|
| Collateral ID | |
| Property type | Residential, Commercial, Land, Industrial, Parking, Storage, etc. |
| Address | Full address |
| Cadastral reference | |
| Surface area (sqm) | |
| Lien rank | From LoanCollateral junction (1st, 2nd, etc.) |
| Occupancy status | From affordability or direct input |

**Valuations sub-section per collateral:**

| Valuation type | Source | Amount | Date |
|---|---|---|---|
| Appraisal | Portfolio seller (onboarding) | €XXX,XXX | YYYY-MM-DD |
| Third-party | [Source name] | €XXX,XXX | YYYY-MM-DD |
| Case manager estimate | [Agent name] | €XXX,XXX | YYYY-MM-DD |

All valuations visible simultaneously. Case managers can add their own.

**Matrix intersection cells:** Show lien rank for each loan-collateral pair.

#### 2F. Documents & Services

List of back-office requests and their status.

| Column | Description |
|---|---|
| Document type | Registry excerpt, Debt certificate, etc. |
| Requested date | |
| Status | Pending / Received / N/A |
| Notes | |

Case managers can create new requests from this section.

#### 2G. Legal Status Section

| Element | Description |
|---|---|
| Legal status | Judicial / Non-Judicial badge |
| Procedure type | Foreclosure, Insolvency, etc. (if judicial) |
| Current milestone | Latest legal milestone |
| Milestone change indicator | "Changed X days ago" with highlight if recent (within PM-configured window: 7/14/30 days) |
| Auction date | If set — with countdown |
| Insolvency status | If applicable |

Read-only for LAM/RAM (LMs update this in Phase 7).

#### 2H. Proposals Tab

Read-only list in this phase (full pipeline in Split 04).

| Column | Description |
|---|---|
| Proposal ID | |
| Affected loans | Loan IDs |
| Affected collaterals | Collateral IDs |
| Amount | €XXX,XXX |
| Payment terms | Lump sum / Installments |
| Strategy type | DPO, PDV, etc. |
| Probability | Pre-pipe / Focus / Deals / Firmada — color-coded badge |
| Expected closing | Date |
| Status | Active / Signed / Cancelled (cancelled = greyed out) |
| Created | Date |

#### 2I. Collateral Photos

- Grid of uploaded photos per collateral
- Upload button (drag & drop or file picker)
- Photo mandatory indicator for PDV proposals
- Each photo shows: collateral ID, upload date, uploaded by

---

### Screen 3: Call Log Modal

Appears after clicking "CALL NOW" or triggered from the call workflow. Must be completed before proceeding.

#### Fields:

| Field | Type | Required | Options |
|---|---|---|---|
| Phone called | Pre-filled | Yes | The phone number that was called |
| Call outcome | Radio buttons | Yes | Not Answering, CUP, CUN, Wrong Number, Voicemail, Callback Requested, Refused to Talk, Third Party Answered |
| Participant contacted | Dropdown | If answered | Which participant was reached |
| Comment | Text area | Yes | Free-text summary of the call (minimum 10 characters) |

#### Call Outcome Definitions:

| Code | Label | Description | Color |
|---|---|---|---|
| `not_answering` | Not Answering | Phone rang, nobody picked up | Gray |
| `cup` | CUP (Positive Contact) | Participant shows clear interest in collaborating | Green |
| `cun` | CUN (Negative Contact) | Participant contacted but not collaborative | Red |
| `wrong_number` | Wrong Number | Number does not belong to expected person | Orange |
| `voicemail` | Voicemail | Left voicemail message | Blue |
| `callback` | Callback Requested | Person asked to be called back at specific time | Purple |
| `refused` | Refused to Talk | Person refused to engage | Red |
| `third_party` | Third Party Answered | Someone else answered the phone | Yellow |

#### Behaviors:
- Modal cannot be dismissed without completing (mandatory logging)
- On submit → transitions to Next Action screen
- If outcome is "Wrong Number" → prompt to block the phone number (with pre-filled reason "Wrong number")
- If outcome is "Callback Requested" → prompt to create a follow-up alert with date/time

---

### Screen 4: Next Action Screen

Appears after logging a call. The agent decides what to do next.

#### Available Actions:

| Action | Description |
|---|---|
| Create Alert | Schedule a follow-up (date, type, description) |
| Change Strategy | Update the case strategy from dropdown |
| Add Contact | Add phone/email/postal linked to participant/tenant/lawyer |
| Block Phone | Block a phone with reason. Can also unblock. |
| Update Affordability | Open affordability form for a participant |
| Create Proposal | Open proposal creation form (fields: affected loans, affected collaterals, amount, terms, closing date, probability) |
| Add Note | Log a note without it being a call interaction |
| Next Case | Skip to next case in queue (only in sequential call mode) |
| Back to Case | Return to case detail |
| Back to Dashboard | Return to dashboard |

#### Strategy Change:
Dropdown with all strategies: DPO, PDV/PoA, DPO encubierta, Loan Sale, DIL, SAU, CDR, Repossession

If changing strategy and there's an active proposal with a different strategy type → show warning: "Active proposal is [type] but you're changing strategy to [type]. Consider updating or cancelling the proposal."

#### Proposal Creation Form:

| Field | Type | Required |
|---|---|---|
| Affected loans | Multi-select | Yes |
| Affected collaterals | Multi-select | Yes |
| Proposal amount (€) | Number | Yes |
| Payment terms | Dropdown: Lump sum / Installments | Yes |
| If installments: number of payments | Number | Conditional |
| If installments: frequency | Dropdown: Monthly / Quarterly | Conditional |
| Expected closing date | Date picker | Yes |
| Probability | Dropdown: Pre-pipe / Focus / Deals | Yes (Firmada is set post-signing) |
| Photos uploaded | Indicator | Warning if PDV and no photos |

---

### Screen 5: Spain Map

Interactive map showing all collaterals in the agent's perimeter (and optionally the full portfolio).

#### Map Features:

| Feature | Description |
|---|---|
| Markers | One per collateral, positioned by address geocoding |
| Color coding | By legal status (Judicial = red, Non-Judicial = blue) |
| Secondary color | By proposal existence (has active proposal = green ring, no proposal = default) |
| Click marker | Opens popup with: collateral address, property type, case reference, debtor name, strategy, LTV. "Open Case" link. |
| Cluster | When zoomed out, markers cluster with count |
| Filter | By strategy, by legal status, by proposal status, by occupancy |

#### Use cases:
- Plan field visits by geography (field agents)
- Show investors assets in a specific region
- Visual overview of perimeter distribution

---

### Screen 6: Segmentation View

Visual breakdown of the agent's perimeter by the 26-bucket segmentation tree.

#### Display:
- Tree/table view showing each bucket with case count
- Click a bucket → shows filtered list of cases in that bucket
- Summary bar chart showing distribution across buckets
- Color coding: green (D&F, Realistic Pre-pipe), yellow (Close to Auction), red (High CUN, Not Contacted), gray (Tail, Cancelled)

#### Bucket Assignment:
Cases are automatically classified based on their data (strategy, proposal status, contact history, LTV, auction dates, etc.). The segmentation is computed, not manually assigned.

**Configurable thresholds (stored in settings, editable by PM/TL in later phases):**
- LTV Low/Mid/High boundaries
- Pre-pipe realistic threshold (default: 90 days)
- CUN count threshold (default: 5)
- Contact attempt threshold (default: 5)
- Small ticket threshold (amount TBD)

---

### Screen 7: Group View

When a case manager clicks on a Group ID, shows all related cases (same debtor across multiple loans) in a unified view.

| Element | Description |
|---|---|
| Group header | Group ID, primary debtor name, total debt across all cases |
| Case list | Each case as a summary card: reference, loans, strategy, stage, assigned agent |
| Click case | Opens full Case Detail for that case |

---

## Data Model Changes (from prototype)

### New/Modified Types:

```typescript
// Expanded from prototype
type CallResult = 
  | 'not_answering' 
  | 'cup' 
  | 'cun' 
  | 'wrong_number' 
  | 'voicemail' 
  | 'callback' 
  | 'refused' 
  | 'third_party';

type Strategy = 
  | 'DPO' 
  | 'PDV' 
  | 'DPO_encubierta' 
  | 'Loan Sale' 
  | 'DIL' 
  | 'SAU' 
  | 'CDR' 
  | 'Repossession';

type PartyRole = 
  | 'borrower' 
  | 'guarantor' 
  | 'co_borrower' 
  | 'legal_representative' 
  | 'tenant_legal' 
  | 'tenant_illegal' 
  | 'heir';

type ContactType = 'phone' | 'email' | 'postal';

type OccupancyStatus = 
  | 'debtor_occupied' 
  | 'legal_tenant' 
  | 'illegal_occupant' 
  | 'vacant' 
  | 'unknown';

type Probability = 'Pre-Pipe' | 'Focus' | 'Deals' | 'Firmada' | 'Cancelled';

// New entities
interface Affordability {
  id: string;
  partyId: string;
  caseId: string;
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'unknown';
  employmentStatus: 'employed' | 'unemployed' | 'self_employed' | 'retired' | 'unknown';
  minorsInCollateral: 'yes' | 'no' | 'unknown';
  disabledInCollateral: 'yes' | 'no' | 'unknown';
  avgMonthlyIncome: number | null;
  deceased: boolean;
  heirsIdentified: 'yes' | 'no' | 'pending';
  heirDetails: string | null;
  occupancyStatus: OccupancyStatus;
  notes: string | null;
  updatedBy: string;
  updatedAt: string;
}

interface Valuation {
  id: string;
  collateralId: string;
  type: 'appraisal' | 'third_party' | 'case_manager';
  source: string;          // who provided it
  amount: number;
  date: string;
  createdBy: string;
}

interface Lien {
  id: string;
  loanId: string;
  collateralId: string;
  rank: 'senior' | 'junior';
  holder: string;         // who holds the lien
  amount: number | null;  // estimated lien amount if known
  notes: string | null;
  updatedBy: string;
  updatedAt: string;
}

interface DocumentRequest {
  id: string;
  caseId: string;
  documentType: string;   // registry excerpt, debt certificate, etc.
  status: 'pending' | 'received' | 'not_applicable';
  requestedAt: string;
  requestedBy: string;
  notes: string | null;
}

interface CollateralPhoto {
  id: string;
  collateralId: string;
  url: string;            // Supabase Storage URL
  uploadedBy: string;
  uploadedAt: string;
}

// Expanded Contact
interface Contact {
  id: string;
  partyId: string | null;      // linked to participant
  tenantId: string | null;     // or linked to tenant
  lawyerName: string | null;   // or linked to their lawyer
  caseId: string;
  type: ContactType;
  value: string;
  isBlocked: boolean;          // renamed from isInvalid
  blockReason: string | null;
  blockedBy: string | null;
  blockedAt: string | null;
  addedBy: string;
  addedAt: string;
}

// Expanded Proposal
interface Proposal {
  id: string;
  caseId: string;
  affectedLoanIds: string[];
  affectedCollateralIds: string[];
  strategyType: Strategy;
  amount: number;
  paymentTerms: 'lump_sum' | 'installments';
  installmentCount: number | null;
  installmentFrequency: 'monthly' | 'quarterly' | null;
  probability: Probability;
  expectedClosingDate: string;
  createdAt: string;
  createdBy: string;
  cancelledAt: string | null;
  cancelledBy: string | null;
  bankMovementId: string | null;  // linked after signing
}

// Group (new concept)
interface Group {
  id: string;
  name: string;           // typically primary debtor name
  caseIds: string[];
}

// Case additions
interface Case {
  // ... existing fields ...
  groupId: string | null;
  portfolioId: string;
  auctionDate: string | null;
  auctionClosedDate: string | null;    // when auction happened
  adjudicationDate: string | null;     // when award was granted
  // REO ageing computed from: auctionClosedDate or adjudicationDate (reset)
}
```

---

## Business Rules

### BR-1: Call Logging is Mandatory
A case manager cannot proceed to the next action or next case without logging the call result. The Call Log modal is blocking.

### BR-2: Strategy-Proposal Consistency
When a case manager changes the strategy and an active proposal exists with a different strategy type, show a non-blocking warning. Do not prevent the change — but make the inconsistency visible.

### BR-3: Phone Blocking
Blocking a phone requires a reason. Blocked phones are visually distinguished (greyed, strikethrough) but remain in the list. Blocked phones cannot be used for the "CALL NOW" button. Phones can be unblocked.

### BR-4: Affordability is Incremental
No fields are required on first fill. Case managers add information as they learn it across multiple calls. The system tracks completeness (% of fields filled) and shows a badge.

### BR-5: All Cases Visible
Every user can see every case in the portfolio. Perimeter assignment determines which cases appear in the agent's queue and to-do list, but does not restrict read access.

### BR-6: Photo Mandatory for PDV
When creating a proposal with strategy PDV, show a warning if the affected collateral has no photos uploaded. Do not block — but make it prominent.

### BR-7: REO Ageing Calculation
- Start date = `auctionClosedDate` (when auction closed with no third-party winner)
- Reset date = `adjudicationDate` (if asset awarded after CDR couldn't be sold)
- Age = today - max(auctionClosedDate, adjudicationDate)
- Display: bar chart by month (how many REOs per age bracket)

### BR-8: Segmentation is Computed
Bucket assignment is derived from case data in real-time. No manual bucket assignment. The 26-bucket decision tree runs on every view refresh (or is cached and recalculated periodically).

### BR-9: Group View
Clicking a Group ID shows all cases in the group. Cases in a group share debtor relationships but may have different strategies, stages, and agents.

### BR-10: DPO Encubierta
If strategy is "DPO encubierta", it is displayed as such in the case detail and strategy selector, but in any future performance analytics or reporting (Splits 06+), it must be counted as DPO.

---

## Non-Functional Requirements

### Performance
- Dashboard must load in < 2 seconds for a perimeter of up to 500 cases
- Global search must return results in < 500ms
- Map must handle up to 5,000 collateral markers with clustering

### UX
- All text in Spanish (UI labels, button text, status labels)
- Mobile-responsive is not required for this phase (desktop-first)
- Minimum touch target: 44px for all interactive elements
- Color-blind friendly palette for status badges and map markers

### Data
- All interactions, affordability changes, and strategy changes must have audit trails (who, when, what changed)
- No data deletion — use soft deletes (cancelled, blocked, etc.)
- Purchase price must NEVER appear in any view, query, or export

---

## Out of Scope (handled in later splits)

- Team Leader views and priority assignment → Split 03
- Full proposal pipeline with committee workflow → Split 04
- Automated nudges and conflict warnings → Split 05
- Performance KPIs and targets → Split 06
- Portfolio Manager tools → Split 07
- Legal Manager and External Lawyer portal → Split 08
- Reporting and email exports → Split 09
- Support team views (Closing, MO, Compliance) → Split 10
- CSV/Excel portfolio import → Split 11
- Authentication beyond basic login → Split 01
- Dialer integration → Split 13
- Mobile app → Split 14
