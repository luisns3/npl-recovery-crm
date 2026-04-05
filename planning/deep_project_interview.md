# Deep Project Interview — NPL Recovery CRM

**Date:** 2026-04-03
**Interviewer:** Claude (Deep Project)
**Stakeholder:** Luis (Product Owner / Portfolio Director)

---

## Q1: What's the single most important thing the product needs to do that it can't do today?

**Answer:** The current app is a quick prototype, far from the full vision. Needs: permanent data persistence, multi-user login, role-specific displays, management reporting, and much more.

---

## Q2: Who are the different user types?

**Answer — Full role hierarchy:**

### Core Operational Roles
- **LAM (Loan Asset Manager):** Manages NPL cases. Sees their full perimeter, case details (loan-collateral matrix), documents/services requested to back office, proposals (active/signed/cancelled), monthly collection targets, performance metrics, weekly committee proposal count (target: 3/week), proposal statuses, prioritized to-do list (set by TL + own agenda/alerts), Spain map with collateral locations, legal status overview with recent milestone changes (7/14/30 day window per PM criteria).
- **RAM (REO Asset Manager):** Same as LAM but also sees ageing of their perimeter.
- **LM (Legal Manager):** Supervises external lawyers. Sees legal cases and non-judicialized perimeter. Multiple procedure types (Foreclosures, Insolvency, etc.) with milestones TBD. Guides lawyers on court submissions, flags stale cases for court push.

### Support Roles
- **Closing:** Arranges deal signings after client approval.
- **Middle Office (MO):** Support team for operational processing.
- **Compliance:** Regulatory/KYC checks.

### External Roles
- **External Lawyers:** Own login. Upload court-issued documents, provide brief summaries.

### Management Roles
- **Team Leader (TL):** Same view as LAM/RAM/LM but for entire team's perimeter. Sets priorities, daily/weekly goals ("call these cases"). Comprehensive dashboard of team + employee agendas. NOTE: Legal TLs are separate — a Legal TL cannot have LAMs/RAMs.
- **Portfolio Manager (PM) / Portfolio Director:** Top of hierarchy. Same as TL but across all portfolios. Missions: (i) guide TLs via activity data analysis, (ii) reshuffle cases among case managers based on stock and recovery ability, (iii) define targets from Business Plan modeling (later phase).

### Admin
- **Admin:** Creates user accounts. For now = PM. Future = customer-designated person.

### Key constraints:
- Users cannot have multiple roles
- Legal is a separate team silo with its own TLs
- All perimeters can span multiple portfolios; filtering by portfolio must be available
- **Users are unsophisticated** — interfaces must be extremely intuitive and simple

---

## Q3: Backend and deployment preferences?

**Answer:**
- **Multi-tenant SaaS** architecture, but first deployment is single-company PoC
- **Backend:** Needs recommendation (no preference)
- **Hosting:** Vercel
- **Future:** Mobile app for monitoring on smartphones + dialer integration

---

## Q4: Data and integrations?

**Answer:**
- **Data ingestion:** CSV/Excel portfolio uploads
- **External integrations:** Document management system (vendor TBD). Accounting/ERP via Excel export (future).
- **Committee process:** Offline weekly meeting. Digital workflow: (1) case manager uploads approval/counteroffer/rejection, (2) TL verifies info matches meeting notes before advancing proposal, (3) once all weekly proposals updated and checked, TL sends summary email with Excel of all proposal history records.

---

## Q5: Authentication and organizational structure?

**Answer:**
- Admin (= PM for now) creates all user accounts
- TLs cannot add/remove agents — only PM can
- Strict single-role per user
- Legal is organizationally separate with dedicated TLs
- No role above PM (PM = Portfolio Director)

**Confirmed hierarchy:**
```
Portfolio Manager (PM / Portfolio Director)
├── Team Leader (Commercial)
│   ├── LAM (Loan Asset Manager)
│   └── RAM (REO Asset Manager)
├── Team Leader (Legal)
│   └── LM (Legal Manager)
│         └── External Lawyer (limited portal)
└── Support Teams (Closing, MO, Compliance)
```

---

## Q6: Case lifecycle and strategies?

