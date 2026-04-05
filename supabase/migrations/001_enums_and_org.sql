-- Migration 001: Enums and Organizational Tables
-- Run this FIRST in Supabase SQL Editor

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE user_role AS ENUM (
  'admin', 'pm', 'tl', 'lam_phone', 'lam_field', 'ram',
  'lm', 'external_lawyer', 'closing', 'middle_office', 'compliance'
);

CREATE TYPE team_type AS ENUM ('commercial', 'legal', 'support');

CREATE TYPE legal_status_type AS ENUM ('judicial', 'non_judicial');

CREATE TYPE case_stage AS ENUM (
  'pre_contact', 'contacted', 'negotiating', 'proposal', 'resolved'
);

CREATE TYPE strategy_type AS ENUM (
  'DPO', 'PDV', 'DPO_encubierta', 'Loan_Sale', 'DIL', 'SAU', 'CDR', 'Repossession'
);

CREATE TYPE probability_type AS ENUM (
  'pre_pipe', 'focus', 'deals', 'firmada', 'cancelled'
);

CREATE TYPE call_result_type AS ENUM (
  'not_answering', 'cup', 'cun', 'wrong_number',
  'voicemail', 'callback', 'refused', 'third_party'
);

CREATE TYPE party_role_type AS ENUM (
  'borrower', 'guarantor', 'co_borrower', 'legal_representative',
  'tenant_legal', 'tenant_illegal', 'heir'
);

CREATE TYPE contact_type AS ENUM ('phone', 'email', 'postal');

CREATE TYPE occupancy_type AS ENUM (
  'debtor_occupied', 'legal_tenant', 'illegal_occupant', 'vacant', 'unknown'
);

CREATE TYPE interaction_type AS ENUM ('call', 'note', 'visit');

CREATE TYPE alert_type AS ENUM (
  'follow_up', 'auction_date', 'legal_deadline',
  'payment_due', 'tl_priority', 'system', 'custom'
);

CREATE TYPE valuation_type AS ENUM ('appraisal', 'third_party', 'case_manager');

CREATE TYPE lien_type AS ENUM ('senior', 'junior');

CREATE TYPE payment_terms_type AS ENUM ('lump_sum', 'installments');

CREATE TYPE installment_frequency_type AS ENUM ('monthly', 'quarterly');

CREATE TYPE document_status_type AS ENUM ('pending', 'received', 'not_applicable');

CREATE TYPE marital_status_type AS ENUM ('single', 'married', 'divorced', 'widowed', 'unknown');

CREATE TYPE employment_status_type AS ENUM ('employed', 'unemployed', 'self_employed', 'retired', 'unknown');

CREATE TYPE yes_no_unknown AS ENUM ('yes', 'no', 'unknown');

CREATE TYPE heirs_status AS ENUM ('yes', 'no', 'pending');

CREATE TYPE audit_action AS ENUM ('insert', 'update', 'delete');

-- ============================================
-- ORGANIZATIONAL TABLES
-- ============================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  type team_type NOT NULL,
  leader_id UUID, -- FK added after users table exists
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'lam_phone',
  team_id UUID REFERENCES teams(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Now add the FK from teams.leader_id to users
ALTER TABLE teams ADD CONSTRAINT fk_teams_leader FOREIGN KEY (leader_id) REFERENCES users(id);

-- Unique email per tenant
CREATE UNIQUE INDEX idx_users_email_tenant ON users(tenant_id, email);
