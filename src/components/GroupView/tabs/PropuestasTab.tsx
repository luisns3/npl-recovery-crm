import { useMemo, useState } from 'react';
import type { Proposal } from '../../../types';
import { STRATEGY_LABELS, PROBABILITY_LABELS } from '../../../types';

interface Props {
  allProposals: Proposal[];
}

const PROB_COLORS: Record<string, string> = {
  firmada: '#059669',
  deals: '#2563eb',
  focus: '#d97706',
  pre_pipe: '#94a3b8',
  cancelled: '#fda4af',
};

const PROB_BADGE: Record<string, string> = {
  firmada: 'bg-emerald-600 text-white',
  deals: 'bg-blue-600 text-white',
  focus: 'bg-amber-500 text-white',
  pre_pipe: 'bg-slate-400 text-white',
  cancelled: 'bg-red-100 text-red-700',
};

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonthLabel(key: string) {
  const [y, m] = key.split('-');
  return new Date(parseInt(y), parseInt(m) - 1, 1).toLocaleString('es-ES', { month: 'short', year: '2-digit' });
}

export default function PropuestasTab({ allProposals }: Props) {
  const [showCancelled, setShowCancelled] = useState(false);

  const active = allProposals.filter((p) => !p.cancelled_at);
  const cancelled = allProposals.filter((p) => p.cancelled_at);

  // Monthly chart: group active proposals by expected_closing_date
  const chartData = useMemo(() => {
    const buckets = new Map<string, Record<string, number>>();
    for (const p of allProposals) {
      if (!p.expected_closing_date) continue;
      const key = getMonthKey(p.expected_closing_date);
      if (!buckets.has(key)) buckets.set(key, { firmada: 0, deals: 0, focus: 0, pre_pipe: 0, cancelled: 0 });
      buckets.get(key)![p.probability] = (buckets.get(key)![p.probability] || 0) + p.amount;
    }
    return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-9);
  }, [allProposals]);

  const maxVal = Math.max(1, ...chartData.map(([, v]) => Object.values(v).reduce((a, b) => a + b, 0)));
  const PROB_ORDER = ['firmada', 'deals', 'focus', 'pre_pipe', 'cancelled'];

  return (
    <div className="p-5 space-y-5">
      {/* Monthly Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="mb-4">
          <h3 className="text-xs font-bold text-[#002446]">Propuestas por Mes</h3>
          <p className="text-[10px] text-slate-400 mt-0.5">Importe esperado de cierre (€)</p>
        </div>

        {chartData.length === 0 ? (
          <div className="h-28 flex items-center justify-center text-xs text-slate-400 italic">Sin propuestas con fecha de cierre</div>
        ) : (
          <>
            <div className="flex items-end gap-1.5 h-32">
              {chartData.map(([key, values]) => {
                const total = PROB_ORDER.reduce((s, p) => s + (values[p] || 0), 0);
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ height: `${Math.max(4, (total / maxVal) * 112)}px` }}>
                      {PROB_ORDER.map((prob) =>
                        (values[prob] || 0) > 0 ? (
                          <div
                            key={prob}
                            title={`${PROBABILITY_LABELS[prob as keyof typeof PROBABILITY_LABELS] || prob}: ${((values[prob] || 0) / 1000).toFixed(0)}k EUR`}
                            style={{ height: `${((values[prob] || 0) / total) * 100}%`, background: PROB_COLORS[prob] }}
                          />
                        ) : null
                      )}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#002446] text-white text-[9px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {(total / 1000).toFixed(0)}k EUR
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-slate-500 leading-none">{formatMonthLabel(key)}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
              {PROB_ORDER.filter((p) => chartData.some(([, v]) => (v[p] || 0) > 0)).map((p) => (
                <div key={p} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: PROB_COLORS[p] }} />
                  <span className="text-[9px] text-slate-500">{PROBABILITY_LABELS[p as keyof typeof PROBABILITY_LABELS] || p}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Active Proposals */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#002446]">
            Propuestas Activas
            <span className="ml-2 bg-[#1a61a6]/10 text-[#1a61a6] text-[9px] font-bold px-1.5 py-0.5 rounded">{active.length}</span>
          </h3>
          <button className="text-[10px] font-bold text-[#1a61a6] flex items-center gap-1 hover:underline">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nueva propuesta
          </button>
        </div>

        {active.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-slate-400">Sin propuestas activas</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {active.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-start gap-4 hover:bg-slate-50/50 group">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-bold text-slate-800">{STRATEGY_LABELS[p.strategy_type]}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${PROB_BADGE[p.probability] || 'bg-slate-100 text-slate-600'}`}>
                      {PROBABILITY_LABELS[p.probability]}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="font-bold text-slate-900">{p.amount.toLocaleString('es-ES')} EUR</span>
                    <span>
                      {p.payment_terms === 'installments' && p.installment_count
                        ? `${p.installment_count} plazos${p.installment_frequency ? ` ${p.installment_frequency === 'monthly' ? 'mensuales' : 'trimestrales'}` : ''}`
                        : 'Pago único'}
                    </span>
                    <span>Cierre: {p.expected_closing_date}</span>
                  </div>
                </div>
                <button className="text-[9px] font-bold text-[#1a61a6] opacity-0 group-hover:opacity-100 transition-opacity hover:underline shrink-0">
                  Editar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancelled Proposals */}
      {cancelled.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowCancelled(!showCancelled)}
            className="w-full px-5 py-3 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
          >
            <h3 className="text-xs font-bold text-slate-400">
              Propuestas Canceladas
              <span className="ml-2 bg-red-50 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded">{cancelled.length}</span>
            </h3>
            <svg className={`w-4 h-4 text-slate-400 transition-transform ${showCancelled ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showCancelled && (
            <div className="divide-y divide-slate-50 opacity-70">
              {cancelled.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-500 line-through">{STRATEGY_LABELS[p.strategy_type]}</span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {p.amount.toLocaleString('es-ES')} EUR · Cancelada {p.cancelled_at?.slice(0, 10)}
                    </div>
                  </div>
                  <span className="bg-red-100 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0">Cancelada</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
