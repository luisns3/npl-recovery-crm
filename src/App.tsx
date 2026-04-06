import { AuthProvider, useAuth } from './context/AuthContext';
import { CrmProvider, useCrm } from './context/CrmContext';
import Layout from './components/Layout';
import LoginPage from './components/Auth/LoginPage';
import CallQueue from './components/Dashboard/CallQueue';
import KanbanBoard from './components/Dashboard/KanbanBoard';
import CaseDetailView from './components/CaseDetail/CaseDetailView';
import CallLogModal from './components/CallLog/CallLogModal';
import NextActionScreen from './components/NextAction/NextActionScreen';
import ActiveCallScreen from './components/ActiveCall/ActiveCallScreen';
import LoginSummaryPopup, { useLoginSummary } from './components/Dashboard/LoginSummaryPopup';
import type { Case } from './types';

function AppContent() {
  const { currentView, loading, openCase } = useCrm();
  const { showSummary, dismiss } = useLoginSummary();

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading cases...</p>
      </div>
    );
  }

  function handleOpenLegalAlerts(cases: Case[]) {
    dismiss();
    if (cases.length > 0) {
      openCase(cases[0].id);
    }
  }

  return (
    <>
      {showSummary && currentView === 'dashboard' && (
        <LoginSummaryPopup onDismiss={dismiss} onOpenLegalAlerts={handleOpenLegalAlerts} />
      )}
      <AppContentInner />
    </>
  );
}

function AppContentInner() {
  const { currentView } = useCrm();

  if (currentView === 'active_call') return <ActiveCallScreen />;
  if (currentView === 'case_detail') return <CaseDetailView />;
  if (currentView === 'call_log') return <CallLogModal />;
  if (currentView === 'next_action') return <NextActionScreen />;

  return (
    <div className="flex h-full">
      <CallQueue />
      <KanbanBoard />
    </div>
  );
}

function AuthenticatedApp() {
  return (
    <CrmProvider>
      <Layout>
        <AppContent />
      </Layout>
    </CrmProvider>
  );
}

function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (!session) return <LoginPage />;

  return <AuthenticatedApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
