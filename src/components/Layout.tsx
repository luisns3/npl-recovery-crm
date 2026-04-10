import type { ReactNode } from 'react';
import { useCrm } from '../context/CrmContext';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function Layout({ children }: { children: ReactNode }) {
  const { currentView } = useCrm();

  // Active call is a locked workflow — no sidebar, no top bar
  const isLocked = currentView === 'active_call';

  if (isLocked) {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Sidebar />
      <div className="ml-48 flex flex-col min-h-screen">
        <TopBar />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
