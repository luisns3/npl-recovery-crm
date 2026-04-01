import { CrmProvider, useCrm } from './context/CrmContext';
import Layout from './components/Layout';
import CallQueue from './components/Dashboard/CallQueue';
import KanbanBoard from './components/Dashboard/KanbanBoard';
import CaseDetailView from './components/CaseDetail/CaseDetailView';
import CallLogModal from './components/CallLog/CallLogModal';
import NextActionScreen from './components/NextAction/NextActionScreen';

function AppContent() {
  const { currentView } = useCrm();

  if (currentView === 'case_detail') {
    return <CaseDetailView />;
  }

  if (currentView === 'call_log') {
    return <CallLogModal />;
  }

  if (currentView === 'next_action') {
    return <NextActionScreen />;
  }

  // Dashboard
  return (
    <div className="flex h-full">
      <CallQueue />
      <KanbanBoard />
    </div>
  );
}

export default function App() {
  return (
    <CrmProvider>
      <Layout>
        <AppContent />
      </Layout>
    </CrmProvider>
  );
}
