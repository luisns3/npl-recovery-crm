import type { Case } from '../../types';

export default function LegalStatus({ c }: { c: Case }) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Legal Status</h3>
      <div className="flex flex-wrap gap-2 text-sm">
        <span className={`px-2 py-1 rounded text-xs font-medium ${c.legalStatus === 'judicial' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {c.legalStatus === 'judicial' ? 'Judicial' : 'Non-judicial'}
        </span>
        {c.insolvencyStatus && (
          <span className="px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-700">{c.insolvencyStatus}</span>
        )}
        {!c.insolvencyStatus && <span className="text-xs text-gray-500 py-1">No insolvency</span>}
      </div>
    </div>
  );
}
