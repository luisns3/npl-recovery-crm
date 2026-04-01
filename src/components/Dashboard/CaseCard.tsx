import type { Case } from '../../types';
import { useCrm } from '../../context/CrmContext';
import { daysSinceLastInteraction, activeAlertCount } from '../../utils/priorityQueue';

export default function CaseCard({ c }: { c: Case }) {
  const { openCase } = useCrm();
  const borrower = c.parties.find((p) => p.role === 'borrower');
  const totalDebt = c.loans.reduce((sum, l) => sum + l.outstandingAmount, 0);
  const days = daysSinceLastInteraction(c);
  const alerts = activeAlertCount(c);

  return (
    <button
      onClick={() => openCase(c.id)}
      className="w-full text-left bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-900 truncate">{borrower?.name || c.reference}</span>
        {alerts > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />}
      </div>
      <div className="text-xs text-gray-500 mb-2">{c.reference}</div>
      <div className="flex flex-wrap gap-1.5">
        <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-medium">{c.strategy}</span>
        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{(totalDebt / 1000).toFixed(0)}k</span>
        {days < 9999 && (
          <span className={`text-xs px-1.5 py-0.5 rounded ${days > 30 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {days}d
          </span>
        )}
      </div>
    </button>
  );
}
