-- Migration 006: Documents, Photos, and Configuration

CREATE TABLE document_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  status document_status_type NOT NULL DEFAULT 'pending',
  notes TEXT,
  requested_by UUID NOT NULL REFERENCES users(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ
);

CREATE INDEX idx_doc_requests_case ON document_requests(tenant_id, case_id);

CREATE TABLE collateral_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  collateral_id UUID NOT NULL REFERENCES collaterals(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_photos_collateral ON collateral_photos(tenant_id, collateral_id);

CREATE TABLE segmentation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) UNIQUE,
  ltv_low_threshold NUMERIC(5,2) NOT NULL DEFAULT 50.00,
  ltv_high_threshold NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  prepipe_realistic_days INTEGER NOT NULL DEFAULT 90,
  cun_high_threshold INTEGER NOT NULL DEFAULT 5,
  contact_attempt_threshold INTEGER NOT NULL DEFAULT 5,
  small_ticket_amount NUMERIC(15,2) NOT NULL DEFAULT 50000.00,
  legal_milestone_window_days INTEGER NOT NULL DEFAULT 14,
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
