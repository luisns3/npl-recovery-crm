import { useRef, useEffect, useMemo } from 'react';
import type { Interaction, Proposal } from '../../types';

interface Props {
  allInteractions: Interaction[];
  allProposals: Proposal[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const COL_W      = 48;   // px per week column
const BAR_ZONE_H = 100;  // height of proposal bar area (px)
const LABEL_H    = 40;   // height of rotated week-label area (px)
const CHART_H    = 270;  // total chart height (px)

// ─── Week helpers ─────────────────────────────────────────────────────────────
// Each week is identified by its ending Sunday (Mon–Sun weeks)
function getWeekSunday(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sun
  d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
  return d.toISOString().slice(0, 10);
}

function addWeeks(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n * 7);
  return d.toISOString().slice(0, 10);
}

function fmtLabel(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
  });
}

function fmtAmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString('es-ES');
}

// ─── Interaction type config ──────────────────────────────────────────────────
const TYPE_CFG: Record<string, { short: string; bg: string; text: string; label: string }> = {
  cup:           { short: 'CUP', bg: 'bg-emerald-500', text: 'text-white',     label: 'CUP' },
  cun:           { short: 'CUN', bg: 'bg-amber-400',   text: 'text-white',     label: 'CUN' },
  not_answering: { short: 'N/C', bg: 'bg-slate-400',   text: 'text-white',     label: 'No contesta' },
  voicemail:     { short: 'BUZ', bg: 'bg-slate-300',   text: 'text-slate-600', label: 'Buzón' },
  callback:      { short: 'REL', bg: 'bg-sky-400',     text: 'text-white',     label: 'Rellamada' },
  refused:       { short: 'REC', bg: 'bg-red-400',     text: 'text-white',     label: 'Rechaza' },
  wrong_number:  { short: 'EQV', bg: 'bg-gray-300',    text: 'text-gray-700',  label: 'Equivocado' },
  third_party:   { short: '3RO', bg: 'bg-violet-400',  text: 'text-white',     label: 'Tercero' },
  note:          { short: 'NTA', bg: 'bg-indigo-400',  text: 'text-white',     label: 'Nota' },
  visit:         { short: 'VIS', bg: 'bg-teal-400',    text: 'text-white',     label: 'Visita' },
};

// Dot colour = highest-priority type present in the week
const DOT_PRIORITY = ['cup', 'visit', 'cun', 'note', 'callback', 'refused', 'not_answering', 'voicemail', 'third_party', 'wrong_number'];

