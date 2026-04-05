import { useCurrentCase, useCrm } from '../../context/CrmContext';
import DebtSummary from './DebtSummary';
import CollateralInfo from './CollateralInfo';
import LegalStatus from './LegalStatus';
import ProposalList from '../Proposals/ProposalList';

export default function CaseDetailView() {
  const c = useCurrentCase();
  const { goToDashboard, showActiveCall } = useCrm();

  if (!c) return null;

  const borrower = c.parties.find((p) => p.role === 'borrower');
  const primaryPhone = c.contacts.find((ct) => ct.type === 'phone' && !ct.is_blocked);
  const lastInteraction = c.interactions.length > 0
    ? c.interactions.reduce((a, b) => (a.created_at > b.created_at ? a : b))
    : null;
  const activeAlerts = c.alerts.filter((a) => !a.resolved_at);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={goToDashboard} className="text-gray-400 hover:text-gray-600 text-sm">
            &larr; Back
          </button>
          <span className="text-sm font-medium text-gray-900">{c.reference}</span>
          <span className="text-xs text-gray-500">{borrower?.name}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* 1. Phone + Call Button */}
        <div className="bg-indigo-50 rounded-xl p-5 flex items-center justify-between">
          <div>
            {primaryPhone ? (
              <p className="text-2xl font-bold text-indigo-900 tracking-wide">{primaryPhone.value}</p>
            ) : (
              <p className="text-lg text-red-600 font-medium">No valid phone number</p>
            )}
            <p className="text-xs text-indigo-600 mt-1">{primaryPhone?.type === 'phone' ? 'Phone' : ''}</p>
          </div>
          <button
            onClick={showActiveCall}
            disabled={!primaryPhone}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
          >
            CALL NOW
          </button>
        </div>

        {/* Other phones */}
        {c.contacts.filter((ct) => ct.type === 'phone' && ct.id !== primaryPhone?.id).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {c.contacts
              .filter((ct) => ct.type === 'phone' && ct.id !== primaryPhone?.id)
              .map((ct) => (
                <span
                  key={ct.id}
                  className={`text-xs px-2 py-1 rounded ${ct.is_blocked ? 'bg-red-100 text-red-500 line-through' : 'bg-gray-100 text-gray-700'}`}
                >
                  {ct.value} {ct.is_blocked && '(blocked)'}
                </span>
              ))}
          </div>
        )}

        {/* 2. Parties */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Parties</h3>
          <div className="flex flex-wrap gap-3">
            {c.parties.map((p) => (
              <div key={p.id} className="text-sm">
                <span className="font-medium text-gray-900">{p.name}</span>
                <span className="text-gray-400 ml-1.5 text-xs capitalize">({p.role.replace('_', ' ')})</span>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Last Interaction */}
        {lastInteraction && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last Interaction</h3>
            <p className="text-sm text-gray-700">{lastInteraction.comment}</p>
            <p className="text-xs text-gray-400 mt-1">{lastInteraction.created_at} &middot; {lastInteraction.created_by}</p>
          </div>
        )}

        {/* 4. Alerts */}
        {activeAlerts.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Alerts</h3>
            <div className="space-y-1.5">
              {activeAlerts.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <span className="text-amber-600 font-medium">{a.type.replace('_', ' ')}</span>
                  <span className="text-gray-600">{a.description}</span>
                  <span className="text-xs text-gray-400 ml-auto">{a.due_date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Debt Summary */}
        <DebtSummary loans={c.loans} />

        {/* 6. Collateral */}
        <CollateralInfo collaterals={c.collaterals} />

        {/* 7. Legal Status */}
        <LegalStatus c={c} />

        {/* Proposals */}
        {c.proposals.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <ProposalList proposals={c.proposals} collaterals={c.collaterals} />
          </div>
        )}
      </div>
    </div>
  );
}
