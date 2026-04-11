import { useState, useMemo } from 'react';
import type { BankMovement, Loan, Proposal } from '../../../types';

interface Props {
  allMovements: BankMovement[];
  allLoans: Loan[];
  allProposals: Proposal[];
  onReconcile?: (movementId: string, linkType: 'loan' | 'proposal', linkId: string) => void;
  onExclude?: (movementId: string) => void;
}

function eur(n: number): string {
  const abs = Math.abs(n);
  const fmt = abs.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';
  return n < 0 ? `−${fmt}` : fmt;
}

function formatDate(d: string): string {
  try {
    return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
  } catch {
    return d;
  }
}

export default function ConciliacionTab({ allMovements, allLoans, allProposals, onReconcile, onExclude }: Props) {
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [linkType, setLinkType] = useState<'loan' | 'proposal'>('loan');
  const [selectedLinkId, setSelectedLinkId] = useState<string>('');
  const [filter, setFilter] = useState<'pending' | 'reconciled' | 'excluded' | 'all'>('pending');

  const pending   = useMemo(() => allMovements.filter((m) => m.status === 'pending').length, [allMovements]);
  const reconciled = useMemo(() => allMovements.filter((m) => m.status === 'reconciled').length, [allMovements]);
  const excluded  = useMemo(() => allMovements.filter((m) => m.status === 'excluded').length, [allMovements]);

  const totalIncome = useMemo(
    () => allMovements.filter((m) => m.status === 'pending' && m.amount > 0).reduce((s, m) => s + m.amount, 0),
    [allMovements]
  );

  const filtered = useMemo(
    () => filter === 'all' ? allMovements : allMovements.filter((m) => m.status === filter),
    [allMovements, filter]
  );

  function openLink(id: string) {
    setLinkingId(id);
    setLinkType('loan');
    setSelectedLinkId('');
  }

  function confirmLink() {
    if (!linkingId || !selectedLinkId) return;
    onReconcile?.(linkingId, linkType, selectedLinkId);
    setLinkingId(null);
    setSelectedLinkId('');
  }

  const FILTERS: { key: typeof filter; label: string; count: number }[] = [
    { key: 'pending',    label: 'Pendientes',   count: pending },
    { key: 'reconciled', label: 'Conciliados',  count: reconciled },
    { key: 'excluded',   label: 'Excluidos',    count: excluded },
    { key: 'all',        label: 'Todos',        count: allMovements.length },
  ];

  return (
    <div className="p-5 space-y-5">

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendientes</p>
          <p className="text-xl font-black text-amber-600">{pending}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">movimientos</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Por Conciliar</p>
          <p className="text-xl font-black text-[#002446]">{eur(totalIncome)}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">ingresos pendientes</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Conciliados</p>
          <p className="text-xl font-black text-emerald-600">{reconciled}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">movimientos</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Excluidos</p>
          <p className="text-xl font-black text-slate-400">{excluded}</p>
          <p className="text-[9px] text-slate-400 mt-0.5">movimientos</p>
        </div>
      </div>

      {/* Movements table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header + filter tabs */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Movimientos Bancarios</h3>
          </div>
          <div className="flex gap-1">
            {FILTERS.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-[9px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                  filter === key
                    ? 'bg-[#1a61a6] text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {label} {count > 0 && <span className="opacity-70">({count})</span>}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-400">
              {filter === 'pending' ? 'No hay movimientos pendientes de conciliar' : 'Sin movimientos en este estado'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 min-w-[100px]">Fecha</th>
                  <th className="px-4 py-3 min-w-[260px]">Descripción</th>
                  <th className="px-4 py-3 min-w-[80px]">Referencia</th>
                  <th className="px-4 py-3 text-right min-w-[110px]">Importe</th>
                  <th className="px-4 py-3 min-w-[120px]">Estado</th>
                  <th className="px-4 py-3 min-w-[180px]">Vinculado a</th>
                  <th className="px-4 py-3 min-w-[120px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[11px]">
                {filtered.map((mov) => {
                  const linkedLoan = mov.linked_loan_id
                    ? allLoans.find((l) => l.id === mov.linked_loan_id)
                    : null;
                  const linkedProposal = mov.linked_proposal_id
                    ? allProposals.find((p) => p.id === mov.linked_proposal_id)
                    : null;
                  const isIncome = mov.amount > 0;

                  return (
                    <tr key={mov.id} className={`hover:bg-slate-50/60 transition-colors ${
                      mov.status === 'excluded' ? 'opacity-50' : ''
                    }`}>
                      {/* Date */}
                      <td className="px-4 py-3 text-slate-600 font-medium whitespace-nowrap">
                        {formatDate(mov.date)}
                      </td>

                      {/* Description */}
                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium leading-snug">{mov.description}</div>
                        {mov.notes && (
                          <div className="text-[9px] text-slate-400 mt-0.5 italic">{mov.notes}</div>
                        )}
                      </td>

                      {/* Reference */}
                      <td className="px-4 py-3 text-slate-400 font-mono text-[9px]">
                        {mov.reference || '—'}
                      </td>

                      {/* Amount */}
                      <td className={`px-4 py-3 text-right font-black ${
                        isIncome ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {isIncome ? '+' : ''}{eur(mov.amount)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          mov.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : mov.status === 'reconciled'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}>
                          {mov.status === 'pending' ? 'Pendiente' : mov.status === 'reconciled' ? 'Conciliado' : 'Excluido'}
                        </span>
                      </td>

                      {/* Linked to */}
                      <td className="px-4 py-3">
                        {linkedLoan ? (
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Préstamo</span>
                            <div className="font-bold text-[#1a61a6] text-[10px]">{linkedLoan.loan_reference}</div>
                          </div>
                        ) : linkedProposal ? (
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Propuesta</span>
                            <div className="font-bold text-[#1a61a6] text-[10px]">{linkedProposal.strategy_type} — {linkedProposal.amount.toLocaleString('es-ES')} €</div>
                          </div>
                        ) : (
                          <span className="text-slate-300 text-[9px]">Sin vincular</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {mov.status === 'pending' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => openLink(mov.id)}
                              className="text-[9px] font-bold px-2 py-1 rounded bg-[#1a61a6]/10 text-[#1a61a6] hover:bg-[#1a61a6]/20 transition-colors whitespace-nowrap"
                            >
                              Vincular
                            </button>
                            <button
                              onClick={() => onExclude?.(mov.id)}
                              className="text-[9px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors whitespace-nowrap"
                            >
                              Excluir
                            </button>
                          </div>
                        )}
                        {mov.status === 'reconciled' && (
                          <span className="text-[9px] text-emerald-600 font-bold">✓ Conciliado</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Link modal */}
      {linkingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="bg-[#002446] px-5 py-4 flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-white uppercase tracking-widest">Vincular Movimiento</h2>
              <button onClick={() => setLinkingId(null)} className="text-white/60 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type selector */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vincular a</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setLinkType('loan'); setSelectedLinkId(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      linkType === 'loan'
                        ? 'bg-[#1a61a6] text-white border-[#1a61a6]'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-[#1a61a6]'
                    }`}
                  >
                    Préstamo
                  </button>
                  <button
                    onClick={() => { setLinkType('proposal'); setSelectedLinkId(''); }}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-colors ${
                      linkType === 'proposal'
                        ? 'bg-[#1a61a6] text-white border-[#1a61a6]'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-[#1a61a6]'
                    }`}
                  >
                    Propuesta
                  </button>
                </div>
              </div>

              {/* Select */}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  {linkType === 'loan' ? 'Seleccionar préstamo' : 'Seleccionar propuesta'}
                </p>
                <select
                  value={selectedLinkId}
                  onChange={(e) => setSelectedLinkId(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#1a61a6]/30 focus:border-[#1a61a6]"
                >
                  <option value="">— Seleccionar —</option>
                  {linkType === 'loan'
                    ? allLoans.map((l) => (
                        <option key={l.id} value={l.id}>{l.loan_reference}</option>
                      ))
                    : allProposals.filter((p) => !p.cancelled_at).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.strategy_type} — {p.amount.toLocaleString('es-ES')} € ({p.probability})
                        </option>
                      ))
                  }
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setLinkingId(null)}
                  className="flex-1 py-2 text-xs font-bold rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmLink}
                  disabled={!selectedLinkId}
                  className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#1a61a6] text-white hover:bg-[#1a61a6]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Confirmar Vinculación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
