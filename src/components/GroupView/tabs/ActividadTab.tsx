import { useState, useMemo } from 'react';
import type { Interaction, CallResult } from '../../../types';
import { CALL_RESULT_LABELS } from '../../../types';

interface Props {
  allInteractions: Interaction[];
  onAddNote: (comment: string) => void;
}

type Period = 'month' | 'week';

const RESULT_COLORS: Record<string, string> = {
  cup: '#059669',
  cun: '#dc2626',
  not_answering: '#94a3b8',
  callback: '#7c3aed',
  voicemail: '#cbd5e1',
  wrong_number: '#f97316',
  refused: '#991b1b',
  third_party: '#d97706',
};

const RESULT_BG: Record<string, string> = {
  cup: 'bg-emerald-100 text-emerald-700',
  cun: 'bg-red-100 text-red-700',
  not_answering: 'bg-slate-100 text-slate-500',
  callback: 'bg-violet-100 text-violet-700',
  voicemail: 'bg-slate-100 text-slate-400',
  wrong_number: 'bg-orange-100 text-orange-700',
  refused: 'bg-red-200 text-red-800',
  third_party: 'bg-amber-100 text-amber-700',
};

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getWeekKey(dateStr: string) {
  const d = new Date(dateStr);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
  return `${d.getFullYear()}-S${String(week).padStart(2, '0')}`;
}

function formatPeriodLabel(key: string, period: Period) {
  if (period === 'month') {
    const [y, m] = key.split('-');
    const date = new Date(parseInt(y), parseInt(m) - 1, 1);
    return date.toLocaleString('es-ES', { month: 'short', year: '2-digit' });
  }
  return key.replace('-', ' ');
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
}

const ALL_RESULTS: CallResult[] = ['cup', 'cun', 'not_answering', 'callback', 'voicemail', 'wrong_number', 'refused', 'third_party'];

export default function ActividadTab({ allInteractions, onAddNote }: Props) {
  const [period, setPeriod] = useState<Period>('month');
  const [noteText, setNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const histogram = useMemo(() => {
    const buckets = new Map<string, Record<string, number>>();
    for (const i of allInteractions) {
      const key = period === 'month' ? getMonthKey(i.created_at) : getWeekKey(i.created_at);
      if (!buckets.has(key)) {
        const init: Record<string, number> = { note: 0, visit: 0 };
        ALL_RESULTS.forEach((r) => (init[r] = 0));
        buckets.set(key, init);
      }
      const bucket = buckets.get(key)!;
      if (i.call_result) {
        bucket[i.call_result] = (bucket[i.call_result] || 0) + 1;
      } else if (i.type === 'note') {
        bucket.note = (bucket.note || 0) + 1;
      } else if (i.type === 'visit') {
        bucket.visit = (bucket.visit || 0) + 1;
      }
    }
    return [...buckets.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  }, [allInteractions, period]);

  const maxCount = useMemo(
    () => Math.max(1, ...histogram.map(([, v]) => Object.values(v).reduce((a, b) => a + b, 0))),
    [histogram]
  );

  function handleAddNote() {
    if (noteText.trim().length < 10) return;
    onAddNote(noteText.trim());
    setNoteText('');
    setAddingNote(false);
  }

  const sortedInteractions = [...allInteractions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="p-5 space-y-5">
      {/* Histogram */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xs font-bold text-[#002446]">Historial de Contactos</h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {allInteractions.filter((i) => i.type === 'call').length} llamadas registradas
            </p>
          </div>
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {(['month', 'week'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${
                  period === p ? 'bg-white text-[#002446] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {p === 'month' ? 'Mensual' : 'Semanal'}
              </button>
            ))}
          </div>
        </div>

        {histogram.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-xs text-slate-400 italic">Sin actividad registrada</div>
        ) : (
          <>
            <div className="flex items-end gap-1 h-36">
              {histogram.map(([key, values]) => {
                const total = Object.values(values).reduce((a, b) => a + b, 0);
                const barH = Math.max(4, (total / maxCount) * 120);
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex flex-col-reverse rounded-t-sm overflow-hidden" style={{ height: `${barH}px` }}>
                      {/* Notes as gray base */}
                      {values.note > 0 && (
                        <div style={{ height: `${(values.note / total) * 100}%`, background: '#e2e8f0' }} />
                      )}
                      {/* Call results stacked */}
                      {ALL_RESULTS.map((r) =>
                        (values[r] || 0) > 0 ? (
                          <div
                            key={r}
                            title={`${CALL_RESULT_LABELS[r]}: ${values[r]}`}
                            style={{ height: `${(values[r] / total) * 100}%`, background: RESULT_COLORS[r] || '#94a3b8' }}
                          />
                        ) : null
                      )}
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-[#002446] text-white text-[9px] rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {total} contacto{total !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <span className="text-[7px] font-bold text-slate-500 leading-none">
                      {formatPeriodLabel(key, period)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-slate-100">
              {ALL_RESULTS.filter((r) => histogram.some(([, v]) => (v[r] || 0) > 0)).map((r) => (
                <div key={r} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: RESULT_COLORS[r] }} />
                  <span className="text-[9px] text-slate-500">{CALL_RESULT_LABELS[r]}</span>
                </div>
              ))}
              {histogram.some(([, v]) => (v.note || 0) > 0) && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-200" />
                  <span className="text-[9px] text-slate-500">Nota interna</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Comment Feed */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-[#002446]">Historial de Gestion</h3>
          <button
            onClick={() => setAddingNote(!addingNote)}
            className="text-[10px] font-bold text-[#1a61a6] flex items-center gap-1 hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Añadir nota
          </button>
        </div>

        {addingNote && (
          <div className="px-5 py-4 border-b border-slate-100 bg-[#1a61a6]/3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Escribe una nota interna sobre este grupo..."
              className="w-full text-xs border border-slate-200 rounded-xl p-3 resize-none h-24 focus:outline-none focus:border-[#1a61a6] bg-white"
            />
            {noteText.length > 0 && noteText.length < 10 && (
              <p className="text-[9px] text-red-500 mt-1">Minimo 10 caracteres</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddNote}
                disabled={noteText.trim().length < 10}
                className="px-4 py-1.5 bg-[#1a61a6] text-white text-[10px] font-bold rounded-lg disabled:bg-slate-300 disabled:cursor-not-allowed hover:bg-[#002446] transition-colors"
              >
                Guardar nota
              </button>
              <button
                onClick={() => { setAddingNote(false); setNoteText(''); }}
                className="px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto custom-scrollbar">
          {sortedInteractions.length === 0 && (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-slate-400">Sin interacciones registradas</p>
            </div>
          )}
          {sortedInteractions.map((inter) => (
            <div key={inter.id} className="px-5 py-4 flex gap-3 hover:bg-slate-50/50">
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${
                inter.type === 'note' ? 'bg-slate-100' :
                inter.call_result === 'cup' ? 'bg-emerald-100' :
                inter.call_result === 'cun' ? 'bg-red-100' : 'bg-slate-100'
              }`}>
                {inter.type === 'call' ? (
                  <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-[#1a61a6]">{inter.created_by.substring(0, 8)}...</span>
                  {inter.call_result && (
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${RESULT_BG[inter.call_result] || 'bg-slate-100 text-slate-500'}`}>
                      {CALL_RESULT_LABELS[inter.call_result]}
                    </span>
                  )}
                  {inter.phone_called && (
                    <span className="text-[9px] text-slate-400">{inter.phone_called}</span>
                  )}
                  <span className="text-[9px] text-slate-400 ml-auto">{timeAgo(inter.created_at)}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">{inter.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
