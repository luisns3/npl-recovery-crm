-- Migration 004: Financial Tables (Valuations + Affordability)

CREATE TABLE valuations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  collateral_id UUID NOT NULL REFERENCES collaterals(id) ON DELETE CASCADE,
  type valuation_type NOT NULL,
  source TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  valuation_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_valuations_collateral ON valuations(tenant_id, collateral_id);

CREATE TABLE affordability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  party_id UUID NOT NULL REFERENCES parties(id) ON DELETE CASCADE,
  marital_status marital_status_type NOT NULL DEFAULT 'unknown',
  employment_status employment_status_type NOT NULL DEFAULT 'unknown',
  minors_in_collateral yes_no_unknown NOT NULL DEFAULT 'unknown',
  disabled_in_collateral yes_no_unknown NOT NULL DEFAULT 'unknown',
  avg_monthly_income NUMERIC(10,2),
  deceased BOOLEAN NOT NULL DEFAULT false,
  heirs_identified heirs_status NOT NULL DEFAULT 'pending',
  heir_details TEXT,
  occupancy_status occupancy_type NOT NULL DEFAULT 'unknown',
  notes TEXT,
  updated_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_affordability_per_party UNIQUE (case_id, party_id)
);
