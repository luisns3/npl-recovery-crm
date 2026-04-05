# NPL Recovery CRM — Requirements

## Project Description

A high-speed web interface for debt recovery managers working on non-performing loans (NPLs) in the Spanish market. Core principle: **speed and minimal clicks**. The next call must always be obvious.

## Current State (What Exists)

- React 19 + TypeScript + Vite + Tailwind CSS 4 SPA
- Dashboard with Kanban board (cases by stage) + prioritized call queue
- Case Detail view (parties, contacts, loans, collateral, legal status, interactions)
- Mandatory Call Logging (structured result + free-text comment)
- Next Action screen (alerts, strategy changes, contacts, proposals)
- Proposals management (linked to collaterals, full history)
- Priority queue logic (days since contact, alerts, proposal probability, auction proximity, strategy)
- All data is in-memory mock data — no backend, no persistence

## What Needs to Be Built (Known)

- Backend / persistence layer (currently all mock data)
- Authentication and user management
- Real data integration
- Potentially: reporting, analytics, export features
- Potentially: multi-user support and role management

## Constraints & Context

- Spanish NPL/REO market (servicers, portfolio managers, fund managers)
- Users are debt recovery agents and team leaders
- Performance and speed are critical — agents make many calls per day
- The product may evolve into a full SaaS platform

## Open Questions (To Define via Interview)

- Backend technology preference?
- Multi-tenant SaaS or single-org deployment?
- Priority features for next milestone?
- Reporting and analytics requirements?
- Integration with external systems?
- Timeline and resource constraints?
