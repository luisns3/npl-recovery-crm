import { useState } from 'react';
import { useCurrentCase, useCrm } from '../../context/CrmContext';
import CreateAlert from './CreateAlert';
import ChangeStrategy from './ChangeStrategy';
import AddContact from './AddContact';
import InvalidatePhone from './InvalidatePhone';
import ProposalForm from './ProposalForm';

type Tab = 'alert' | 'strategy' | 'contact' | 'phone' | 'proposal';

const TABS: { key: Tab; label: string }[] = [
  { key: 'alert', label: 'Create Alert' },
  { key: 'strategy', label: 'Change Strategy' },
  { key: 'contact', label: 'Add Contact' },
  { key: 'phone', label: 'Invalidate Phone' },
  { key: 'proposal', label: 'Proposal' },
];

export default function NextActionScreen() {
  const c = useCurrentCase();
  const { advanceToNextCase } = useCrm();
  const [activeTab, setActiveTab] = useState<Tab>('alert');

  if (!c) return null;

  const borrower = c.parties.find((p) => p.role === 'borrower');

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Next Action</h2>
          <p className="text-sm text-gray-500">{borrower?.name} &middot; {c.reference}</p>
        </div>
        <button
          onClick={advanceToNextCase}
          className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2.5 px-6 rounded-lg text-sm transition-colors"
        >
          SKIP &rarr; NEXT CASE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-colors ${
                  activeTab === tab.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            {activeTab === 'alert' && <CreateAlert />}
            {activeTab === 'strategy' && <ChangeStrategy />}
            {activeTab === 'contact' && <AddContact />}
            {activeTab === 'phone' && <InvalidatePhone />}
            {activeTab === 'proposal' && <ProposalForm />}
          </div>
        </div>
      </div>
    </div>
  );
}
