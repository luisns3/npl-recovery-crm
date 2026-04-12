import { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { STRATEGY_LABELS } from '../../types';
import type { Case } from '../../types';
import {
  classifyGroup,
  BUCKET_META,
  BUCKET_ORDER,
  PARENT_LABELS,
  DEFAULT_SEGMENTATION_CONFIG,
} from '../../utils/segmentation';
import type { BucketId, SegmentationConfig } from '../../utils/segmentation';

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

// Group bucket IDs by their top-level parent (first segment of the id)
const TOP_LEVEL_PARENTS = ['0', '1', '2', '3', '4', '5', '6', '7'];

function getTopLevelParent(bucketId: BucketId): string {
  return bucketId.split('.')[0];
}

export default function PerimeterView() {
  const { cases, openGroup } = useCrm();
  const [tab, setTab] = useState<ViewTab>('segmentation');
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<BucketId | null>(null);

  const config: SegmentationConfig = DEFAULT_SEGMENTATION_CONFIG;

  // Classify every case once
  const classified = useMemo(() => {
    return cases.map((c) => ({ case: c, bucket: classifyGroup(c, DEFAULT_SEGMENTATION_CONFIG) }));
  }, [cases]);

  // Count per bucket ID
  const bucketCounts = useMemo(() => {
    const counts: Partial<Record<BucketId, number>> = {};
    for (const { bucket } of classified) {
      counts[bucket] = (counts[bucket] ?? 0) + 1;
    }
    return counts;
  }, [classified]);

  // Count per top-level parent
  const parentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const parent of TOP_LEVEL_PARENTS) counts[parent] = 0;
    for (const { bucket } of classified) {
      const parent = getTopLevelParent(bucket);
      counts[parent] = (counts[parent] ?? 0) + 1;
    }
    return counts;
  }, [classified]);

  // Sub-buckets visible when a parent is selected
  const visibleSubBuckets = useMemo<BucketId[]>(() => {
    if (!selectedParent) return [];
    return BUCKET_ORDER.filter(
      (id) => getTopLevelParent(id) === selectedParent
    );
  }, [selectedParent]);

  // Cases for the selected bucket (or parent if no sub-bucket selected)
  const filteredCases = useMemo<Case[]>(() => {
    if (selectedBucket) {
      return classified.filter(({ bucket }) => bucket === selectedBucket).map(({ case: c }) => c);
    }
    if (selectedParent) {
      return classified
        .filter(({ bucket }) => getTopLevelParent(bucket) === selectedParent)
        .map(({ case: c }) => c);
    }
    return cases;
  }, [classified, cases, selectedBucket, selectedParent]);

  const totalDebt = filteredCases.reduce(
    (s, c) => s + c.loans.reduce((ls, l) => ls + l.total_debt, 0),
    0
  );

  function handleParentClick(parent: string) {
    if (selectedParent === parent) {
      setSelectedParent(null);
      setSelectedBucket(null);
    } else {
      setSelectedParent(parent);
      setSelectedBucket(null);
    }
  }

  function handleBucketClick(id: BucketId) {
    setSelectedBucket(selectedBucket === id ? null : id);
  }

  function getParentLabel(parent: string): string {
    if (parent === '0') return BUCKET_META['0'].label;
    if (parent === '1') return BUCKET_META['1'].label;
    if (parent === '6') return BUCKET_META['6'].label;
    if (parent === '7') return BUCKET_META['7'].label;
    return PARENT_LABELS[parent]?.label ?? parent;
  }

  function getParentColor(parent: string): string {
    if (parent === '0') return BUCKET_META['0'].color;
    if (parent === '1') return BUCKET_META['1'].color;
    if (parent === '6') return BUCKET_META['6'].color;
    if (parent === '7') return BUCKET_META['7'].color;
    return PARENT_LABELS[parent]?.color ?? 'bg-slate-400';
  }

  // Active filter label for table header
  const filterLabel = selectedBucket
    ? BUCKET_META[selectedBucket].label
    : selectedParent
    ? getParentLabel(selectedParent)
    : 'Todos los expedientes';

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">

        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#002446] tracking-tight">Mi Perímetro</h1>
            <p className="text-sm text-slate-500">
              {cases.length} expedientes · {(totalDebt / 1_000_000).toFixed(1)}M EUR
              {(selectedParent || selectedBucket) && (
                <span className="ml-2 text-[#1a61a6] font-semibold">
                  · {filterLabel} ({filteredCases.length})
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(selectedParent || selectedBucket) && (
              <button
                onClick={() => { setSelectedParent(null); setSelectedBucket(null); }}
                className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
              >
                Limpiar filtro
              </button>
            )}
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              {([['segmentation', 'Segmentación'], ['map', 'Mapa'], ['list', 'Lista']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    tab === key ? 'bg-white text-[#002446] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {tab === 'segmentation' && (
          <>
            {/* Top-level parent buckets */}
            <div className="grid grid-cols-4 gap-3">
              {TOP_LEVEL_PARENTS.map((parent) => {
                const count = parentCounts[parent] ?? 0;
                const isSelected = selectedParent === parent;
                const color = getParentColor(parent);
                return (
                  <button
                    key={parent}
                    onClick={() => handleParentClick(parent)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#1a61a6] ring-2 ring-[#1a61a6]/20 bg-[#1a61a6]/5'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${color}`} />
                      <span className="text-xs font-semibold text-slate-700 text-left leading-tight">
                        {getParentLabel(parent)}
                      </span>
                    </div>
                    <span className="text-xl font-black text-[#002446] ml-2">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Sub-bucket drill-down (shown when a parent is selected that has sub-buckets) */}
            {selectedParent && visibleSubBuckets.length > 1 && (
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Desglose · {getParentLabel(selectedParent)}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {visibleSubBuckets.map((id) => {
                    const meta = BUCKET_META[id];
                    const count = bucketCounts[id] ?? 0;
                    const isSelected = selectedBucket === id;
                    return (
                      <button
                        key={id}
                        onClick={() => handleBucketClick(id)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          isSelected
                            ? 'border-[#1a61a6] ring-1 ring-[#1a61a6]/30 bg-[#1a61a6]/5'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${meta.color}`} />
                          <span className="text-[11px] font-medium text-slate-700 text-left leading-tight">
                            {meta.label}
                          </span>
                        </div>
                        <span className="text-sm font-black text-[#002446] ml-2">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Distribution bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#002446] mb-4">Distribución</h3>
              <div className="flex gap-0.5 h-6 rounded-lg overflow-hidden">
                {TOP_LEVEL_PARENTS.map((parent) => {
                  const count = parentCounts[parent] ?? 0;
                  if (count === 0) return null;
                  return (
                    <div
                      key={parent}
                      className={`${getParentColor(parent)} transition-all hover:opacity-80 cursor-pointer ${
                        selectedParent === parent ? 'opacity-100' : 'opacity-70'
                      }`}
                      style={{ width: `${(count / Math.max(1, cases.length)) * 100}%` }}
                      title={`${getParentLabel(parent)}: ${count}`}
                      onClick={() => handleParentClick(parent)}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-3 mt-3">
                {TOP_LEVEL_PARENTS.filter((p) => (parentCounts[p] ?? 0) > 0).map((parent) => (
                  <div key={parent} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-sm ${getParentColor(parent)}`} />
                    <span className="text-[9px] text-slate-500">
                      {getParentLabel(parent)} ({parentCounts[parent] ?? 0})
                    </span>
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
                <p className="text-sm font-bold text-slate-400">Mapa de España</p>
                <p className="text-xs text-slate-400">Integración con mapa interactivo pendiente</p>
                <p className="text-[10px] text-slate-300 mt-2">
                  {cases.filter((c) => c.collaterals.some((col) => col.latitude)).length} garantías con geolocalización
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Case list — shown in segmentation when something selected, or in list tab */}
        {(tab === 'list' || (tab === 'segmentation' && (selectedParent || selectedBucket))) && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">
                {filterLabel} · {filteredCases.length} expedientes
              </h3>
              {selectedBucket && (
                <p className="text-[10px] text-slate-400">
                  {BUCKET_META[selectedBucket].description}
                </p>
              )}
            </div>
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    <th className="px-5 py-3">Expediente</th>
                    <th className="px-5 py-3">Deudor</th>
                    <th className="px-5 py-3">Segmento</th>
                    <th className="px-5 py-3">Estrategia</th>
                    <th className="px-5 py-3 text-right">Deuda Total</th>
                    <th className="px-5 py-3">Últ. Contacto</th>
                    <th className="px-5 py-3">Legal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {filteredCases.map((c) => {
                    const borrower = c.parties.find((p) => p.role === 'borrower');
                    const debt = c.loans.reduce((s, l) => s + l.total_debt, 0);
                    const days = lastContactDays(c);
                    const bucket = classifyGroup(c, config);
                    const meta = BUCKET_META[bucket];
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openGroup(c.id)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                      >
                        <td className="px-5 py-3 font-bold text-[#1a61a6]">{c.reference}</td>
                        <td className="px-5 py-3 text-slate-700">{borrower?.name || '-'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${meta.color}`} />
                            <span className="text-[10px] text-slate-600 font-medium">{meta.label}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                            {STRATEGY_LABELS[c.strategy]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-bold text-slate-900">
                          {debt.toLocaleString('es-ES')} EUR
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium ${
                            days === 9999 ? 'text-slate-400' : days > 30 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {days === 9999 ? 'Nunca' : `${days}d`}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            c.legal_status === 'judicial'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
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
