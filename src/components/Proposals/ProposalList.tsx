import type { Proposal, Collateral } from '../../types';

interface Props {
  proposals: Proposal[];
  collaterals: Collateral[];
}

const PROB_COLORS: Record<string, string> = {
  Deals: 'bg-green-100 text-green-700',
  Focus: 'bg-blue-100 text-blue-700',
  'Pre-Pipe': 'bg-yellow-100 text-yellow-700',
  Signed: 'bg-indigo-100 text-indigo-700',
  Cancelled: 'bg-gray-100 text-gray-400',
};

export default function ProposalList({ proposals, collaterals }: Props) {
  const active = proposals.filter((p) => !p.cancelledAt);
  const cancelled = proposals.filter((p) => p.cancelledAt);

  const getCollateralLabel = (id: string) => {
    const col = collaterals.find((c) => c.id === id);
    return col ? `${col.type} - ${col.address.split(',')[0]}` : id;
  };

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Proposals</h3>
      <div className="space-y-2">
        {active.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{p.strategyType}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PROB_COLORS[p.probability] || 'bg-gray-100 text-gray-600'}`}>
                {p.probability}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{getCollateralLabel(p.collateralId)}</span>
              <span>Sign: {p.estimatedSigningDate}</span>
            </div>
          </div>
        ))}
        {cancelled.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm opacity-50">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 line-through">{p.strategyType}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">Cancelled</span>
            </div>
            <div className="text-xs text-gray-400">
              {p.cancelledAt}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
