import { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { STRATEGY_LABELS, STAGE_LABELS } from '../../types';
import type { Case } from '../../types';

type ViewTab = 'segmentation' | 'map' | 'list';

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function lastContactDays(c: Case): number {
  const calls = c.interactions.filter((i) => i.type === 'call');
  if (calls.length === 0) return 9999;
  const latest = calls.reduce((a, b) => (a.created_at > b.created_at ? a : b));
  return daysSince(latest.created_at);
}

interface SegBucket {
  label: string;
  color: string;
  filter: (c: Case) => boolean;
}

const BUCKETS: SegBucket[] = [
  { label: 'Deals Activos', color: 'bg-blue-500', filter: (c) => c.proposals.some((p) => p.probability === 'deals' && !p.cancelled_at) },
  { label: 'Focus Activos', color: 'bg-amber-500', filter: (c) => c.proposals.some((p) => p.probability === 'focus' && !p.cancelled_at) },
  { label: 'Pre-Pipe Realista', color: 'bg-emerald-500', filter: (c) => c.proposals.some((p) => p.probability === 'pre_pipe' && !p.cancelled_at) },
  { label: 'Cerca de Subasta', color: 'bg-red-500', filter: (c) => c.auction_date !== null && daysSince(c.auction_date!) < 0 && Math.abs(daysSince(c.auction_date!)) <= 90 },
  { label: 'Alto CUN', color: 'bg-red-400', filter: (c) => c.interactions.filter((i) => i.call_result === 'cun').length >= 5 },
  { label: 'Sin Contactar', color: 'bg-slate-600', filter: (c) => lastContactDays(c) === 9999 },
  { label: 'Contactados >30d', color: 'bg-slate-400', filter: (c) => { const d = lastContactDays(c); return d > 30 && d < 9999; } },
  { label: 'Contactados <30d', color: 'bg-emerald-400', filter: (c) => lastContactDays(c) <= 30 && lastContactDays(c) < 9999 },
  { label: 'Resueltos', color: 'bg-emerald-700', filter: (c) => c.stage === 'resolved' },
];

export default function PerimeterView() {
  const { cases, openGroup } = useCrm();
  const [tab, setTab] = useState<ViewTab>('segmentation');
  const [selectedBucket, setSelectedBucket] = useState<string | null>(null);

  const nonResolved = cases.filter((c) => c.stage !== 'resolved');

  const bucketData = useMemo(() => {
    return BUCKETS.map((b) => ({
      ...b,
      cases: cases.filter(b.filter),
      count: cases.filter(b.filter).length,
    }));
  }, [cases]);

  const filteredCases = selectedBucket
    ? bucketData.find((b) => b.label === selectedBucket)?.cases || []
    : nonResolved;

  const totalDebt = filteredCases.reduce((s, c) => s + c.loans.reduce((ls, l) => ls + l.total_debt, 0), 0);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#002446] tracking-tight">Mi Perimetro</h1>
            <p className="text-sm text-slate-500">
              {nonResolved.length} expedientes activos - Deuda total: {(totalDebt / 1_000_000).toFixed(1)}M EUR
            </p>
          </div>
          {/* View Toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {([['segmentation', 'Segmentacion'], ['map', 'Mapa'], ['list', 'Lista']] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${tab === key ? 'bg-white text-[#002446] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {tab === 'segmentation' && (
          <>
            {/* Segmentation Buckets */}
            <div className="grid grid-cols-3 gap-3">
              {bucketData.map((b) => (
                <button
                  key={b.label}
                  onClick={() => setSelectedBucket(selectedBucket === b.label ? null : b.label)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    selectedBucket === b.label
                      ? 'border-[#1a61a6] ring-2 ring-[#1a61a6]/20 bg-[#1a61a6]/5'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-sm ${b.color}`} />
                    <span className="text-xs font-medium text-slate-700">{b.label}</span>
                  </div>
                  <span className="text-lg font-black text-[#002446]">{b.count}</span>
                </button>
              ))}
            </div>

            {/* Bar Chart Distribution */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#002446] mb-4">Distribucion</h3>
              <div className="flex gap-1 h-8 rounded-lg overflow-hidden">
                {bucketData.filter((b) => b.count > 0).map((b) => (
                  <div
                    key={b.label}
                    className={`${b.color} transition-all hover:opacity-80`}
                    style={{ width: `${(b.count / Math.max(1, cases.length)) * 100}%` }}
                    title={`${b.label}: ${b.count}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {bucketData.filter((b) => b.count > 0).map((b) => (
                  <div key={b.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-sm ${b.color}`} />
                    <span className="text-[9px] text-slate-500">{b.label} ({b.count})</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'map' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="h-[500px] bg-slate-100 flex items-center justify-center">
              <div className="text-center">
                <svg className="w-16 h-16 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <p className="text-sm font-bold text-slate-400">Mapa de Espana</p>
                <p className="text-xs text-slate-400">Integracion con mapa interactivo pendiente</p>
                <p className="text-[10px] text-slate-300 mt-2">{nonResolved.filter((c) => c.collaterals.some((col) => col.latitude)).length} garantias con geolocalizacion</p>
              </div>
            </div>
          </div>
        )}

        {/* Case List (shown in segmentation when bucket selected, or in list tab) */}
        {(tab === 'list' || (tab === 'segmentation' && selectedBucket)) && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">
                {selectedBucket ? `${selectedBucket} (${filteredCases.length})` : `Todos los expedientes (${filteredCases.length})`}
              </h3>
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-5 py-3">Expediente</th>
                    <th className="px-5 py-3">Deudor</th>
                    <th className="px-5 py-3">Estrategia</th>
                    <th className="px-5 py-3">Fase</th>
                    <th className="px-5 py-3 text-right">Deuda Total</th>
                    <th className="px-5 py-3">Ult. Contacto</th>
                    <th className="px-5 py-3">Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredCases.map((c) => {
                    const borrower = c.parties.find((p) => p.role === 'borrower');
                    const debt = c.loans.reduce((s, l) => s + l.total_debt, 0);
                    const days = lastContactDays(c);
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openGroup(c.group_id || c.id)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3 font-bold text-[#1a61a6]">{c.reference}</td>
                        <td className="px-5 py-3 text-slate-700">{borrower?.name || '-'}</td>
                        <td className="px-5 py-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {STRATEGY_LABELS[c.strategy]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-500">{STAGE_LABELS[c.stage]}</td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">
                          {debt.toLocaleString('es-ES')} EUR
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium ${days > 30 ? 'text-red-600' : days === 9999 ? 'text-slate-400' : 'text-slate-600'}`}>
                            {days === 9999 ? 'Nunca' : `${days}d`}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.legal_status === 'judicial' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                            {c.legal_status === 'judicial' ? 'Judicial' : 'Extrajudicial'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
