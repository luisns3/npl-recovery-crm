// ============================================
// Enums (aligned with database enums)
// ============================================

export type Stage = 'pre_contact' | 'contacted' | 'negotiating' | 'proposal' | 'resolved';

export type Strategy =
  | 'DPO' | 'PDV' | 'DPO_encubierta' | 'Loan_Sale'
  | 'DIL' | 'SAU' | 'CDR' | 'Repossession';

export type Probability = 'pre_pipe' | 'focus' | 'deals' | 'firmada' | 'cancelled';

export type CallResult =
  | 'not_answering' | 'cup' | 'cun' | 'wrong_number'
  | 'voicemail' | 'callback' | 'refused' | 'third_party';

export type InteractionType = 'call' | 'note' | 'visit';

export type PartyRole =
  | 'borrower' | 'guarantor' | 'co_borrower' | 'legal_representative'
  | 'tenant_legal' | 'tenant_illegal' | 'heir';

export type ContactType = 'phone' | 'email' | 'postal';

export type AlertType =
  | 'follow_up' | 'auction_date' | 'legal_deadline'
  | 'payment_due' | 'tl_priority' | 'system' | 'custom';

export type OccupancyStatus =
  | 'debtor_occupied' | 'legal_tenant' | 'illegal_occupant' | 'vacant' | 'unknown';

export type UserRole =
  | 'admin' | 'pm' | 'tl' | 'lam_phone' | 'lam_field' | 'ram'
  | 'lm' | 'external_lawyer' | 'closing' | 'middle_office' | 'compliance';

export type LegalStatus = 'judicial' | 'non_judicial';

export type PaymentTerms = 'lump_sum' | 'installments';

export type ValuationType = 'appraisal' | 'third_party' | 'case_manager';

export type LienRankType = 'senior' | 'junior';

export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'unknown';

export type EmploymentStatus = 'employed' | 'unemployed' | 'self_employed' | 'retired' | 'unknown';

export type YesNoUnknown = 'yes' | 'no' | 'unknown';

export type HeirsStatus = 'yes' | 'no' | 'pending';

// ============================================
// Core Entities
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  team_id: string | null;
  tenant_id: string;
  is_active: boolean;
}

export interface Party {
  id: string;
  case_id: string;
  name: string;
  id_number: string | null;
  role: PartyRole;
}

export interface Contact {
  id: string;
  case_id: string;
  party_id: string | null;
  lawyer_name: string | null;
  type: ContactType;
  value: string;
  is_blocked: boolean;
  block_reason: string | null;
  blocked_by: string | null;
  blocked_at: string | null;
  added_by: string;
  added_at: string;
}

export interface Loan {
  id: string;
  case_id: string;
  loan_reference: string;
  upb: number;
  accrued_interest: number;
  total_debt: number;
  strategy: Strategy;
}

export interface Collateral {
  id: string;
  property_type: string;
  address: string;
  cadastral_ref: string | null;
  plot_registry: string | null;
  surface_sqm: number | null;
  occupancy_status: OccupancyStatus;
  latitude: number | null;
  longitude: number | null;
}

export interface LoanCollateral {
  loan_id: string;
  collateral_id: string;
  lien_rank: number;
}

export interface Lien {
  id: string;
  loan_id: string;
  collateral_id: string;
  rank: LienRankType;
  holder: string;
  amount: number | null;
  notes: string | null;
  updated_by: string;
  updated_at: string;
}

export interface Interaction {
  id: string;
  case_id: string;
  type: InteractionType;
  call_result: CallResult | null;
  participant_contacted_id: string | null;
  phone_called: string | null;
  comment: string;
  created_by: string;
  created_at: string;
}

export interface Alert {
  id: string;
  case_id: string;
  type: AlertType;
  description: string;
  due_date: string;
  created_by: string;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
}

export interface Valuation {
  id: string;
  collateral_id: string;
  type: ValuationType;
  source: string;
  amount: number;
  valuation_date: string;
  created_by: string;
}

