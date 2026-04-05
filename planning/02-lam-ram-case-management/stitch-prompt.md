# Google Stitch Prompt — Split 02: LAM/RAM Case Management UX

## Project Context

Design the complete UI/UX for an **NPL (Non-Performing Loan) Recovery CRM** used by debt recovery case managers in the **Spanish market**. The app is a desktop-first SPA (React + Tailwind CSS) used daily by Loan Asset Managers (LAMs) and REO Asset Managers (RAMs) who manage large portfolios of defaulted loans.

**Critical scale constraints:**
- Each LAM manages ~240 cases simultaneously
- Legal Managers handle up to 1,200 cases each
- The UI must never overwhelm the user — use filtered/paginated table views, not just card-based layouts
- The primary goal is to **maximize time on the phone** with debtors and **minimize navigation friction**

**Language:** All UI text must be in **Spanish** (labels, buttons, statuses, tooltips).

**Design system:** Modern, clean, professional. Color-blind friendly palette. Minimum 44px touch targets. No mobile layout needed (desktop-first).

---

## Screens to Design (7 total)

---

### Screen 1: Dashboard (Pantalla Principal)

The first screen after login. Must handle 240+ cases without visual overload.

#### 1A. Login Pop-up (Resumen de Actividad)

A dismissable modal shown once per day on first load:

- **Llamadas ayer:** count of calls made yesterday
- **Media 7 dias:** average daily calls over last 7 days
- **Media equipo:** average daily calls across the agent's team
- **Tendencia:** green/red arrow comparing yesterday vs 7-day avg
- **Alertas legales:** "X expedientes cambiaron de fase legal en los ultimos 7 dias sin CUP ni CUN registrado" — clickable, opens filtered list

#### 1B. Barra de Busqueda Global

Always visible in top navigation. Typeahead search (300ms debounce) across:
- Referencia de prestamo (Loan ID)
- Nombre de participante
- DNI/NIF/CIF
- ID de grupo
- Direccion de garantia (collateral address)
- Referencia catastral
- Registro de la Propiedad (finca, tomo)

Results grouped by type: Expedientes, Participantes, Garantias. Clicking opens Case Detail.

#### 1C. Cola de Llamadas (Call Queue)

**This is the most important element on the dashboard.** Auto-sorted list showing which cases to call next.

Priority algorithm (descending priority):
1. Longest time since last interaction
2. Active alert count
3. Best proposal probability (Deals > Focus > Pre-Pipe)
4. Days to auction (closest first)
5. Strategy priority (DPO > PDV > Loan Sale > Auction > Repossession)

**Each row shows:**
- Referencia expediente + ID grupo
- Nombre deudor principal
- Badge de estrategia (color-coded)
- Dias desde ultimo contacto
- Numero de alertas activas (if > 0)
- Badge de probabilidad de propuesta (if any)
- Fecha de subasta (if within 90 days, with countdown)

**Key design consideration:** Show only the actionable subset (next 10-20 cases), not all 240. Include a "Ver mas" option or pagination. The queue should feel like a focused to-do list, not an overwhelming spreadsheet.

**Actions:**
- Click row → opens Case Detail
- "Iniciar Llamadas" button → enters sequential call mode (case → call log → next action → next case)

#### 1D. Kanban Board (Vista Kanban)

Cases as cards in columns by stage: Pre-Contacto, Contactado, Negociando, Propuesta, Resuelto.

**Design consideration:** With 240 cases, Kanban works only as a **summary/overview** — show counts per column and allow expanding to see cases. Do NOT try to show all 240 cards simultaneously. Consider a collapsed view showing just column counts + key metrics, expandable to show filtered subsets.

Each card (when visible): referencia, nombre deudor, badge estrategia, dias desde contacto, indicador alerta.

#### 1E. Panel de Alertas / To-Do

Side panel or tab:
- Alertas vencidas hoy (sorted by time)
- Alertas atrasadas (highlighted red)
- Alertas proximos 7 dias
- Prioridades del TL ("Tu TL dice: llamar estos expedientes")

Each item: referencia expediente, tipo alerta, descripcion, fecha limite. Click opens the case.

#### 1F. Resumen de Inactividad de Contacto

