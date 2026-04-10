import { useState, useMemo } from 'react';
import type { Proposal } from '../../types';

interface ProposalWithMeta extends Proposal {
  case_ref: string;
  borrower: string;
}

interface Props {
  proposals: ProposalWithMeta[];         // filtered proposals (for bar amounts)
  allProposals: ProposalWithMeta[];      // unfiltered (for axis range — keeps zero months visible)
  selectedMonth: string | null;
  onMonthClick: (month: string) => void;
}

// Firmada=teal, Deals=dark slate, Focus=medium slate, Pre-pipe=light gray
const COLORS = {
  firmada: '#0d9488',
  deals:   '#334155',
  focus:   '#64748b',
  pre_pipe: '#cbd5e1',
  empty:   '#e2e8f0',
};

const LEGEND = [
  { key: 'firmada',  label: 'Firmada',  color: COLORS.firmada },
  { key: 'deals',    label: 'Deals',    color: COLORS.deals },
  { key: 'focus',    label: 'Focus',    color: COLORS.focus },
  { key: 'pre_pipe', label: 'Pre-Pipe', color: COLORS.pre_pipe },
] as const;

function getMonthLabel(ym: string): string {
  const [y, m] = ym.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${months[parseInt(m, 10) - 1]}-${y.slice(2)}`;
}

function getSundayKey(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() - d.getDay()); // roll back to Sunday
  return d.toISOString().slice(0, 10);
}

function getSundayLabel(dateStr: string): string {
  const parts = dateStr.split('-');
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${parseInt(parts[2])}/${months[parseInt(parts[1]) - 1]}`;
}

