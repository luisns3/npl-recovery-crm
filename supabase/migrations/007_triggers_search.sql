-- Migration 007: Audit Log, Triggers, Search Indexes, Global Search Function

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by UUID, -- nullable for seed/migration scripts
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_table_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_changed_at ON audit_log(changed_at DESC);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON cases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON loans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON collaterals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON affordability FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON segmentation_config FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUDIT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (tenant_id, table_name, record_id, action, old_values, new_values, changed_by, changed_at)
  VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP::audit_action,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
    COALESCE(auth.uid(), NULL),
    NOW()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to key tables
CREATE TRIGGER audit_cases AFTER INSERT OR UPDATE OR DELETE ON cases FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_interactions AFTER INSERT OR UPDATE OR DELETE ON interactions FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_proposals AFTER INSERT OR UPDATE OR DELETE ON proposals FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_affordability AFTER INSERT OR UPDATE OR DELETE ON affordability FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_contacts AFTER INSERT OR UPDATE OR DELETE ON contacts FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_alerts AFTER INSERT OR UPDATE OR DELETE ON alerts FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_liens AFTER INSERT OR UPDATE OR DELETE ON liens FOR EACH ROW EXECUTE FUNCTION audit_trigger();
CREATE TRIGGER audit_valuations AFTER INSERT OR UPDATE OR DELETE ON valuations FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ============================================
-- TRIGRAM INDEXES FOR SEARCH
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_cases_ref_trgm ON cases USING gin (reference gin_trgm_ops);
CREATE INDEX idx_loans_ref_trgm ON loans USING gin (loan_reference gin_trgm_ops);
CREATE INDEX idx_parties_name_trgm ON parties USING gin (name gin_trgm_ops);
CREATE INDEX idx_collaterals_addr_trgm ON collaterals USING gin (address gin_trgm_ops);

-- ============================================
-- GLOBAL SEARCH FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION global_search(search_term TEXT, p_tenant_id UUID)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  case_id UUID,
  display_text TEXT,
  match_field TEXT
) AS $$
BEGIN
  RETURN QUERY

  -- Search cases by reference
  SELECT 'case'::TEXT, c.id, c.id, c.reference, 'reference'::TEXT
  FROM cases c
  WHERE c.tenant_id = p_tenant_id AND c.reference ILIKE '%' || search_term || '%'

  UNION ALL

  -- Search loans by loan_reference
  SELECT 'loan'::TEXT, l.id, l.case_id, l.loan_reference, 'loan_reference'::TEXT
  FROM loans l
  WHERE l.tenant_id = p_tenant_id AND l.loan_reference ILIKE '%' || search_term || '%'

  UNION ALL

  -- Search parties by name
  SELECT 'party'::TEXT, p.id, p.case_id, p.name, 'name'::TEXT
  FROM parties p
  WHERE p.tenant_id = p_tenant_id AND p.name ILIKE '%' || search_term || '%'

  UNION ALL

  -- Search parties by id_number (DNI/NIF)
  SELECT 'party'::TEXT, p.id, p.case_id, p.name || ' (' || p.id_number || ')', 'id_number'::TEXT
  FROM parties p
  WHERE p.tenant_id = p_tenant_id AND p.id_number IS NOT NULL
    AND p.id_number ILIKE '%' || search_term || '%'

  UNION ALL

  -- Search groups by name or id
  SELECT 'group'::TEXT, g.id, NULL::UUID, g.name, 'group_name'::TEXT
  FROM groups g
  WHERE g.tenant_id = p_tenant_id AND g.name ILIKE '%' || search_term || '%'

  UNION ALL

  -- Search collaterals by address
  SELECT 'collateral'::TEXT, col.id, lc.case_id, col.address, 'address'::TEXT
  FROM collaterals col
  LEFT JOIN loan_collaterals lclnk ON lclnk.collateral_id = col.id
  LEFT JOIN loans lc ON lc.id = lclnk.loan_id
  WHERE col.tenant_id = p_tenant_id AND col.address ILIKE '%' || search_term || '%'

  UNION ALL

  -- Search collaterals by cadastral ref
  SELECT 'collateral'::TEXT, col.id, lc.case_id, col.cadastral_ref, 'cadastral_ref'::TEXT
  FROM collaterals col
  LEFT JOIN loan_collaterals lclnk ON lclnk.collateral_id = col.id
  LEFT JOIN loans lc ON lc.id = lclnk.loan_id
  WHERE col.tenant_id = p_tenant_id AND col.cadastral_ref IS NOT NULL
    AND col.cadastral_ref ILIKE '%' || search_term || '%'

  UNION ALL

  -- Search collaterals by plot registry
  SELECT 'collateral'::TEXT, col.id, lc.case_id, col.plot_registry, 'plot_registry'::TEXT
  FROM collaterals col
  LEFT JOIN loan_collaterals lclnk ON lclnk.collateral_id = col.id
  LEFT JOIN loans lc ON lc.id = lclnk.loan_id
  WHERE col.tenant_id = p_tenant_id AND col.plot_registry IS NOT NULL
    AND col.plot_registry ILIKE '%' || search_term || '%'

  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