Widget showing the agent's cases by contact recency:
- Sin contactar en 1 semana
- Sin contactar en 1 mes
- Sin contactar en 2-3 meses
- Sin contactar en 4-5 meses
- Sin contactar en 6+ meses
- Nunca contactado (por el gestor actual)

Each row is a clickable count that opens a filtered case list.

---

### Screen 2: Detalle del Expediente (Case Detail)

The main workspace for a single case. This is where case managers spend most of their time.

#### 2A. Barra Superior

- Boton "Volver" (back to dashboard)
- Referencia expediente (e.g., `EXP-2024-00456`)
- ID Grupo (clickable → Group View)
- Nombre deudor principal
- Badge de estrategia (color-coded)
- Badge estado legal (Judicial / Extrajudicial)
- Gestor asignado

#### 2B. Seccion de Telefono / Llamada

**Most prominent section — at the very top.** This is the core action.

- Numero principal: large, bold
- Titular del numero: who it belongs to (e.g., "Deudor - Juan Garcia")
- **Boton LLAMAR AHORA**: large, primary color. Disabled if no valid phone.
- Otros telefonos: list with number, titular (participante/inquilino/abogado), estado (activo/bloqueado)
- Telefonos bloqueados: greyed out with strikethrough, showing reason. "Desbloquear" button.
- Emails: listed below phones
- Direcciones postales: listed below emails

**Important:** Never show raw UUIDs anywhere in the UI. Always show human-readable names (user names, participant names, etc.).

#### 2C. Participantes y Asequibilidad

Each party shown as a card:
- Nombre, Rol (deudor, avalista, cotitular, representante legal, inquilino, heredero)
- DNI/NIF
- Badge de asequibilidad: "Completo" / "Incompleto" / "Sin iniciar"
- Click to expand → affordability form

**Formulario de Asequibilidad** (per participant, all fields optional, filled incrementally):
- Estado civil: Soltero/a, Casado/a, Divorciado/a, Viudo/a, Desconocido
- Situacion laboral: Empleado/a, Desempleado/a, Autonomo/a, Jubilado/a, Desconocido
- Menores en la vivienda: Si / No / Desconocido
- Personas con discapacidad: Si / No / Desconocido
- Ingreso mensual medio del hogar: EUR (optional)
- Fallecido: Si / No (if yes, blocks direct contact)
- Herederos identificados: Si / No / Pendiente
- Detalles herederos: free text
- Estado de ocupacion: Ocupado por deudor, Inquilino legal, Ocupacion ilegal, Desocupado, Desconocido
- Notas: free text
- Ultima actualizacion: date + user name (not UUID!)

#### 2D. Historial de Interacciones

Chronological list (most recent first):

| Fecha | Gestor | Tipo | Resultado | Comentario |
|-------|--------|------|-----------|------------|

- Tipos: Llamada / Nota / Visita
- Resultados as color-coded badges: CUP (green), CUN (red), No contesta (gray), Numero equivocado (orange), Callback (purple), etc.
- Pagination or infinite scroll
- Filters: by type, outcome, date range
- **Show agent name, never UUID**

#### 2E. Matriz Prestamo-Garantia (Loan-Collateral Matrix)

**This is critical UX.** The many-to-many relationship between loans and collaterals must be shown as a matrix/grid, NOT as separate flat lists.

**Design as a table/grid:**
- **Rows = Loans** with columns: Referencia, UPB, Intereses devengados, Deuda total, LTV, Estrategia (badge), Cargas posteriores (editable), Cargas anteriores (editable)
- **Columns = Collaterals** with headers: ID, Tipo inmueble, Direccion, Referencia catastral, Superficie (m2), Estado ocupacion
- **Cell intersections** show the **rango de carga (lien rank)** — 1a, 2a, etc. Empty cell means no relationship.

Below or beside the matrix, for each collateral show a **Valoraciones** sub-section:

| Tipo valoracion | Fuente | Importe | Fecha |
|-----------------|--------|---------|-------|
| Tasacion | Vendedor cartera | EUR XXX.XXX | YYYY-MM-DD |
| Tercero | [Nombre fuente] | EUR XXX.XXX | YYYY-MM-DD |
| Estimacion gestor | [Nombre gestor] | EUR XXX.XXX | YYYY-MM-DD |

