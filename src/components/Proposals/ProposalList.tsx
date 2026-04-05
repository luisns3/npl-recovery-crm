import type { Proposal, Collateral } from '../../types';
import { PROBABILITY_LABELS, STRATEGY_LABELS } from '../../types';

interface Props {
  proposals: Proposal[];
  collaterals: Collateral[];
}

const PROB_COLORS: Record<string, string> = {
  deals: 'bg-green-100 text-green-700',
  focus: 'bg-blue-100 text-blue-700',
  pre_pipe: 'bg-yellow-100 text-yellow-700',
  firmada: 'bg-indigo-100 text-indigo-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function ProposalList({ proposals }: Props) {
  const active = proposals.filter((p) => !p.cancelled_at);
  const cancelled = proposals.filter((p) => p.cancelled_at);

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Proposals</h3>
      <div className="space-y-2">
        {active.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{STRATEGY_LABELS[p.strategy_type]}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PROB_COLORS[p.probability] || 'bg-gray-100 text-gray-600'}`}>
                {PROBABILITY_LABELS[p.probability]}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{p.amount.toLocaleString('es-ES')} EUR</span>
              <span>Close: {p.expected_closing_date}</span>
            </div>
          </div>
        ))}
        {cancelled.map((p) => (
          <div key={p.id} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm opacity-50">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 line-through">{STRATEGY_LABELS[p.strategy_type]}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">Cancelada</span>
            </div>
            <div className="text-xs text-gray-400">
              {p.cancelled_at}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
