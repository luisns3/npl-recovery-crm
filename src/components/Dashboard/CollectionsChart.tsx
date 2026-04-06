import { useState, useMemo } from 'react';
import type { Proposal, Probability } from '../../types';

interface ProposalWithMeta extends Proposal {
  case_ref: string;
  borrower: string;
}

interface Props {
  proposals: ProposalWithMeta[];
  selectedMonth: string | null;
  onMonthClick: (month: string) => void;
}

const PROB_COLORS: Record<Probability, string> = {
  firmada: '#059669',
  deals: '#2563eb',
  focus: '#d97706',
  pre_pipe: '#94a3b8',
  cancelled: '#fda4af',
};

const PROB_LABELS: Record<Probability, string> = {
  firmada: 'Firmada',
  deals: 'Deals',
  focus: 'Focus',
  pre_pipe: 'Pre-Pipe',
  cancelled: 'Cancelada',
};

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(m, 10) - 1]} ${y.slice(2)}`;
}

function getWeekLabel(yw: string): string {
  return `S${yw.split('-W')[1]}`;
}

function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, '0')}`;
}

export default function CollectionsChart({ proposals, selectedMonth, onMonthClick }: Props) {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  const active = proposals.filter((p) => !p.cancelled_at);

  const chartData = useMemo(() => {
    const buckets = new Map<string, Record<Probability, number>>();

    for (const p of active) {
      const date = p.expected_closing_date;
      if (!date) continue;
      const key = viewMode === 'monthly' ? date.slice(0, 7) : getWeekKey(date);
      if (!buckets.has(key)) {
        buckets.set(key, { firmada: 0, deals: 0, focus: 0, pre_pipe: 0, cancelled: 0 });
      }
      buckets.get(key)![p.probability] += p.amount;
    }

    const sorted = [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    return sorted;
  }, [active, viewMode]);

  const maxTotal = Math.max(1, ...chartData.map(([, v]) => Object.values(v).reduce((a, b) => a + b, 0)));
  const probOrder: Probability[] = ['firmada', 'deals', 'focus', 'pre_pipe'];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#002446]">Cobros por {viewMode === 'monthly' ? 'Mes' : 'Semana'}</h3>
          <p className="text-[10px] text-slate-400">Click en una barra para filtrar</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'monthly' ? 'bg-white text-[#002446] shadow-sm' : 'text-slate-500'}`}
          >
            Mensual
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${viewMode === 'weekly' ? 'bg-white text-[#002446] shadow-sm' : 'text-slate-500'}`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-48">
        {chartData.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400 italic">
            Sin datos de propuestas
          </div>
        )}
        {chartData.map(([key, values]) => {
          const total = probOrder.reduce((s, p) => s + values[p], 0);
          const isSelected = selectedMonth === key;
          return (
            <button
              key={key}
              onClick={() => viewMode === 'monthly' ? onMonthClick(key) : undefined}
              className={`flex-1 flex flex-col items-center gap-1 group transition-all ${isSelected ? 'opacity-100' : selectedMonth ? 'opacity-40' : 'opacity-100'}`}
            >
              <div
                className="w-full rounded-t-md flex flex-col-reverse overflow-hidden transition-all group-hover:ring-2 ring-[#1a61a6]/30"
                style={{ height: `${Math.max(4, (total / maxTotal) * 160)}px` }}
              >
                {probOrder.map((prob) => {
                  if (values[prob] === 0) return null;
                  const pct = (values[prob] / total) * 100;
                  return (
                    <div
                      key={prob}
                      style={{ height: `${pct}%`, backgroundColor: PROB_COLORS[prob] }}
                    />
                  );
                })}
              </div>
              <span className="text-[8px] font-bold text-slate-500 leading-none">
                {viewMode === 'monthly' ? getMonthLabel(key) : getWeekLabel(key)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 pt-3 border-t border-slate-100">
        {probOrder.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PROB_COLORS[p] }} />
            <span className="text-[9px] font-medium text-slate-500">{PROB_LABELS[p]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
