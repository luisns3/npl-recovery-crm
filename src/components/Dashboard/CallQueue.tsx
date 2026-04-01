import { useCrm } from '../../context/CrmContext';
import { daysSinceLastInteraction, activeAlertCount } from '../../utils/priorityQueue';

export default function CallQueue() {
  const { queue, startCalls, openCase } = useCrm();

  return (
    <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Call Queue</h2>
        <button
          onClick={startCalls}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm"
        >
          Start Calls
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {queue.map((c, idx) => {
          const days = daysSinceLastInteraction(c);
          const alerts = activeAlertCount(c);
          const borrower = c.parties.find((p) => p.role === 'borrower');
          const totalDebt = c.loans.reduce((sum, l) => sum + l.outstandingAmount, 0);

          return (
            <button
              key={c.id}
              onClick={() => openCase(c.id)}
              className="w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-indigo-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono w-5">{idx + 1}</span>
                  <span className="text-sm font-medium text-gray-900 truncate">{borrower?.name || c.reference}</span>
                </div>
              </div>
              <div className="ml-7 mt-1 flex flex-wrap gap-1.5">
                {days < 9999 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${days > 30 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {days}d ago
                  </span>
                )}
                {days === 9999 && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">No contact</span>}
                {alerts > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">{alerts} alert{alerts > 1 ? 's' : ''}</span>}
                <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">{c.strategy}</span>
                <span className="text-xs text-gray-500">{(totalDebt / 1000).toFixed(0)}k</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
