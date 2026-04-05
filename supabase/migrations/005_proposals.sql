-- Migration 005: Proposal Tables

CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  strategy_type strategy_type NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  payment_terms payment_terms_type NOT NULL,
  installment_count INTEGER,
  installment_frequency installment_frequency_type,
  probability probability_type NOT NULL DEFAULT 'pre_pipe',
  expected_closing_date DATE NOT NULL,
  bank_movement_id TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES users(id)
);

CREATE INDEX idx_proposals_case ON proposals(tenant_id, case_id);

CREATE TABLE proposal_loans (
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  PRIMARY KEY (proposal_id, loan_id)
);

CREATE TABLE proposal_collaterals (
  proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  collateral_id UUID NOT NULL REFERENCES collaterals(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  PRIMARY KEY (proposal_id, collateral_id)
);
