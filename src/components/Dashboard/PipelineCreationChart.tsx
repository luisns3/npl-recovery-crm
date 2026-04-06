import { useMemo } from 'react';
import type { Proposal } from '../../types';

interface ProposalWithMeta extends Proposal {
  case_ref: string;
  borrower: string;
}

interface Props {
  proposals: ProposalWithMeta[];
}

const PROB_COLORS: Record<string, string> = {
  firmada: '#059669',
  deals: '#2563eb',
  focus: '#d97706',
  pre_pipe: '#94a3b8',
  cancelled: '#fda4af',
};

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export default function PipelineCreationChart({ proposals }: Props) {
  const chartData = useMemo(() => {
    const buckets = new Map<string, Record<string, number>>();

    for (const p of proposals) {
      const key = getWeekKey(p.created_at);
      if (!buckets.has(key)) {
        buckets.set(key, { firmada: 0, deals: 0, focus: 0, pre_pipe: 0, cancelled: 0 });
      }
      buckets.get(key)![p.probability] += p.amount;
    }

    return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, [proposals]);

  const maxTotal = Math.max(1, ...chartData.map(([, v]) => Object.values(v).reduce((a, b) => a + b, 0)));
  const probOrder = ['firmada', 'deals', 'focus', 'pre_pipe', 'cancelled'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm h-full">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#002446]">Creacion de Pipeline</h3>
        <p className="text-[10px] text-slate-400">Propuestas creadas por semana</p>
      </div>

      <div className="flex items-end gap-1 h-48">
        {chartData.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
            Sin datos
          </div>
        )}
        {chartData.map(([key, values]) => {
          const total = probOrder.reduce((s, p) => s + (values[p] || 0), 0);
          return (
            <div key={key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md flex flex-col-reverse overflow-hidden"
                style={{ height: `${Math.max(4, (total / maxTotal) * 160)}px` }}
              >
                {probOrder.map((prob) => {
                  if (!values[prob] || values[prob] === 0) return null;
                  const pct = (values[prob] / total) * 100;
                  return (
                    <div
                      key={prob}
                      style={{ height: `${pct}%`, backgroundColor: PROB_COLORS[prob] || '#e2e8f0' }}
                    />
                  );
                })}
              </div>
              <span className="text-[7px] font-bold text-slate-500 leading-none">
                S{key.split('-W')[1]}
              </span>
            </div>
          );
        })}
      </div>

      {/* Cancelled legend */}
      <div className="flex gap-3 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#fda4af' }} />
          <span className="text-[9px] font-medium text-slate-500">Canceladas</span>
        </div>
      </div>
    </div>
  );
}
