# NPL Recovery CRM

A high-speed web interface for debt recovery managers working on non-performing loans (NPLs). Built for speed and minimal clicks.

## Core Workflow

```
Call → Log result → Next action → Next case
```

## Features

- **Dashboard** with Kanban board (cases by stage) and prioritized call queue
- **Call Queue** auto-sorted by: days since last contact, active alerts, proposal probability, auction proximity, strategy priority
- **Case Detail** view with phone/call button, parties, interactions, alerts, debt summary, collateral (Google Maps links), and legal status
- **Mandatory Call Logging** — structured result + free-text comment required before proceeding
- **Next Action Screen** — create alerts, change strategy, add contacts, invalidate phones, manage proposals
- **Proposals** linked to collaterals with full history (cancelled proposals greyed out)

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── types.ts                    # Data model types
├── data/mockData.ts            # Mock NPL cases (Spanish market)
├── context/CrmContext.tsx      # Global state and actions
├── utils/priorityQueue.ts      # Queue sorting logic
├── components/
│   ├── Layout.tsx              # App shell
│   ├── Dashboard/              # Kanban board + call queue
│   ├── CaseDetail/             # Case view (debt, collateral, legal)
│   ├── CallLog/                # Mandatory call result modal
│   ├── NextAction/             # Post-call actions (alerts, strategy, contacts, proposals)
│   └── Proposals/              # Proposal list with history
```

## Data Model

Core entities: Case (expediente), Party, Contact, Loan, Collateral, LoanCollateral, Interaction, Alert, Proposal. Currently uses in-memory mock data with 6 realistic Spanish NPL cases.