**Answer — Complete strategy taxonomy:**
- **DPO (Discount Pay-Off):** Debtor repays (full/partial, with/without discount). Funding: friends & family, bank mortgage, or self-sale of property.
- **PDV / PoA (Power of Attorney):** Debtor signs commercialization agreement; servicer helps sell collateral. Rare: selling non-collateral property.
- **"DPO encubierta":** Loan Sale structured deal to debtor's related party. Client wants these reported as DPOs in performance analysis.
- **Loan Sale:** Selling the loan to a third party.
- **DIL (Deed in Lieu / Dación en Pago):** Debt repaid via collateral property transfer.
- **SAU (Sale at Auction):** Third party wins public auction; servicer repaid from proceeds.
- **CDR (Cesión de Remate):** Servicer wins auction, gets right of award. Can be sold to investors before testimony of award → otherwise becomes REO.
- **Repossession:** Last resort — repossess asset and sell as REO.

**Strategy changes:** Unlimited, case manager updates freely. Problem: they forget to update, creating contradictions between strategy and active proposals. System should nudge/enforce consistency.

**Success metrics and philosophy:**
- Sales funnel mindset: more calls → more negotiations → more proposals → more signings → targets met
- Target: 3 proposals/week reviewed in committee, 1 signing/week
- Critical problem: case managers spend too much time on admin, too little calling
- Anti-pattern: signings clustered at month-end / quarter-end, overwhelming Closing/MO/KYC teams
- **Primary KPI:** Total monthly recovery amount vs. target (this is what the client/investor cares about)
- Bonus structure tied to monthly recovery vs. target

---

## Q7: Support teams and system behavior?

**Answer:**
- Closing, MO, and Compliance all get their own CRM views (in scope, later phase)
- External lawyers get their own login (limited portal)
- System should actively push case managers (automated alerts, warnings, strategy conflict detection) AND inform Team Leaders when patterns of negligence emerge (dashboard with repeat-offender data)

---

## Q8: Phasing / Priority

**User-defined phases:**

| Phase | Feature Area |
|---|---|
| Phase 1 | LAM/RAM case management + call workflow |
| Phase 2 | Team Leader dashboards + priority setting |
| Phase 3 | Proposal pipeline + Committee workflow |
| Phase 4 | Automated nudges + strategy conflict warnings |
| Phase 5 | Performance KPIs + targets |
| Phase 6 | Portfolio Manager overview + case reshuffling |
| Phase 7 | Legal Manager + External Lawyer portal |
| Phase 8 | Reporting + email summaries |
| Later | Closing / MO / Compliance views, CSV import, Auth + roles |
| Much later | Document management integration, Dialer |
| Last | Mobile app |

---

## Tech Stack Recommendation (from Claude)

Given: Vercel hosting, future mobile app, multi-tenant SaaS, complex relational data model, file uploads from lawyers, real-time nudges needed.

**Recommended stack:**
- **Database:** PostgreSQL via **Supabase** (or Neon)
- **Backend:** Supabase (auth, row-level security for multi-tenancy, file storage for documents, realtime for notifications) + Vercel serverless functions for custom business logic
- **Frontend:** Keep existing React 19 + TypeScript + Vite + Tailwind CSS 4
- **Auth:** Supabase Auth (supports role-based access, magic links, SSO later)
- **File storage:** Supabase Storage (for lawyer uploads, court documents)
- **Mobile (future):** React Native or PWA (Supabase client works in both)
- **Email (future):** Resend or Supabase Edge Functions

**Why Supabase:**
1. Built-in auth with role management — no need to build from scratch
2. PostgreSQL — ideal for this complex relational domain (loans, collaterals, many-to-many)
3. Row-level security policies — multi-tenancy without app-level hacks
4. Realtime subscriptions — push notifications for nudges/alerts
5. File storage — lawyer document uploads
6. Vercel-native integration
7. Fast to prototype, scales to production

---

## Q9: Affordability form and call outcome details?

**Answer:**

### Affordability Form
- **One form per participant** (debtor, guarantor, occupant — each gets their own)
- **Fields:** Marital status (divorced), employment status (unemployed), minors living in collateral, disabled persons, average monthly household income, deceased participants, heirs ("herederos"), occupancy status of collateral
- **When filled:** Mostly on first contacts, but can be updated throughout the life of the case
- **Printable:** Must be included in the proposal one-pager sent to client ahead of committee for review and audits

### Call Outcomes
- Not Answering
- CUP (Positive Useful Contact) — participant shows clear interest in collaborating
- CUN (Negative Useful Contact) — participant contacted but not collaborative
- Wrong Number
- Voicemail
- Callback Requested
- Debtor Refused to Talk
- Third Party Answered
- *(Disconnected number excluded)*

