import type { Loan } from '../../types';

export default function DebtSummary({ loans }: { loans: Loan[] }) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Debt Summary</h3>
      <div className="space-y-1.5">
        {loans.map((l) => (
          <div key={l.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">Loan {l.id.toUpperCase()}</span>
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900">{l.outstandingAmount.toLocaleString('es-ES')} EUR</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600">{l.strategy}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
