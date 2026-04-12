import { supabase } from './supabase';
import type {
  Case, CallResult, Strategy, AlertType, Probability,
  ContactType, InteractionType, PaymentTerms,
} from '../types';

// ============================================
// Fetch Cases
// ============================================

export async function fetchCasesForTenant(): Promise<Case[]> {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      parties (*),
      contacts (*),
      loans (*, loan_collaterals (*)),
      interactions (*),
      alerts (*),
      proposals (*)
    `)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching cases:', error);
    return [];
  }

  // Extract collateral IDs from loans -> loan_collaterals
  const collateralIds = new Set<string>();
  for (const c of data || []) {
    for (const loan of (c.loans || [])) {
      for (const lc of (loan.loan_collaterals || [])) {
        collateralIds.add(lc.collateral_id);
      }
    }
  }

  let collateralsMap: Record<string, unknown> = {};
  if (collateralIds.size > 0) {
    const { data: collaterals } = await supabase
      .from('collaterals')
      .select('*')
      .in('id', Array.from(collateralIds));

    if (collaterals) {
      collateralsMap = Object.fromEntries(collaterals.map(c => [c.id, c]));
    }
  }

  // Build flat loan_collaterals and collaterals arrays on each case
  return (data || []).map(c => {
    const loanCollaterals: { loan_id: string; collateral_id: string; lien_rank: number; is_enforced?: boolean }[] = [];
    for (const loan of (c.loans || [])) {
      for (const lc of (loan.loan_collaterals || [])) {
        loanCollaterals.push(lc);
      }
    }
    const seen = new Set<string>();
    const collaterals = loanCollaterals
      .map(lc => collateralsMap[lc.collateral_id])
      .filter(Boolean)
      .filter((v: unknown) => {
        const id = (v as { id: string }).id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

    return {
      ...c,
      loan_collaterals: loanCollaterals,
      collaterals,
    };
  }) as Case[];
}

export async function fetchCaseById(caseId: string): Promise<Case | null> {
  const { data, error } = await supabase
    .from('cases')
    .select(`
      *,
      parties (*),
      contacts (*),
      loans (*, loan_collaterals (*)),
      interactions (*),
      alerts (*),
      proposals (*)
    `)
    .eq('id', caseId)
    .single();

  if (error || !data) return null;

  // Extract collateral IDs from loans -> loan_collaterals
  const loanCollaterals: { loan_id: string; collateral_id: string; lien_rank: number; is_enforced?: boolean }[] = [];
  for (const loan of (data.loans || [])) {
    for (const lc of (loan.loan_collaterals || [])) {
      loanCollaterals.push(lc);
    }
  }

  const collateralIds = [...new Set(loanCollaterals.map(lc => lc.collateral_id))];
  let collaterals: unknown[] = [];
  if (collateralIds.length > 0) {
    const { data: cols } = await supabase
      .from('collaterals')
      .select('*')
      .in('id', collateralIds);
    collaterals = cols || [];
  }

  return { ...data, loan_collaterals: loanCollaterals, collaterals } as Case;
}

// ============================================
// Interactions
// ============================================

export async function logInteraction(params: {
  tenant_id: string;
  case_id: string;
  type: InteractionType;
  call_result: CallResult | null;
  participant_contacted_id: string | null;
  phone_called: string | null;
  comment: string;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from('interactions')
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Alerts
// ============================================

export async function createAlert(params: {
  tenant_id: string;
  case_id: string;
  type: AlertType;
  description: string;
  due_date: string;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from('alerts')
    .insert(params)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================
// Cases
// ============================================

export async function updateCaseStrategy(caseId: string, strategy: Strategy) {
  const { error } = await supabase
    .from('cases')
    .update({ strategy })
    .eq('id', caseId);

  if (error) throw error;
}

export async function updateCaseStage(caseId: string, stage: string) {
  const { error } = await supabase
    .from('cases')
    .update({ stage })
    .eq('id', caseId);

  if (error) throw error;
}

// ============================================
// Contacts
// ============================================

export async function addContact(params: {
  tenant_id: string;
  case_id: string;
  party_id: string | null;
  lawyer_name: string | null;
  type: ContactType;
  value: string;
  added_by: string;
}) {
  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...params, is_blocked: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function blockContact(contactId: string, reason: string, userId: string) {
  const { error } = await supabase
    .from('contacts')
    .update({
      is_blocked: true,
      block_reason: reason,
      blocked_by: userId,
      blocked_at: new Date().toISOString(),
    })
    .eq('id', contactId);

  if (error) throw error;
}

export async function unblockContact(contactId: string) {
  const { error } = await supabase
    .from('contacts')
    .update({
      is_blocked: false,
      block_reason: null,
      blocked_by: null,
      blocked_at: null,
    })
    .eq('id', contactId);

  if (error) throw error;
}

// ============================================
// Proposals
// ============================================

export async function createProposal(params: {
  tenant_id: string;
  case_id: string;
  strategy_type: Strategy;
  amount: number;
  payment_terms: PaymentTerms;
  installment_count: number | null;
  installment_frequency: 'monthly' | 'quarterly' | null;
  probability: Probability;
  expected_closing_date: string;
  created_by: string;
  loan_ids: string[];
  collateral_ids: string[];
}) {
  const { loan_ids, collateral_ids, ...proposalData } = params;

  // Insert proposal
  const { data: proposal, error } = await supabase
    .from('proposals')
    .insert(proposalData)
    .select()
    .single();

  if (error || !proposal) throw error;

  // Insert junction rows
  if (loan_ids.length > 0) {
    await supabase.from('proposal_loans').insert(
      loan_ids.map(lid => ({ proposal_id: proposal.id, loan_id: lid, tenant_id: params.tenant_id }))
    );
  }
  if (collateral_ids.length > 0) {
    await supabase.from('proposal_collaterals').insert(
      collateral_ids.map(cid => ({ proposal_id: proposal.id, collateral_id: cid, tenant_id: params.tenant_id }))
    );
  }

  return proposal;
}

export async function updateProposal(proposalId: string, updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('proposals')
    .update(updates)
    .eq('id', proposalId);

  if (error) throw error;
}

// ============================================
// Global Search
// ============================================

export async function globalSearch(searchTerm: string, tenantId: string) {
  const { data, error } = await supabase
    .rpc('global_search', { search_term: searchTerm, p_tenant_id: tenantId });

  if (error) {
    console.error('Search error:', error);
    return [];
  }
  return data || [];
}
