export type Stage = 'pre_contact' | 'contacted' | 'negotiating' | 'proposal' | 'resolved';
export type Strategy = 'DPO' | 'PDV' | 'Loan Sale' | 'Auction' | 'Repossession';
export type Probability = 'Cancelled' | 'Pre-Pipe' | 'Focus' | 'Deals' | 'Signed';
export type CallResult = 'no_answer' | 'not_interested' | 'will_callback' | 'agreement' | 'wrong_number';
export type PartyRole = 'borrower' | 'guarantor' | 'co_borrower' | 'legal_representative';
export type ContactType = 'phone' | 'email';
export type AlertType = 'follow_up' | 'auction_date' | 'legal_deadline' | 'payment_due' | 'custom';

export interface Party {
  id: string;
  caseId: string;
  name: string;
  role: PartyRole;
}

export interface Contact {
  id: string;
  partyId: string;
  type: ContactType;
  value: string;
  isInvalid: boolean;
  relationshipNote: string;
  addedBy: string;
  addedAt: string;
}

export interface Loan {
  id: string;
  caseId: string;
  outstandingAmount: number;
  strategy: Strategy;
}

export interface Collateral {
  id: string;
  type: string;
  address: string;
  sizeSqm: number;
  valuation: number;
  registryData: string;
  cadastralRef: string;
  mapsUrl: string;
}

export interface LoanCollateral {
  loanId: string;
  collateralId: string;
  lienRank: number;
}

export interface Interaction {
  id: string;
  caseId: string;
  type: 'call' | 'note';
  resultCode: CallResult | null;
  comment: string;
  createdBy: string;
  createdAt: string;
}

export interface Alert {
  id: string;
  caseId: string;
  dueDate: string;
  type: AlertType;
  description: string;
  resolvedAt: string | null;
}

export interface Proposal {
  id: string;
  caseId: string;
  collateralId: string;
  strategyType: Strategy;
  probability: Probability;
  estimatedSigningDate: string;
  createdAt: string;
  cancelledAt: string | null;
}

export interface Case {
  id: string;
  reference: string;
  stage: Stage;
  strategy: Strategy;
  assignedTo: string;
  createdAt: string;
  updatedAt: string;
  auctionDate: string | null;
  legalStatus: 'judicial' | 'non_judicial';
  insolvencyStatus: string | null;
  parties: Party[];
  contacts: Contact[];
  loans: Loan[];
  collaterals: Collateral[];
  loanCollaterals: LoanCollateral[];
  interactions: Interaction[];
  alerts: Alert[];
  proposals: Proposal[];
}

export type ViewMode = 'dashboard' | 'case_detail' | 'call_log' | 'next_action';

export const CALL_RESULT_LABELS: Record<CallResult, string> = {
  no_answer: 'No Answer',
  not_interested: 'Answered - Not interested',
  will_callback: 'Answered - Will call back',
  agreement: 'Agreement reached',
  wrong_number: 'Wrong number',
};

export const STAGE_LABELS: Record<Stage, string> = {
  pre_contact: 'Pre-Contact',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  proposal: 'Proposal',
  resolved: 'Resolved',
};

export const PROBABILITY_ORDER: Probability[] = ['Deals', 'Focus', 'Pre-Pipe', 'Signed', 'Cancelled'];
export const STRATEGY_PRIORITY: Strategy[] = ['DPO', 'PDV', 'Loan Sale', 'Auction', 'Repossession'];
