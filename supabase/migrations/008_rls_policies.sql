-- Migration 008: Row-Level Security Policies

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaterals ENABLE ROW LEVEL SECURITY;
ALTER TABLE loan_collaterals ENABLE ROW LEVEL SECURITY;
ALTER TABLE liens ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;
ALTER TABLE affordability ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_collaterals ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE collateral_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE segmentation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- HELPER: Get current user's tenant_id
-- ============================================

CREATE OR REPLACE FUNCTION get_my_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER: Get current user's role
-- ============================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER: Get current user's team_id
-- ============================================

CREATE OR REPLACE FUNCTION get_my_team_id()
RETURNS UUID AS $$
  SELECT team_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================
-- HELPER: Check if user can write to a case
-- (own case, or admin/pm, or TL of the assigned agent's team)
-- ============================================

CREATE OR REPLACE FUNCTION can_write_case(p_case_assigned_to UUID)
RETURNS BOOLEAN AS $$
DECLARE
  my_role user_role;
  my_team UUID;
  assigned_team UUID;
BEGIN
  SELECT role, team_id INTO my_role, my_team FROM users WHERE id = auth.uid();

  -- Admin and PM can write anything
  IF my_role IN ('admin', 'pm') THEN RETURN true; END IF;

  -- Case manager can write their own cases
  IF p_case_assigned_to = auth.uid() THEN RETURN true; END IF;

  -- TL can write cases assigned to their team members
  IF my_role = 'tl' THEN
    SELECT team_id INTO assigned_team FROM users WHERE id = p_case_assigned_to;
    IF assigned_team = my_team THEN RETURN true; END IF;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- TENANT ISOLATION: SELECT policies (everyone sees their tenant's data)
-- ============================================

-- Tenants: users see their own tenant
CREATE POLICY "tenant_select" ON tenants FOR SELECT USING (id = get_my_tenant_id());

-- All other tables: filter by tenant_id
CREATE POLICY "tenant_select" ON teams FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON portfolios FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON users FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON groups FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON cases FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON parties FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON contacts FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON loans FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON collaterals FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON loan_collaterals FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON liens FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON interactions FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON alerts FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON valuations FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON affordability FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON proposals FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON proposal_loans FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON proposal_collaterals FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON document_requests FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON collateral_photos FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON segmentation_config FOR SELECT USING (tenant_id = get_my_tenant_id());
CREATE POLICY "tenant_select" ON audit_log FOR SELECT USING (tenant_id = get_my_tenant_id());

-- ============================================
-- WRITE POLICIES: Cases (team-scoped for TL)
-- ============================================

CREATE POLICY "case_update" ON cases FOR UPDATE
  USING (tenant_id = get_my_tenant_id() AND can_write_case(assigned_to));

-- ============================================
-- WRITE POLICIES: Case-related tables
-- ============================================

-- Interactions: INSERT only (no update/delete)
CREATE POLICY "interaction_insert" ON interactions FOR INSERT
  WITH CHECK (
    tenant_id = get_my_tenant_id()
    AND can_write_case((SELECT assigned_to FROM cases WHERE id = case_id))
  );

-- Contacts: INSERT and UPDATE
CREATE POLICY "contact_insert" ON contacts FOR INSERT
  WITH CHECK (
    tenant_id = get_my_tenant_id()
    AND can_write_case((SELECT assigned_to FROM cases WHERE id = case_id))
  );
CREATE POLICY "contact_update" ON contacts FOR UPDATE
  USING (
    tenant_id = get_my_tenant_id()
    AND can_write_case((SELECT assigned_to FROM cases WHERE id = case_id))
  );

-- Proposals: INSERT and UPDATE
CREATE POLICY "proposal_insert" ON proposals FOR INSERT
  WITH CHECK (
    tenant_id = get_my_tenant_id()
    AND can_write_case((SELECT assigned_to FROM cases WHERE id = case_id))
  );
CREATE POLICY "proposal_update" ON proposals FOR UPDATE
  USING (
    tenant_id = get_my_tenant_id()
    AND can_write_case((SELECT assigned_to FROM cases WHERE id = case_id))
  );

-- Proposal junction tables
CREATE POLICY "proposal_loans_insert" ON proposal_loans FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "proposal_collaterals_insert" ON proposal_collaterals FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

-- Alerts: anyone in tenant can create (TLs create for agents, agents for themselves)
CREATE POLICY "alert_insert" ON alerts FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "alert_update" ON alerts FOR UPDATE
  USING (tenant_id = get_my_tenant_id());

-- Affordability
CREATE POLICY "affordability_insert" ON affordability FOR INSERT
  WITH CHECK (
    tenant_id = get_my_tenant_id()
    AND can_write_case((SELECT assigned_to FROM cases WHERE id = case_id))
  );
CREATE POLICY "affordability_update" ON affordability FOR UPDATE
  USING (
    tenant_id = get_my_tenant_id()
    AND can_write_case((SELECT assigned_to FROM cases WHERE id = case_id))
  );

-- Valuations
CREATE POLICY "valuation_insert" ON valuations FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

-- Liens
CREATE POLICY "lien_insert" ON liens FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "lien_update" ON liens FOR UPDATE
  USING (tenant_id = get_my_tenant_id());

-- Document requests
CREATE POLICY "doc_request_insert" ON document_requests FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());
CREATE POLICY "doc_request_update" ON document_requests FOR UPDATE
  USING (tenant_id = get_my_tenant_id());

-- Collateral photos
CREATE POLICY "photo_insert" ON collateral_photos FOR INSERT
  WITH CHECK (tenant_id = get_my_tenant_id());

-- ============================================
-- ADMIN-ONLY: Users table write
-- ============================================

CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (get_my_role() IN ('admin', 'pm'));
CREATE POLICY "users_update" ON users FOR UPDATE
  USING (get_my_role() IN ('admin', 'pm'));

-- Segmentation config: only PM/admin can update
CREATE POLICY "config_update" ON segmentation_config FOR UPDATE
  USING (get_my_role() IN ('admin', 'pm'));