export interface Affordability {
  id: string;
  case_id: string;
  party_id: string;
  marital_status: MaritalStatus;
  employment_status: EmploymentStatus;
  minors_in_collateral: YesNoUnknown;
  disabled_in_collateral: YesNoUnknown;
  avg_monthly_income: number | null;
  deceased: boolean;
  heirs_identified: HeirsStatus;
  heir_details: string | null;
  occupancy_status: OccupancyStatus;
  notes: string | null;
  updated_by: string;
  updated_at: string;
}

export interface Proposal {
  id: string;
  case_id: string;
  strategy_type: Strategy;
  amount: number;
  payment_terms: PaymentTerms;
  installment_count: number | null;
  installment_frequency: 'monthly' | 'quarterly' | null;
  probability: Probability;
  expected_closing_date: string;
  bank_movement_id: string | null;
  created_by: string;
  created_at: string;
  cancelled_at: string | null;
  cancelled_by: string | null;
  // Loaded via junction tables
  loan_ids?: string[];
  collateral_ids?: string[];
}

export interface DocumentRequest {
  id: string;
  case_id: string;
  document_type: string;
  status: 'pending' | 'received' | 'not_applicable';
  notes: string | null;
  requested_by: string;
  requested_at: string;
  received_at: string | null;
}

export interface CollateralPhoto {
  id: string;
  collateral_id: string;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Case {
  id: string;
  reference: string;
  portfolio_id: string;
  group_id: string | null;
  stage: Stage;
  strategy: Strategy;
  assigned_to: string;
  legal_status: LegalStatus;
  legal_procedure_type: string | null;
  legal_milestone: string | null;
  legal_milestone_date: string | null;
  insolvency_status: string | null;
  auction_date: string | null;
  auction_closed_date: string | null;
  adjudication_date: string | null;
  created_at: string;
  updated_at: string;
  // Nested data (loaded via joins)
  parties: Party[];
  contacts: Contact[];
  loans: Loan[];
  collaterals: Collateral[];
  loan_collaterals: LoanCollateral[];
  interactions: Interaction[];
  alerts: Alert[];
  proposals: Proposal[];
}

export type ViewMode = 'dashboard' | 'case_detail' | 'call_log' | 'next_action' | 'active_call';

// ============================================
// Display Labels
// ============================================

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
  not_answering: 'No contesta',
  cup: 'CUP (Contacto Útil Positivo)',
  cun: 'CUN (Contacto Útil Negativo)',
  wrong_number: 'Número equivocado',
  voicemail: 'Buzón de voz',
  callback: 'Solicita rellamada',
  refused: 'Rechaza hablar',
  third_party: 'Contesta tercero',
};

export const STAGE_LABELS: Record<Stage, string> = {
  pre_contact: 'Pre-Contacto',
  contacted: 'Contactado',
  negotiating: 'Negociando',
  proposal: 'Propuesta',
  resolved: 'Resuelto',
};

export const STRATEGY_LABELS: Record<Strategy, string> = {
  DPO: 'DPO',
  PDV: 'PDV',
  DPO_encubierta: 'DPO Encubierta',
  Loan_Sale: 'Loan Sale',
  DIL: 'DIL (Dación)',
  SAU: 'SAU (Subasta)',
  CDR: 'CDR (Cesión Remate)',
  Repossession: 'Repossession',
};

export const PROBABILITY_LABELS: Record<Probability, string> = {
  pre_pipe: 'Pre-Pipe',
  focus: 'Focus',
  deals: 'Deals',
  firmada: 'Firmada',
  cancelled: 'Cancelada',
};

export const PROBABILITY_ORDER: Probability[] = ['deals', 'focus', 'pre_pipe', 'firmada', 'cancelled'];

export const STRATEGY_PRIORITY: Strategy[] = [
  'DPO', 'PDV', 'DPO_encubierta', 'Loan_Sale', 'DIL', 'SAU', 'CDR', 'Repossession',
];
