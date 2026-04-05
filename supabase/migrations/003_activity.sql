-- Migration 003: Activity Tables (Interactions + Alerts)

CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type interaction_type NOT NULL,
  call_result call_result_type,
  participant_contacted_id UUID REFERENCES parties(id),
  phone_called TEXT,
  comment TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_interactions_case ON interactions(tenant_id, case_id, created_at DESC);
CREATE INDEX idx_interactions_user ON interactions(tenant_id, created_by, created_at DESC);

CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type alert_type NOT NULL,
  description TEXT NOT NULL,
  due_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES users(id)
);

CREATE INDEX idx_alerts_active ON alerts(tenant_id, case_id, resolved_at);
CREATE INDEX idx_alerts_due ON alerts(tenant_id, due_date);
