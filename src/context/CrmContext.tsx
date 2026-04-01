import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Case, ViewMode, CallResult, Strategy, AlertType, Probability, Contact, Proposal } from '../types';
import { mockCases } from '../data/mockData';
import { sortByPriority } from '../utils/priorityQueue';

interface CrmState {
  cases: Case[];
  currentView: ViewMode;
  currentCaseId: string | null;
  queueIndex: number;
  queue: Case[];
}

interface CrmActions {
  openCase: (id: string) => void;
  startCalls: () => void;
  goToDashboard: () => void;
  showCallLog: () => void;
  logCall: (resultCode: CallResult, comment: string) => void;
  showNextAction: () => void;
  advanceToNextCase: () => void;
  createAlert: (dueDate: string, type: AlertType, description: string) => void;
  changeStrategy: (strategy: Strategy) => void;
  addContact: (partyId: string, type: 'phone' | 'email', value: string, relationshipNote: string) => void;
  invalidatePhone: (contactId: string) => void;
  createProposal: (collateralId: string, strategyType: Strategy, probability: Probability, estimatedSigningDate: string) => void;
  updateProposal: (proposalId: string, updates: Partial<Proposal>) => void;
}

const CrmContext = createContext<(CrmState & CrmActions) | null>(null);

export function CrmProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<Case[]>(mockCases);
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [queueIndex, setQueueIndex] = useState(0);

  const queue = sortByPriority(cases.filter((c) => c.stage !== 'resolved'));

  const updateCase = useCallback((caseId: string, updater: (c: Case) => Case) => {
    setCases((prev) => prev.map((c) => (c.id === caseId ? updater(c) : c)));
  }, []);

  const openCase = useCallback((id: string) => {
    setCurrentCaseId(id);
    setCurrentView('case_detail');
  }, []);

  const startCalls = useCallback(() => {
    if (queue.length > 0) {
      setQueueIndex(0);
      setCurrentCaseId(queue[0].id);
      setCurrentView('case_detail');
    }
  }, [queue]);

  const goToDashboard = useCallback(() => {
    setCurrentView('dashboard');
    setCurrentCaseId(null);
  }, []);

  const showCallLog = useCallback(() => {
    setCurrentView('call_log');
  }, []);

  const logCall = useCallback((resultCode: CallResult, comment: string) => {
    if (!currentCaseId) return;
    const interaction = {
      id: `i-${Date.now()}`,
      caseId: currentCaseId,
      type: 'call' as const,
      resultCode,
      comment,
      createdBy: 'Carlos Ruiz',
      createdAt: new Date().toISOString().split('T')[0],
    };
    updateCase(currentCaseId, (c) => ({
      ...c,
      interactions: [...c.interactions, interaction],
      updatedAt: interaction.createdAt,
      stage: c.stage === 'pre_contact' ? 'contacted' : c.stage,
    }));
  }, [currentCaseId, updateCase]);

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

  const createAlert = useCallback((dueDate: string, type: AlertType, description: string) => {
    if (!currentCaseId) return;
    updateCase(currentCaseId, (c) => ({
      ...c,
      alerts: [...c.alerts, { id: `a-${Date.now()}`, caseId: currentCaseId, dueDate, type, description, resolvedAt: null }],
    }));
  }, [currentCaseId, updateCase]);

  const changeStrategy = useCallback((strategy: Strategy) => {
    if (!currentCaseId) return;
    updateCase(currentCaseId, (c) => ({ ...c, strategy }));
  }, [currentCaseId, updateCase]);

  const addContact = useCallback((partyId: string, type: 'phone' | 'email', value: string, relationshipNote: string) => {
    if (!currentCaseId) return;
    const contact: Contact = {
      id: `c-${Date.now()}`,
      partyId,
      type,
      value,
      isInvalid: false,
      relationshipNote,
      addedBy: 'Carlos Ruiz',
      addedAt: new Date().toISOString().split('T')[0],
    };
    updateCase(currentCaseId, (c) => ({ ...c, contacts: [...c.contacts, contact] }));
  }, [currentCaseId, updateCase]);

  const invalidatePhone = useCallback((contactId: string) => {
    if (!currentCaseId) return;
    updateCase(currentCaseId, (c) => ({
      ...c,
      contacts: c.contacts.map((ct) => (ct.id === contactId ? { ...ct, isInvalid: true } : ct)),
    }));
  }, [currentCaseId, updateCase]);

  const createProposal = useCallback((collateralId: string, strategyType: Strategy, probability: Probability, estimatedSigningDate: string) => {
    if (!currentCaseId) return;
    const proposal: Proposal = {
      id: `pr-${Date.now()}`,
      caseId: currentCaseId,
      collateralId,
      strategyType,
      probability,
      estimatedSigningDate,
      createdAt: new Date().toISOString().split('T')[0],
      cancelledAt: null,
    };
    updateCase(currentCaseId, (c) => ({
      ...c,
      proposals: [...c.proposals, proposal],
      stage: c.stage !== 'resolved' ? 'proposal' : c.stage,
    }));
  }, [currentCaseId, updateCase]);

  const updateProposal = useCallback((proposalId: string, updates: Partial<Proposal>) => {
    if (!currentCaseId) return;
    updateCase(currentCaseId, (c) => ({
      ...c,
      proposals: c.proposals.map((p) => (p.id === proposalId ? { ...p, ...updates } : p)),
    }));
  }, [currentCaseId, updateCase]);

  const currentCase = cases.find((c) => c.id === currentCaseId) || null;

  return (
    <CrmContext.Provider
      value={{
        cases,
        currentView,
        currentCaseId,
        queueIndex,
        queue,
        openCase,
        startCalls,
        goToDashboard,
        showCallLog,
        logCall,
        showNextAction,
        advanceToNextCase,
        createAlert,
        changeStrategy,
        addContact,
        invalidatePhone,
        createProposal,
        updateProposal,
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
