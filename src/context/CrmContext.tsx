import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  Case, ViewMode, CallResult, Strategy, AlertType, Probability,
  ContactType, PaymentTerms,
} from '../types';
import { useAuth } from './AuthContext';
import {
  fetchCasesForTenant,
  logInteraction,
  createAlert as createAlertQuery,
  updateCaseStrategy as updateStrategyQuery,
  addContact as addContactQuery,
  blockContact,
  createProposal as createProposalQuery,
  updateProposal as updateProposalQuery,
} from '../lib/queries';
import { sortByPriority } from '../utils/priorityQueue';

interface CrmState {
  cases: Case[];
  loading: boolean;
  currentView: ViewMode;
  previousView: ViewMode | null;
  currentCaseId: string | null;
  queueIndex: number;
  queue: Case[];
}

interface CrmActions {
  navigate: (view: ViewMode) => void;
  openCase: (id: string) => void;
  openGroup: (groupId: string) => void;
  startCalls: () => void;
  goToDashboard: () => void;
  showCallLog: () => void;
  showActiveCall: () => void;
  currentGroupId: string | null;
  logCall: (callResult: CallResult, comment: string) => Promise<void>;
  showNextAction: () => void;
  advanceToNextCase: () => void;
  createAlert: (dueDate: string, type: AlertType, description: string) => Promise<void>;
  changeStrategy: (strategy: Strategy) => Promise<void>;
  addContact: (partyId: string | null, type: ContactType, value: string, lawyerName?: string | null) => Promise<void>;
  blockPhone: (contactId: string, reason: string) => Promise<void>;
  createProposal: (params: {
    strategy_type: Strategy;
    amount: number;
    payment_terms: PaymentTerms;
    installment_count: number | null;
    installment_frequency: 'monthly' | 'quarterly' | null;
    probability: Probability;
    expected_closing_date: string;
    loan_ids: string[];
    collateral_ids: string[];
  }) => Promise<void>;
  updateProposal: (proposalId: string, updates: Record<string, unknown>) => Promise<void>;
  refreshCases: () => Promise<void>;
}

const CrmContext = createContext<(CrmState & CrmActions) | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [previousView, setPreviousView] = useState<ViewMode | null>(null);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const queue = sortByPriority(cases.filter((c) => c.stage !== 'resolved'));

  const refreshCases = useCallback(async () => {
    const data = await fetchCasesForTenant();
    setCases(data);
  }, []);

  useEffect(() => {
    if (user) {
      refreshCases().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, refreshCases]);

  const navigate = useCallback((view: ViewMode) => {
    setCurrentView(view);
    if (view !== 'case_detail' && view !== 'active_call' && view !== 'call_log' && view !== 'next_action') {
      setCurrentCaseId(null);
    }
  }, []);

  const openGroup = useCallback((groupId: string) => {
    setPreviousView(currentView);
    setCurrentGroupId(groupId);
    setCurrentView('group_view');
  }, [currentView]);

  // openCase is an alias: a case and a group are the same view.
  // Look up the case's group_id; fall back to the case id itself.
  const openCase = useCallback((id: string) => {
    openGroup(id);
  }, [openGroup]);

  const startCalls = useCallback(() => {
    if (queue.length > 0) {
      setQueueIndex(0);
      setCurrentCaseId(queue[0].id);
      setCurrentView('active_call');
    }
  }, [queue]);

  const goToDashboard = useCallback(() => {
    setCurrentView('dashboard');
    setCurrentCaseId(null);
  }, []);

  const showCallLog = useCallback(() => {
    setCurrentView('call_log');
  }, []);

  const showActiveCall = useCallback(() => {
    setCurrentView('active_call');
  }, []);

  const logCall = useCallback(async (callResult: CallResult, comment: string) => {
    if (!currentCaseId || !user) return;
    await logInteraction({
      tenant_id: user.tenant_id,
      case_id: currentCaseId,
      type: 'call',
      call_result: callResult,
      participant_contacted_id: null,
      phone_called: null,
      comment,
      created_by: user.id,
    });
    await refreshCases();
  }, [currentCaseId, user, refreshCases]);

  const showNextAction = useCallback(() => {
    setCurrentView('next_action');
  }, []);

  const advanceToNextCase = useCallback(() => {
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      setQueueIndex(nextIdx);
      setCurrentCaseId(queue[nextIdx].id);
      setCurrentView('case_detail');
    } else {
      setCurrentView('dashboard');
      setCurrentCaseId(null);
    }
  }, [queueIndex, queue]);

  const createAlert = useCallback(async (dueDate: string, type: AlertType, description: string) => {
    if (!currentCaseId || !user) return;
    await createAlertQuery({
      tenant_id: user.tenant_id,
      case_id: currentCaseId,
      type,
      description,
      due_date: dueDate,
      created_by: user.id,
    });
    await refreshCases();
  }, [currentCaseId, user, refreshCases]);

  const changeStrategy = useCallback(async (strategy: Strategy) => {
    if (!currentCaseId) return;
    await updateStrategyQuery(currentCaseId, strategy);
    await refreshCases();
  }, [currentCaseId, refreshCases]);

  const addContact = useCallback(async (partyId: string | null, type: ContactType, value: string, lawyerName?: string | null) => {
    if (!currentCaseId || !user) return;
    await addContactQuery({
      tenant_id: user.tenant_id,
      case_id: currentCaseId,
      party_id: partyId,
      lawyer_name: lawyerName ?? null,
      type,
      value,
      added_by: user.id,
    });
    await refreshCases();
  }, [currentCaseId, user, refreshCases]);

  const blockPhone = useCallback(async (contactId: string, reason: string) => {
    if (!user) return;
    await blockContact(contactId, reason, user.id);
    await refreshCases();
  }, [user, refreshCases]);

  const createProposal = useCallback(async (params: {
    strategy_type: Strategy;
    amount: number;
    payment_terms: PaymentTerms;
    installment_count: number | null;
    installment_frequency: 'monthly' | 'quarterly' | null;
    probability: Probability;
    expected_closing_date: string;
    loan_ids: string[];
    collateral_ids: string[];
  }) => {
    if (!currentCaseId || !user) return;
    await createProposalQuery({
      tenant_id: user.tenant_id,
      case_id: currentCaseId,
      created_by: user.id,
      ...params,
    });
    await refreshCases();
  }, [currentCaseId, user, refreshCases]);

  const updateProposal = useCallback(async (proposalId: string, updates: Record<string, unknown>) => {
    await updateProposalQuery(proposalId, updates);
    await refreshCases();
  }, [refreshCases]);

  return (
    <CrmContext.Provider
      value={{
        cases,
        loading,
        currentView,
        previousView,
        currentCaseId,
        queueIndex,
        queue,
        navigate,
        openCase,
        openGroup,
        currentGroupId,
        startCalls,
        goToDashboard,
        showCallLog,
        showActiveCall,
        logCall,
        showNextAction,
        advanceToNextCase,
        createAlert,
        changeStrategy,
        addContact,
        blockPhone,
        createProposal,
        updateProposal,
        refreshCases,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const ctx = useContext(CrmContext);
  if (!ctx) throw new Error('useCrm must be used within CrmProvider');
  return ctx;
}

export function useCurrentCase(): Case | null {
  const { cases, currentCaseId } = useCrm();
  return cases.find((c) => c.id === currentCaseId) || null;
}