function advanceMonth(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

function formatTarget(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString('es-ES');
}

type Bucket = { firmada: number; deals: number; focus: number; pre_pipe: number };
const EMPTY_BUCKET: Bucket = { firmada: 0, deals: 0, focus: 0, pre_pipe: 0 };

const MAX_BAR_HEIGHT = 140;
const COL_HEIGHT = 210; // total column height including % label + spacer + target text + bar + date

export default function CollectionsChart({ proposals, allProposals, selectedMonth, onMonthClick }: Props) {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly');

  const active = proposals.filter((p) => !p.cancelled_at);
  const allActive = allProposals.filter((p) => !p.cancelled_at);

  // Axis periods — derived from ALL proposals so zero months stay visible when filtered
  const periods = useMemo(() => {
    const keys = new Set<string>();
    for (const p of allActive) {
      const date = p.expected_closing_date;
      if (!date) continue;
      keys.add(viewMode === 'monthly' ? date.slice(0, 7) : getSundayKey(date));
    }
    const sorted = [...keys].sort();
    if (sorted.length === 0) return [] as string[];

    if (viewMode === 'monthly') {
      // Fill contiguous month gaps
      const filled: string[] = [];
      let cur = sorted[0];
      const last = sorted[sorted.length - 1];
      while (cur <= last) {
        filled.push(cur);
        cur = advanceMonth(cur);
      }
      return filled;
    }
    return sorted;
  }, [allActive, viewMode]);

  // Max scale — use all proposals so scale stays stable while filtering
  const allAmounts = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const p of allActive) {
      const date = p.expected_closing_date;
      if (!date) continue;
      const key = viewMode === 'monthly' ? date.slice(0, 7) : getSundayKey(date);
      if (!map.has(key)) map.set(key, { ...EMPTY_BUCKET });
      const b = map.get(key)!;
      if (p.probability === 'firmada') b.firmada += p.amount;
      else if (p.probability === 'deals') b.deals += p.amount;
      else if (p.probability === 'focus') b.focus += p.amount;
      else if (p.probability === 'pre_pipe') b.pre_pipe += p.amount;
    }
    return map;
  }, [allActive, viewMode]);

  const maxTotal = useMemo(() => {
    let m = 1;
    for (const b of allAmounts.values()) {
      m = Math.max(m, b.firmada + b.deals + b.focus + b.pre_pipe);
    }
    return m;
  }, [allAmounts]);

  // Filtered amounts (for bar heights)
  const filteredAmounts = useMemo(() => {
    const map = new Map<string, Bucket>();
    for (const p of active) {
      const date = p.expected_closing_date;
      if (!date) continue;
      const key = viewMode === 'monthly' ? date.slice(0, 7) : getSundayKey(date);
      if (!map.has(key)) map.set(key, { ...EMPTY_BUCKET });
      const b = map.get(key)!;
      if (p.probability === 'firmada') b.firmada += p.amount;
      else if (p.probability === 'deals') b.deals += p.amount;
      else if (p.probability === 'focus') b.focus += p.amount;
      else if (p.probability === 'pre_pipe') b.pre_pipe += p.amount;
    }
    return map;
  }, [active, viewMode]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-[#002446]">
            Cobros por {viewMode === 'monthly' ? 'Mes' : 'Semana'}
          </h3>
          <p className="text-[10px] text-slate-400">Click en una barra para filtrar</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
              viewMode === 'monthly' ? 'bg-white text-[#002446] shadow-sm' : 'text-slate-500'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
              viewMode === 'weekly' ? 'bg-white text-[#002446] shadow-sm' : 'text-slate-500'
            }`}
          >
            Semanal
          </button>
        </div>
      </div>

      {/* Chart */}
      {periods.length === 0 ? (
        <div
          className="flex items-center justify-center text-xs text-slate-400 italic"
          style={{ height: COL_HEIGHT }}
        >
          Sin datos de propuestas
        </div>
      ) : (
        <div className="flex items-end gap-1 w-full" style={{ height: COL_HEIGHT }}>
          {periods.map((key) => {
            const vals = filteredAmounts.get(key) ?? { ...EMPTY_BUCKET };
            const total = vals.firmada + vals.deals + vals.focus + vals.pre_pipe;

            // Use allAmounts for the total (unfiltered) to compute target
            const allVals = allAmounts.get(key) ?? { ...EMPTY_BUCKET };
            const allTotal = allVals.firmada + allVals.deals + allVals.focus + allVals.pre_pipe;

            const pct = allTotal > 0 ? Math.round((allVals.firmada / allTotal) * 100) : 0;
            const barHeight = total > 0 ? Math.max(6, (total / maxTotal) * MAX_BAR_HEIGHT) : 6;

            const isSelected = selectedMonth === key;
            const isFiltered = !!selectedMonth && !isSelected;

            // Segment heights in px
            const firmedaPx = total > 0 ? (vals.firmada / total) * barHeight : 0;
            const dealsPx   = total > 0 ? (vals.deals   / total) * barHeight : 0;
            const focusPx   = total > 0 ? (vals.focus   / total) * barHeight : 0;
            const prePipePx = total > 0 ? (vals.pre_pipe / total) * barHeight : 0;

            return (
              <button
                key={key}
                onClick={() => viewMode === 'monthly' ? onMonthClick(key) : undefined}
                className={`flex-1 flex flex-col items-center transition-opacity ${
                  isFiltered ? 'opacity-30' : 'opacity-100'
                }`}
                style={{ height: COL_HEIGHT }}
              >
                {/* % achievement at top */}
                <span className="text-[8px] font-black text-slate-600 leading-none mb-0.5">
                  {allTotal > 0 ? `${pct}%` : '—'}
                </span>

                {/* Spacer pushes bar to bottom */}
                <div className="flex-1" />

                {/* Target (unfiltered total) in red */}
                <span className="text-[8px] font-bold text-red-500 leading-none mb-1">
                  {allTotal > 0 ? formatTarget(allTotal) : ''}
                </span>

                {/* Stacked bar — top to bottom: pre_pipe, focus, deals, firmada */}
                <div
                  className={`w-full flex flex-col overflow-hidden rounded-t-sm transition-all ${
                    isSelected ? 'ring-2 ring-[#0d9488]' : 'hover:brightness-95'
                  }`}
                  style={{ height: barHeight }}
                >
                  {total === 0 ? (
                    <div style={{ flex: 1, backgroundColor: COLORS.empty }} />
                  ) : (
                    <>
                      {prePipePx > 0 && (
                        <div style={{ height: prePipePx, backgroundColor: COLORS.pre_pipe }} />
                      )}
                      {focusPx > 0 && (
                        <div style={{ height: focusPx, backgroundColor: COLORS.focus }} />
                      )}
                      {dealsPx > 0 && (
                        <div style={{ height: dealsPx, backgroundColor: COLORS.deals }} />
                      )}
                      {firmedaPx > 0 && (
                        <div style={{ height: firmedaPx, backgroundColor: COLORS.firmada }} />
                      )}
                    </>
                  )}
                </div>

                {/* Date label */}
                <span className="text-[8px] font-bold text-slate-500 mt-1 leading-none">
                  {viewMode === 'monthly' ? getMonthLabel(key) : getSundayLabel(key)}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-slate-100">
        {LEGEND.map(({ key, label, color }) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[9px] font-medium text-slate-500">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[9px] font-bold text-red-500">■</span>
          <span className="text-[9px] font-medium text-slate-500">Target</span>
          <span className="text-[9px] font-black text-slate-600 ml-1">%</span>
          <span className="text-[9px] font-medium text-slate-500">Logro (firmada/total)</span>
        </div>
      </div>
    </div>
  );
}