Case managers can add their own valuations.

#### 2F. Documentos y Servicios

Table of back-office requests:

| Tipo documento | Fecha solicitud | Estado | Notas |
|----------------|-----------------|--------|-------|
| Nota simple | YYYY-MM-DD | Pendiente / Recibido / N/A | |

Button: "Solicitar documento"

#### 2G. Seccion Estado Legal

**Must answer these questions at a glance:**
- Which loan is judicialized?
- What collaterals are affected by legal proceedings?
- Who is in insolvency (concurso)?
- What milestone are we at in the legal claim?
- What milestone are we at in the insolvency process?

| Elemento | Descripcion |
|----------|-------------|
| Estado legal | Judicial / Extrajudicial (badge) |
| Tipo de procedimiento | Ejecucion hipotecaria, Concurso, etc. |
| Hito actual | Latest legal milestone |
| Indicador de cambio | "Cambio hace X dias" — highlighted if recent (configurable: 7/14/30 dias) |
| Fecha de subasta | With countdown |
| Estado concursal | If applicable |

Read-only for LAM/RAM (Legal Managers update in a future phase). Display must be structured, NOT just a simple badge.

#### 2H. Propuestas

**Must be editable, not just read-only.** Each proposal row is clickable to edit.

| Columna | |
|---------|--|
| ID Propuesta | |
| Prestamos afectados | Loan references |
| Garantias afectadas | Collateral references |
| Importe | EUR XXX.XXX |
| Condiciones de pago | Pago unico / Plazos |
| Tipo estrategia | DPO, PDV, etc. |
| Probabilidad | Pre-pipe / Focus / Deals / Firmada — color-coded badge |
| Cierre esperado | Date |
| Estado | Activa / Firmada / Cancelada (cancelada = greyed out) |
| Creada | Date |

Actions per proposal: Editar, Cancelar.

#### 2I. Fotos de Garantias

- Grid of photos per collateral
- Upload button (drag & drop + file picker)
- "Foto obligatoria" indicator for PDV strategy proposals
- Each photo: collateral reference, upload date, uploaded by (name, not UUID)

---

### Screen 3: Modal de Registro de Llamada (Call Log Modal)

Appears after clicking "LLAMAR AHORA". **Cannot be dismissed without completing** (mandatory logging).

**Fields:**
- Telefono llamado: pre-filled, read-only
- Resultado: radio buttons (large, easy to tap):
  - **No contesta** (gray) — includes voicemail/buzón de voz (merged into single option)
  - **CUP - Contacto Util Positivo** (green) — participant shows interest in collaborating
  - **CUN - Contacto Util Negativo** (red) — participant contacted but not collaborative
  - **Numero equivocado** (orange)
  - **Callback solicitado** (purple) — person asked to be called back
  - **Rechazo** (red) — person refused to engage
  - **Tercero contesto** (yellow) — someone else answered
- Participante contactado: dropdown (if answered)
- Comentario: text area, minimum 10 characters

**Post-submit behaviors:**
- "Numero equivocado" → prompt to block phone (pre-filled reason "Numero equivocado")
- "Callback solicitado" → prompt to create follow-up alert with date/time
- Always transitions to Next Action screen

---

### Screen 4: Pantalla Siguiente Accion (Next Action Screen)

Appears after logging a call. Quick-action menu.

**Available actions as large, clear buttons:**
- **Crear Alerta** — schedule follow-up (date, type, description)
- **Cambiar Estrategia** — dropdown: DPO, PDV/PoA, DPO encubierta, Loan Sale, DIL, SAU, CDR, Repossession. Warning if active proposal has different strategy.
- **Anadir Contacto** — phone/email/postal linked to participant/inquilino/abogado
- **Bloquear Telefono** — block with reason. Also shows unblock option.
- **Actualizar Asequibilidad** — open affordability form for a participant
- **Crear Propuesta** — form with: prestamos afectados (multi-select), garantias afectadas (multi-select), importe (EUR), condiciones (pago unico/plazos), fecha cierre, probabilidad (Pre-pipe/Focus/Deals). Warning if PDV and no photos.
- **Anadir Nota** — log a note without it being a call
- **Siguiente Expediente** — next case in queue (only in sequential call mode)
- **Volver al Expediente** — return to case detail
- **Volver al Dashboard** — return to dashboard