### Phone/Contact Management
- **Blocking phones:** Requires a reason. Blocked phones can be unblocked.
- **Contact types:** Phone, email address, postal address (for notifications)
- **Association:** Every contact must be linked to a participant, a tenant (legal or illegal), or one of their lawyers
- **Source:** Not required — only the association matters
- **Value:** Helps current case manager and future ones if case is reshuffled

---

## Q10: Financial data and proposal fields?

**Answer:**

### Loan Financial Data (visible to case managers)
- UPB (Unpaid Principal Balance)
- Accrued interest
- Total debt
- LTV Ratio
- Junior/senior liens — **editable by case manager** (e.g., other liens affect PDV feasibility)
- **Purchase price is strictly CONFIDENTIAL** — not visible to anyone, not even PM

### Collateral Data in Matrix
- Lien rank
- Property reference (catastral)
- Address
- Surface area
- Property type
- Valuations (see below)
- Occupancy status

### Collateral Valuations
- **Appraisal value:** Provided by portfolio seller at onboarding
- **Other valuations:** Can be provided by other parties
- **Case manager valuation:** Optional, case managers can add their own estimate
- **All valuations must be visible** simultaneously

### Proposal Fields
- Which loans and collaterals are affected
- Proposal amount
- Payment terms (lump sum vs installments)
- Expected closing date
- Probability stage: Pre-pipe → Focus → Deals → Firmada
- *(No need for case manager to state the discount — system calculates from amount vs debt)*

### Post-Signing Closure
- Case manager must **link proposal to a bank account movement** before debt is cancelled
- Legal claim is withdrawn after linking (except for Loan Sale strategy)

---

## Q11: Proposal probability stages clarified

**Answer — these are pipeline stages, not just labels:**

| Stage | Meaning |
|---|---|
| **Pre-pipe** | Genuine debtor interest in agreement / investor presented Loan Sale or CDR offer |
| **Focus** | Proposal approved in committee |
| **Deals** | 80%+ probability of signing |
| **Firmada** | Signed and cashed |

### Post-Approval Support Team Sequence
1. **MO (Middle Office):** Contacts counterpart, requests KYC documentation for compliance
2. **Compliance:** Approves source of funds
3. **Closing:** ~2 weeks before signing, prepares documents and arranges signing with notary and counterpart

### Committee Counteroffers
- Case manager goes back to debtor with new terms and resubmits to next committee
- A proposal can bounce between committee and negotiation **multiple times**

---

## Q12: Alerts, agenda, and daily workflow

**Answer:**

### Alert Types
- Callback reminders ("Call debtor back on X date")
- Auction proximity warnings
- Strategy not updated warnings
- Proposal pending in committee
- Calling plans based on portfolio segmentation (at TL discretion)

### Alert Creators
- Case managers (own alerts)
- Team Leaders (assign alerts/priorities to agents)
- System (automated nudges)

### Daily Login Experience
- **First screen:** To-do list + call queue sorted by priority
- **Pop-up on login:** Yesterday's activity compared to last 7 days average AND team average
- Pop-up also shows: cases with legal phase changes in last 7 days where no CUP or CUN has been registered

### Global Search
Must search across: **Loan ID, Participant Name, Participant ID (DNI/NIF), Group ID, Collateral Address, Collateral Cadastral Reference, Collateral ID, Plot Registry**

### Visibility Rule
**Everyone can see all cases in the portfolio** — not restricted to own perimeter for viewing

### Case Reshuffling / Handover
- New agent inherits everything as-is
- Full access to: all previous comments by all agents, affordability forms, legal manager comments, external lawyer comments
- No special handover process — the case history speaks for itself

---

## Q13: Portfolio segmentation — 26 buckets

**Answer — Full decision tree for case segmentation:**

The segmentation is editable but the standard classification is:

```
ALL CASES
├── Bucket 1: Cancelled Positions
└── Active Positions
    ├── Bucket 2: Tail (5+ year holdouts)
    ├── Bucket 3: Unsecured (no collateral)
    └── Secured & Active
        ├── Bucket 4: D&F (Deals or Focus probability)
        ├── Pre-pipe Proposals
        │   ├── Bucket 5: Realistic Pre-pipe (proposal < 90 days)
        │   └── Bucket 6: Unrealistic Pre-pipe (proposal ≥ 90 days) [threshold PM/TL-configurable]
        ├── Close to Auction
        │   ├── Bucket 7: Pending Auction Committee
        │   └── Not reviewed on Auction Committee
        │       ├── Bucket 8: Close to Auction Contacted
        │       └── Bucket 9: Close to Auction Not Contacted
        ├── Auction Closed
        │   ├── Bucket 10: Real Estate (no bid hit strike → selling CDR/REO)
        │   └── Bucket 11: Cash at Court (third party won, awaiting payment)
        └── Far from Auction
            ├── Bucket 12: Insolvency (admin expected to sell)
            ├── Cancelled Proposal
            │   ├── Bucket 13: Proposal Cancelled before Escalation
            │   ├── Bucket 14: Proposal Denied (committee denied/counteroffered)
            │   └── Bucket 15: Approved then Cancelled
            └── Without Proposal
                ├── Contacted
                │   ├── Had CUP at some point
                │   │   ├── Bucket 16: Last CUP > 70 days
                │   │   ├── Bucket 17: Last CUP ≤ 70 days + junior liens
                │   │   └── Bucket 18: Last CUP ≤ 70 days + no junior liens
                │   └── Only CUN (no CUP ever)
                │       ├── Bucket 19: Low CUN (< 5 CUNs)
                │       └── ≥ 5 CUNs
                │           ├── Bucket 20: High CUN Low LTV
                │           ├── Bucket 21: High CUN Mid LTV
                │           └── Bucket 22: High CUN High LTV
                └── Non-Contacted
                    ├── Bucket 23: All debtors deceased
                    ├── < 5 contact attempts
                    │   └── Bucket 26: Not Contacted Low Attempts
                    └── ≥ 5 contact attempts
                        ├── Bucket 24: Not Contacted ≥ 5 attempts + Small Ticket
                        └── Bucket 25: Not Contacted ≥ 5 attempts + Not Small Ticket
```

**LTV thresholds (Low/Mid/High):** PM-configurable
**Pre-pipe age threshold (90 days):** PM/TL-configurable
**Contact inactivity tracking:** Case managers, TL, PM can see cases not contacted in: 1 week, 1 month, 2-3 months, 4-5 months, 6+ months, or never (by current case manager)

### Calling Plans
- **Manual:** TL assigns specific cases to call today ("call these 20 cases")
- **Rule-based:** "Call all cases with no contact in 14+ days"
- Both approaches coexist

### Groups
- A Group is a set of related cases (e.g., same debtor across multiple loans)
- Case managers can view all cases in a group together

---

## Q14: Collateral map and field visits

**Answer:**

### Spain Map
- Visual map with all collateral locations
- **Color-coded** by: legal status, proposal existence, other criteria
- Helps plan field visits by geography
- Helps case managers show investors assets in specific regions

### Two Types of LAM
- **Phone agents:** Work remotely, do not visit properties
- **Field agents:** Recovery mostly in person. Handle cases with no debtor contact. Visit assets to identify occupants and find correct contact info. Sometimes reach debtors through their lawyers present in legal proceedings.
- **Field agent tracking:** Dedicated app with geolocation. Log in during visits. Associate visit to a loan. Tracks visit activity.

### RAM and Brokers (API — Agentes de la Propiedad Inmobiliaria)
- RAM does not visit properties
- Uses local brokers (API) for field work
- Broker access to system: much later phase
- Future: brokers submit offers from potential buyers through the system

### Collateral Photos
- Nice to have for general proposals
- **Strictly mandatory for PDV proposals** (needed for property marketing/publication)

---

## Q15: REO specifics and ageing

**Answer:**

### REO Ageing
- **Key KPI:** Time asset has been on the market (longer = higher costs)
- **Start date:** Auction closed with no third-party winner
- **Reset condition:** If asset awarded to servicer (adjudication), ageing resets to award date (because CDR sale window passed)
- **Visualization:** Bar chart by month
- **Also applies to PDVs** managed by RAM + LAM together

### PDV / REO Collaboration
- **RAM:** Deals with broker and asset sale
- **LAM:** Manages debtor cooperation
- Sales mandate = PDV
- Cash collected from loan cancellation as result of PDV sale = "PDV sales"

### REO Marketing
- Should be managed internally in the software
- Listing/publication workflow exists but details deferred to later discussion
- Broker portal access deferred to later phase
