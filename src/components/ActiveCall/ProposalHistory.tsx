import type { Proposal } from '../../types';
import { STRATEGY_LABELS, PROBABILITY_LABELS } from '../../types';

interface Props {
  proposals: Proposal[];
}

const PROB_COLORS: Record<string, string> = {
  deals: 'bg-blue-600 text-white',
  focus: 'bg-amber-500 text-white',
  pre_pipe: 'bg-slate-400 text-white',
  firmada: 'bg-emerald-600 text-white',
  cancelled: 'bg-red-100 text-red-700',
};

export default function ProposalHistory({ proposals }: Props) {
  if (proposals.length === 0) {
    return <p className="text-[10px] text-slate-400 italic">Sin propuestas</p>;
  }

  const active = proposals.filter((p) => !p.cancelled_at);
  const cancelled = proposals.filter((p) => p.cancelled_at);

  return (
    <div className="space-y-3">
      {active.map((p) => (
        <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-[#1a61a6]/30 transition-colors">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-bold text-xs text-slate-800">{STRATEGY_LABELS[p.strategy_type]}</span>
              <div className="text-[9px] text-slate-500 mt-0.5">
                {p.amount.toLocaleString('es-ES')} EUR
                {p.payment_terms === 'installments' && p.installment_count
                  ? ` - ${p.installment_count} plazos`
                  : ' - Pago unico'}
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-tight ${PROB_COLORS[p.probability] || 'bg-slate-100 text-slate-600'}`}>
              {PROBABILITY_LABELS[p.probability]}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[9px] text-slate-400">
              Cierre: {p.expected_closing_date}
            </span>
            <span className="text-[9px] font-bold text-[#1a61a6] cursor-pointer hover:underline">
              Detalle
            </span>
          </div>
        </div>
      ))}
      {cancelled.map((p) => (
        <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm opacity-60">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="font-bold text-xs text-slate-800 line-through">{STRATEGY_LABELS[p.strategy_type]}</span>
              <div className="text-[9px] text-slate-500 mt-0.5">{p.amount.toLocaleString('es-ES')} EUR</div>
            </div>
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase">
              Cancelada
            </span>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[9px] text-slate-400">{p.cancelled_at}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
