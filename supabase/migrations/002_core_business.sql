-- Migration 002: Core Business Tables

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  portfolio_id UUID NOT NULL REFERENCES portfolios(id),
  group_id UUID REFERENCES groups(id),
  reference TEXT NOT NULL,
  stage case_stage NOT NULL DEFAULT 'pre_contact',
  strategy strategy_type NOT NULL,
  assigned_to UUID NOT NULL REFERENCES users(id),
  legal_status legal_status_type NOT NULL DEFAULT 'non_judicial',
  legal_procedure_type TEXT,
  legal_milestone TEXT,
  legal_milestone_date DATE,
  insolvency_status TEXT,
  auction_date DATE,
  auction_closed_date DATE,
  adjudication_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_cases_reference ON cases(tenant_id, reference);
CREATE INDEX idx_cases_portfolio ON cases(tenant_id, portfolio_id);
CREATE INDEX idx_cases_assigned ON cases(tenant_id, assigned_to);
CREATE INDEX idx_cases_group ON cases(tenant_id, group_id);

CREATE TABLE parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  id_number TEXT,
  role party_role_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_parties_case ON parties(tenant_id, case_id);
CREATE INDEX idx_parties_id_number ON parties(id_number) WHERE id_number IS NOT NULL;

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  party_id UUID REFERENCES parties(id),
  lawyer_name TEXT,
  type contact_type NOT NULL,
  value TEXT NOT NULL,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  block_reason TEXT,
  blocked_by UUID REFERENCES users(id),
  blocked_at TIMESTAMPTZ,
  added_by UUID NOT NULL REFERENCES users(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT contact_must_have_owner CHECK (party_id IS NOT NULL OR lawyer_name IS NOT NULL)
);

CREATE INDEX idx_contacts_case ON contacts(tenant_id, case_id);

CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  loan_reference TEXT NOT NULL,
  upb NUMERIC(15,2) NOT NULL DEFAULT 0,
  accrued_interest NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_debt NUMERIC(15,2) NOT NULL DEFAULT 0,
  strategy strategy_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_loans_case ON loans(tenant_id, case_id);

CREATE TABLE collaterals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  property_type TEXT NOT NULL,
  address TEXT NOT NULL,
  cadastral_ref TEXT,
  plot_registry TEXT,
  surface_sqm NUMERIC(10,2),
  occupancy_status occupancy_type NOT NULL DEFAULT 'unknown',
  latitude NUMERIC(9,6),
  longitude NUMERIC(9,6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_collaterals_cadastral ON collaterals(cadastral_ref) WHERE cadastral_ref IS NOT NULL;
CREATE INDEX idx_collaterals_plot ON collaterals(plot_registry) WHERE plot_registry IS NOT NULL;

CREATE TABLE loan_collaterals (
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  collateral_id UUID NOT NULL REFERENCES collaterals(id) ON DELETE CASCADE,
  lien_rank INTEGER NOT NULL DEFAULT 1,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  PRIMARY KEY (loan_id, collateral_id)
);

CREATE TABLE liens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  collateral_id UUID NOT NULL REFERENCES collaterals(id) ON DELETE CASCADE,
  rank lien_type NOT NULL,
  holder TEXT NOT NULL,
  amount NUMERIC(15,2),
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