function dotBg(byType: Record<string, number>): string {
  for (const k of DOT_PRIORITY) {
    if ((byType[k] ?? 0) > 0) return TYPE_CFG[k]?.bg ?? 'bg-slate-400';
  }
  return 'bg-slate-400';
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function GroupTimelineChart({ allInteractions, allProposals }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentSunday = useMemo(() => getWeekSunday(new Date()), []);

  // Build 2-year weekly axis ending at the current week
  const weeks = useMemo(() => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const start = getWeekSunday(twoYearsAgo);
    const list: string[] = [];
    let w = start;
    while (w <= currentSunday) {
      list.push(w);
      w = addWeeks(w, 1);
    }
    return list;
  }, [currentSunday]);

  // Group interactions by week-sunday → { type_key: count }
  const ixByWeek = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const ix of allInteractions) {
      const wk = getWeekSunday(new Date(ix.created_at));
      if (!map[wk]) map[wk] = {};
      const key = ix.type === 'call' ? (ix.call_result ?? 'not_answering') : ix.type;
      map[wk][key] = (map[wk][key] ?? 0) + 1;
    }
    return map;
  }, [allInteractions]);

  // Group active proposal amounts by week-sunday
  const propByWeek = useMemo(() => {
    const map: Record<string, number> = {};
    for (const p of allProposals) {
      if (p.cancelled_at) continue;
      const wk = getWeekSunday(new Date(p.created_at));
      map[wk] = (map[wk] ?? 0) + p.amount;
    }
    return map;
  }, [allProposals]);

  const maxAmt = useMemo(() => Math.max(1, ...Object.values(propByWeek)), [propByWeek]);

  // Auto-scroll to centre current week on mount
  const currentIdx = weeks.indexOf(currentSunday);
  useEffect(() => {
    if (!scrollRef.current || currentIdx < 0) return;
    const cw = scrollRef.current.clientWidth;
    scrollRef.current.scrollLeft = Math.max(0, currentIdx * COL_W - cw / 2 + COL_W / 2);
  }, [currentIdx]);

  const totalW = weeks.length * COL_W;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
        <svg className="w-4 h-4 text-[#1a61a6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Evolución del Expediente</h3>

        {/* Legend */}
        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {Object.entries(TYPE_CFG).map(([key, cfg]) => (
            <span key={key} className="flex items-center gap-1 text-[8px] text-slate-500 leading-none">
              <span className={`w-2 h-2 rounded-sm inline-block shrink-0 ${cfg.bg}`} />
              {cfg.label}
            </span>
          ))}
          <span className="flex items-center gap-1 text-[8px] text-slate-500 border-l border-slate-200 pl-2 leading-none">
            <span className="w-2 h-3 rounded-sm inline-block bg-[#1a61a6]/80 shrink-0" />
            Propuestas
          </span>
        </div>
      </div>

      {/* ── Scrollable chart ────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="overflow-x-auto custom-scrollbar">
        <div className="relative" style={{ width: totalW, height: CHART_H }}>

          {/* Grid lines inside bar zone */}
          {[0, 50, 100].map(pct => (
            <div
              key={pct}
              className="absolute left-0 border-t border-slate-100 pointer-events-none"
              style={{ top: BAR_ZONE_H - Math.round((pct / 100) * (BAR_ZONE_H - 10)), width: totalW }}
            />
          ))}

          {/* Separator between bar zone and activity zone */}
          <div
            className="absolute left-0 border-t-2 border-slate-200 pointer-events-none"
            style={{ top: BAR_ZONE_H, width: totalW }}
          />

          {/* Week columns */}
          {weeks.map((week, i) => {
            const byType  = ixByWeek[week] ?? {};
            const total   = Object.values(byType).reduce((s, n) => s + n, 0);
            const amt     = propByWeek[week] ?? 0;
            const barH    = amt > 0 ? Math.max(6, (amt / maxAmt) * (BAR_ZONE_H - 14)) : 0;
            const isCurrent = week === currentSunday;
            const pills   = Object.entries(byType).filter(([, c]) => c > 0);

            // Is this the first week of a new month? (used for subtle month marker)
            const prevWeek = i > 0 ? weeks[i - 1] : null;
            const isMonthStart = prevWeek
              ? new Date(week + 'T00:00:00').getMonth() !== new Date(prevWeek + 'T00:00:00').getMonth()
              : false;

            return (
              <div
                key={week}
                className={`absolute flex flex-col ${isCurrent ? 'bg-sky-50' : ''}`}
                style={{ left: i * COL_W, width: COL_W, top: 0, height: CHART_H }}
              >
                {/* Month marker: thin top border on month-start columns */}
                {isMonthStart && (
                  <div className="absolute top-0 left-0 w-px bg-slate-300" style={{ height: CHART_H }} />
                )}

                {/* ── Bar zone ─────────────────────────────────────────── */}
                <div
                  className="relative flex items-end justify-center shrink-0 pb-[3px]"
                  style={{ height: BAR_ZONE_H }}
                >
                  {barH > 0 && (
                    <div className="relative" style={{ width: 26 }}>
                      <div
                        className="w-full rounded-t bg-[#1a61a6]/70 hover:bg-[#1a61a6] transition-colors cursor-default"
                        style={{ height: barH }}
                        title={`Propuestas: ${amt.toLocaleString('es-ES')} €`}
                      />
                      {/* Amount label above bar (only if bar is tall enough) */}
                      {barH >= 18 && (
                        <div className="absolute left-1/2 -translate-x-1/2 text-[7px] font-bold text-[#002446] whitespace-nowrap"
                          style={{ bottom: barH + 2 }}>
                          {fmtAmt(amt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Activity zone ─────────────────────────────────────── */}
                <div className="flex flex-col items-center pt-[6px] gap-[3px] flex-1 overflow-hidden">
                  {/* Fixed-size dot with total count */}
                  {total > 0 ? (
                    <div
                      title={pills.map(([t, c]) => `${TYPE_CFG[t]?.label ?? t}: ${c}`).join(' · ')}
                      className={`w-[20px] h-[20px] rounded-full flex items-center justify-center text-[8px] font-black text-white cursor-default shrink-0 ${dotBg(byType)}`}
                    >
                      {total}
                    </div>
                  ) : (
                    <div className="w-[20px] h-[20px] rounded-full border border-dashed border-slate-200 shrink-0" />
                  )}

                  {/* Type breakdown pills */}
                  <div className="flex flex-wrap justify-center gap-[2px] px-[2px]">
                    {pills.map(([type, count]) => {
                      const cfg = TYPE_CFG[type];
                      if (!cfg) return null;
                      return (
                        <span
                          key={type}
                          title={`${cfg.label}: ${count}`}
                          className={`text-[6px] font-bold rounded leading-[10px] px-[2px] ${cfg.bg} ${cfg.text}`}
                        >
                          {cfg.short}{count > 1 ? <>&thinsp;{count}</> : ''}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* ── Week label (rotated) ──────────────────────────────── */}
                <div
                  className={`shrink-0 flex items-center justify-center ${
                    isCurrent ? 'text-[#1a61a6] font-black' : 'text-slate-400 font-bold'
                  }`}
                  style={{ height: LABEL_H, fontSize: 7 }}
                >
                  <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', letterSpacing: '0.03em' }}>
                    {fmtLabel(week)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