---

### Screen 5: Mapa de Espana (Spain Map)

Interactive map showing all collaterals in the agent's portfolio.

**Map features:**
- One marker per collateral, positioned by geocoded address
- Color by legal status: Judicial = red, Extrajudicial = blue
- Secondary indicator: green ring if active proposal exists
- Click marker → popup: direccion, tipo inmueble, referencia expediente, nombre deudor, estrategia, LTV. Link "Abrir expediente".
- Clustering when zoomed out (show count)
- Filters: by strategy, legal status, proposal status, occupancy
- Must handle up to 5,000 markers with clustering

---

### Screen 6: Vista de Segmentacion

Visual breakdown of the agent's portfolio by a 26-bucket segmentation tree.

**Display:**
- Tree/table view showing each bucket with case count
- Click bucket → filtered case list
- Summary bar chart showing distribution
- Color coding: green (D&F, Realistic Pre-pipe), yellow (Close to Auction), red (High CUN, Not Contacted), gray (Tail, Cancelled)

Segmentation is computed automatically from case data (strategy, proposals, contact history, LTV, auction dates). Not manually assigned.

---

### Screen 7: Vista de Grupo (Group View)

When clicking a Group ID, shows all related cases for the same debtor group.

- **Header:** ID Grupo, nombre deudor principal, deuda total agregada
- **Lista de expedientes:** each as a summary card with referencia, prestamos, estrategia, fase, gestor asignado
- Click card → opens full Case Detail

---

## Business Rules to Reflect in the Design

1. **Call logging is mandatory** — the call log modal is blocking, no dismiss without completing
2. **Strategy-Proposal consistency** — show non-blocking warning when changing strategy if active proposal has different type
3. **Phone blocking** — blocked phones greyed+strikethrough, block requires reason, can unblock
4. **Affordability is incremental** — no required fields, show completeness % badge
5. **All cases visible** — everyone can see all cases, but queue/to-do only shows own perimeter
6. **Photo mandatory for PDV** — prominent warning (not blocking) if no photos when creating PDV proposal
7. **Never show UUIDs** — always display human-readable names for users, participants, etc.
8. **Never show purchase price** — this field must never appear anywhere in the UI
9. **"No contesta" and "Buzon de voz" are merged** into a single call result option

---

## Data Model Reference

The underlying data model uses these entities (all snake_case in the database):

- **cases** — expedientes with stage, strategy, legal_status, insolvency_status, assigned_to, group_id
- **parties** — participants (borrower, guarantor, co_borrower, legal_representative, tenant, heir) with role, name, id_number
- **contacts** — phone/email/postal linked to parties, with is_blocked, block_reason
- **loans** — loan_reference, upb, accrued_interest, total_debt, strategy per loan
- **collaterals** — property_type, address, cadastral_ref, surface_sqm, occupancy_status, latitude/longitude
- **loan_collaterals** — junction table with lien_rank (many-to-many between loans and collaterals)
- **valuations** — per collateral: type (appraisal/third_party/case_manager), source, amount, date
- **interactions** — call/note/visit log with type, call_result, comment, participant_contacted, phone_called
- **alerts** — scheduled follow-ups with type, description, due_date, resolved_at
- **proposals** — with strategy_type, amount, payment_terms, probability, expected_closing_date, linked to loans and collaterals via junction tables
- **affordability** — per party: marital_status, employment_status, income, deceased, heirs, occupancy
- **groups** — group_name, cases linked via group_id on cases table

---

## Design Deliverables

Please design high-fidelity mockups for all 7 screens with:
1. A consistent design system (colors, typography, spacing, component library)
2. Spanish-language labels throughout
3. Color-blind friendly palette for all status badges and indicators
4. Responsive layout optimized for 1920x1080 desktop screens
5. Clear visual hierarchy emphasizing the phone/call workflow
6. Consideration for the 240-case scale — nothing should break or become unusable at this volume
