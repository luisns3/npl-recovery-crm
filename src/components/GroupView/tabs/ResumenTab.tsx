import { useState, useRef } from 'react';
import type { Case, Strategy, AdditionalDebt } from '../../../types';
import { STRATEGY_LABELS, STRATEGY_PRIORITY } from '../../../types';
import CadastralRefLink from '../../shared/CadastralRefLink';
import { getMilestoneCategory, MILESTONE_STYLES } from '../../shared/legalMilestone';

interface Props {
  groupCases: Case[];
  allCollaterals: { id: string; property_type: string; address: string; cadastral_ref: string | null; surface_sqm: number | null; procedimiento_id?: string | null; latitude?: number | null; longitude?: number | null }[];
  allLoans: { id: string; case_id: string; loan_reference: string; upb: number; total_debt: number; strategy: Strategy; procedimiento_id?: string | null }[];
  allLoanCollaterals: { loan_id: string; collateral_id: string; lien_rank: number }[];
  onStrategyChange: (caseId: string, loanId: string, strategy: Strategy) => void;
}

// ─── Flag reasons ────────────────────────────────────────────────────────────
const FLAG_REASONS = [
  'Colateral incorrecto o porcentaje de participación distinto',
  'Error en datos registrales o catastrales',
  'Carga o gravamen preferente no identificado',
  'Daño estructural o deterioro grave',
  'Limitación VPO o protección patrimonial',
  'Problema urbanístico o medioambiental',
  'Otro (indicar en notas)',
] as const;

interface FlagData {
  reasons: string[];
  note: string;
  fileNames: string[];
}

const DEBT_STATUS_COLORS: Record<AdditionalDebt['status'], string> = {
  pendiente: 'bg-red-100 text-red-700',
  pagado:    'bg-emerald-100 text-emerald-700',
  disputado: 'bg-amber-100 text-amber-700',
};

const MOCK_ADDITIONAL_DEBTS: AdditionalDebt[] = [];

// ─── Small flag icon ──────────────────────────────────────────────────────────
function FlagIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 10 13" className="w-3 h-3" aria-hidden>
      {/* pole */}
      <line x1="1.5" y1="0.5" x2="1.5" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      {/* flag */}
      <path d="M1.5 1 L9.5 3.5 L1.5 6.5 Z" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function ResumenTab({ groupCases, allCollaterals, allLoans, allLoanCollaterals, onStrategyChange }: Props) {
  const [editingStrategy, setEditingStrategy] = useState<string | null>(null);
  const [flags, setFlags] = useState<Record<string, FlagData>>({});
  const [flagModal, setFlagModal] = useState<{ id: string; label: string } | null>(null);
  const [draftReasons, setDraftReasons] = useState<string[]>([]);
  const [draftNote, setDraftNote] = useState('');
  const [draftFiles, setDraftFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Flag helpers ───────────────────────────────────────────────────────────
  function openFlag(id: string, label: string) {
    const existing = flags[id];
    setDraftReasons(existing?.reasons ?? []);
    setDraftNote(existing?.note ?? '');
    setDraftFiles(existing?.fileNames ?? []);
    setFlagModal({ id, label });
  }

  function saveFlag() {
    if (!flagModal) return;
    if (draftReasons.length === 0 && !draftNote.trim() && draftFiles.length === 0) {
      const next = { ...flags };
      delete next[flagModal.id];
      setFlags(next);
    } else {
      setFlags(f => ({ ...f, [flagModal.id]: { reasons: draftReasons, note: draftNote, fileNames: draftFiles } }));
    }
    setFlagModal(null);
  }

  function removeFlag() {
    if (!flagModal) return;
    const next = { ...flags };
    delete next[flagModal.id];
    setFlags(next);
    setFlagModal(null);
  }

  function toggleReason(reason: string) {
    setDraftReasons(prev =>
      prev.includes(reason) ? prev.filter(r => r !== reason) : [...prev, reason]
    );
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const names = Array.from(e.target.files ?? []).map(f => f.name);
    setDraftFiles(prev => [...prev, ...names]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  // ─── Zero-debt / released detection ────────────────────────────────────────
  const zeroDebtLoanIds = new Set(allLoans.filter(l => l.total_debt === 0).map(l => l.id));

  function isCollateralReleased(colId: string): boolean {
    const linked = allLoanCollaterals.filter(lc => lc.collateral_id === colId);
    return linked.length > 0 && linked.every(lc => zeroDebtLoanIds.has(lc.loan_id));
  }

  // ─── Other helpers ──────────────────────────────────────────────────────────
  function getLienRank(loanId: string, collateralId: string): number | null {
    return allLoanCollaterals.find(r => r.loan_id === loanId && r.collateral_id === collateralId)?.lien_rank ?? null;
  }

  function getStrategyForCollateral(collateralId: string): Strategy {
    const linkedLoanId = allLoanCollaterals.find(r => r.collateral_id === collateralId)?.loan_id;
    if (!linkedLoanId) return groupCases[0]?.strategy || 'DPO';
    return allLoans.find(l => l.id === linkedLoanId)?.strategy || groupCases[0]?.strategy || 'DPO';
  }

  function monthsToAuction(auctionDate: string): number {
    const today = new Date();
    const auction = new Date(auctionDate);
    return Math.max(0, (auction.getFullYear() - today.getFullYear()) * 12 + (auction.getMonth() - today.getMonth()));
  }

  function formatEur(n: number) {
    return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  }

  const additionalDebts = groupCases.flatMap(c => c.additional_debts || MOCK_ADDITIONAL_DEBTS);

  return (
    <div className="p-5 space-y-5">

      {/* ── Main Matrix ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Matriz de Garantias - Prestamos</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50">
              <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="px-4 py-3 min-w-[200px]">Garantia / Ubicacion</th>

                {allLoans.map((loan) => {
                  const isZero = zeroDebtLoanIds.has(loan.id);
                  const isFlagged = !!flags[loan.id];
                  return (
                    <th
                      key={loan.id}
                      className={`px-4 py-3 text-center border-l border-slate-200 min-w-[130px] relative ${
                        isFlagged ? 'bg-red-50' : isZero ? 'bg-slate-50' : ''
                      }`}
                    >
                      <div className={`font-bold ${isZero ? 'line-through text-slate-400' : 'text-[#1a61a6]'}`}>
                        {loan.loan_reference}
                      </div>
                      <div className={`text-[8px] normal-case font-medium mt-0.5 ${isZero ? 'line-through text-slate-400' : 'text-slate-500'}`}>
                        {formatEur(loan.upb)} / {formatEur(loan.total_debt)} EUR
                      </div>
                      {loan.procedimiento_id && (
                        <div className={`text-[8px] normal-case font-bold mt-0.5 rounded px-1 ${isZero ? 'line-through text-slate-400 bg-slate-100' : 'text-amber-600 bg-amber-50'}`}>
                          Proc. {loan.procedimiento_id}
                        </div>
                      )}
                      {/* Flag button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openFlag(loan.id, loan.loan_reference); }}
                        title={isFlagged ? 'Ver incidencia' : 'Marcar incidencia'}
                        className={`absolute bottom-1.5 right-1.5 transition-colors ${
                          isFlagged ? 'text-red-500' : 'text-slate-300 hover:text-red-400'
                        }`}
                      >
                        <FlagIcon active={isFlagged} />
                      </button>
                    </th>
                  );
                })}

                <th className="px-4 py-3 text-center border-l border-slate-200 min-w-[110px]">
                  Fase Jud.
                  <div className="text-[7px] normal-case font-medium text-slate-400 mt-0.5">(meses para subasta)</div>
                </th>
                <th className="px-4 py-3 border-l border-slate-200 min-w-[140px]">Estrategia</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50 text-[11px]">
              {allCollaterals.map((col) => {
                const strategy = getStrategyForCollateral(col.id);
                const isEditing = editingStrategy === col.id;
                const parentCase = groupCases.find(c => c.collaterals.some(cl => cl.id === col.id));
                const linkedLoanId = allLoanCollaterals.find(r => r.collateral_id === col.id)?.loan_id;
                const linkedLoan = allLoans.find(l => l.id === linkedLoanId);
                const rowFlagged = !!flags[col.id];
                const rowReleased = isCollateralReleased(col.id);

                const rowBg = rowFlagged ? 'bg-red-50 hover:bg-red-50/80' : 'hover:bg-slate-50/60';
                const strikeCls = rowReleased ? 'line-through text-slate-400' : '';

                return (
                  <tr key={col.id} className={`transition-colors ${rowBg}`}>

                    {/* Collateral address cell */}
                    <td className="px-4 py-3 relative">
                      <a
                        href={col.latitude && col.longitude
                          ? `https://maps.google.com/?q=${col.latitude},${col.longitude}`
                          : `https://maps.google.com/?q=${encodeURIComponent(col.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`font-bold leading-tight hover:text-[#1a61a6] hover:underline ${rowReleased ? 'line-through text-slate-400' : 'text-slate-800'}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {col.address}
                      </a>
                      <div className={`text-[9px] mt-0.5 ${rowReleased ? 'line-through text-slate-400' : 'text-slate-400'}`}>
                        {col.property_type}{col.surface_sqm ? ` · ${col.surface_sqm} m²` : ''}
                      </div>
                      {col.cadastral_ref && (
                        <CadastralRefLink
                          refCat={col.cadastral_ref}
                          className={`text-[8px] hover:underline mt-0.5 block cursor-pointer ${rowReleased ? 'line-through text-slate-400' : 'text-[#1a61a6]'}`}
                        />
                      )}
                      {col.procedimiento_id && (
                        <div className={`text-[8px] font-bold mt-0.5 ${rowReleased ? 'line-through text-slate-400' : 'text-amber-600'}`}>
                          Proc. {col.procedimiento_id}
                        </div>
                      )}
                      {/* Flag button */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openFlag(col.id, col.address.split(',')[0]); }}
                        title={rowFlagged ? 'Ver incidencia' : 'Marcar incidencia'}
                        className={`absolute bottom-1.5 right-1.5 transition-colors ${
                          rowFlagged ? 'text-red-500' : 'text-slate-300 hover:text-red-400'
                        }`}
                      >
                        <FlagIcon active={rowFlagged} />
                      </button>
                    </td>

                    {/* Loan cells */}
                    {allLoans.map((loan) => {
                      const rank = getLienRank(loan.id, col.id);
                      const colFlagged = !!flags[loan.id];
                      const colZero = zeroDebtLoanIds.has(loan.id);
                      const cellBg = !rowFlagged && colFlagged ? 'bg-red-50' : '';
                      const cellStrike = (rowReleased || colZero) ? strikeCls || 'line-through text-slate-400' : '';
                      return (
                        <td key={loan.id} className={`px-4 py-3 text-center border-l border-slate-50 ${cellBg}`}>
                          {rank !== null ? (
                            <span className={`bg-[#1a61a6]/10 text-[#1a61a6] px-2 py-0.5 rounded font-bold text-[10px] ${cellStrike}`}>
                              {rank}ª
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Judicial phase cell */}
                    <td className="px-4 py-3 text-center border-l border-slate-50">
                      {(() => {
                        const cat = getMilestoneCategory(parentCase?.legal_status, parentCase?.legal_milestone);
                        const styles = MILESTONE_STYLES[cat];
                        if (cat === 'none') return <span className="text-slate-300">—</span>;
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded leading-tight ${styles.badge}`}>
                              {parentCase?.legal_milestone || 'Judicial'}
                            </span>
                            {parentCase?.auction_date ? (
                              <span className={`text-[8px] font-bold ${cat === 'advanced' ? 'text-red-600' : 'text-slate-500'}`}>
                                {monthsToAuction(parentCase.auction_date)}m subasta
                              </span>
                            ) : (
                              <span className="text-[8px] text-slate-400">sin fecha</span>
                            )}
                          </div>
                        );
                      })()}
                    </td>

                    {/* Strategy cell */}
                    <td className="px-4 py-3 border-l border-slate-50">
                      {isEditing ? (
                        <select
                          autoFocus
                          defaultValue={strategy}
                          onBlur={(e) => {
                            if (parentCase && linkedLoan && e.target.value !== strategy) {
                              onStrategyChange(parentCase.id, linkedLoan.id, e.target.value as Strategy);
                            }
                            setEditingStrategy(null);
                          }}
                          onChange={(e) => {
                            if (parentCase && linkedLoan) {
                              onStrategyChange(parentCase.id, linkedLoan.id, e.target.value as Strategy);
                            }
                            setEditingStrategy(null);
                          }}
                          className="text-[10px] border border-[#1a61a6] rounded px-1.5 py-0.5 bg-white text-[#1a61a6] font-bold focus:outline-none"
                        >
                          {STRATEGY_PRIORITY.map(s => (
                            <option key={s} value={s}>{STRATEGY_LABELS[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingStrategy(col.id)}
                          className={`group flex items-center gap-1.5 hover:bg-[#1a61a6]/5 rounded px-1.5 py-0.5 transition-colors ${strikeCls}`}
                        >
                          <span className="text-[10px] font-bold text-[#1a61a6]">{STRATEGY_LABELS[strategy]}</span>
                          <svg className="w-3 h-3 text-slate-300 group-hover:text-[#1a61a6] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr className="text-[9px] font-bold text-slate-500 uppercase">
                <td className="px-4 py-2.5">Totales</td>
                {allLoans.map((loan) => (
                  <td key={loan.id} className="px-4 py-2.5 text-center border-l border-slate-200">
                    <div className={`text-[10px] font-bold ${zeroDebtLoanIds.has(loan.id) ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                      {formatEur(loan.total_debt)}
                    </div>
                    <div className="text-[8px] text-slate-400">EUR</div>
                  </td>
                ))}
                <td className="border-l border-slate-200" />
                <td className="border-l border-slate-200 px-4 py-2.5">
                  <span className="text-[10px] text-slate-700 font-bold">
                    {formatEur(allLoans.reduce((s, l) => s + l.total_debt, 0))} EUR total
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── Additional Debts ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Deudas Adicionales (IBI / CCPP)</h3>
          </div>
          <button className="text-[10px] font-bold text-[#1a61a6] hover:underline flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Añadir deuda
          </button>
        </div>
        {additionalDebts.length === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center gap-2 text-center">
            <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-400">Sin deudas adicionales registradas</p>
            <p className="text-[10px] text-slate-300">Haz clic en "Añadir deuda" para registrar IBI, gastos de comunidad u otras deudas vinculadas a la garantia</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5">Garantia</th>
                  <th className="px-4 py-2.5">Tipo</th>
                  <th className="px-4 py-2.5">Descripcion</th>
                  <th className="px-4 py-2.5">Año</th>
                  <th className="px-4 py-2.5 text-right">Importe</th>
                  <th className="px-4 py-2.5">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {additionalDebts.map((debt) => {
                  const col = allCollaterals.find(c => c.id === debt.collateral_id);
                  return (
                    <tr key={debt.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-600 text-[10px]">{col?.address || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${debt.type === 'IBI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {debt.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">{debt.description || '-'}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">{debt.year || '-'}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 text-[10px]">{debt.amount.toLocaleString('es-ES')} EUR</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold capitalize ${DEBT_STATUS_COLORS[debt.status]}`}>
                          {debt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Flag Modal ───────────────────────────────────────────────────────── */}
      {flagModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setFlagModal(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="bg-[#002446] px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <span className="text-red-400"><FlagIcon active /></span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">Incidencia</p>
                  <p className="text-sm font-extrabold leading-tight truncate max-w-[300px]">{flagModal.label}</p>
                </div>
              </div>
              <button onClick={() => setFlagModal(null)} className="text-white/50 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">

              {/* Reasons */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tipo de incidencia</p>
                <div className="space-y-1.5">
                  {FLAG_REASONS.map(reason => (
                    <label key={reason} className="flex items-start gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={draftReasons.includes(reason)}
                        onChange={() => toggleReason(reason)}
                        className="mt-0.5 accent-red-500 shrink-0"
                      />
                      <span className={`text-[11px] leading-snug group-hover:text-slate-800 transition-colors ${
                        draftReasons.includes(reason) ? 'text-slate-900 font-medium' : 'text-slate-500'
                      }`}>
                        {reason}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Notas adicionales</p>
                <textarea
                  value={draftNote}
                  onChange={e => setDraftNote(e.target.value)}
                  rows={3}
                  placeholder="Describe la incidencia con más detalle..."
                  className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-300 placeholder:text-slate-300"
                />
              </div>

              {/* Documents */}
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Documentos adjuntos</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-slate-200 rounded-lg py-3 text-[11px] text-slate-400 hover:border-red-300 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  Adjuntar documento
                </button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFiles} />
                {draftFiles.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {draftFiles.map((name, i) => (
                      <li key={i} className="flex items-center justify-between text-[10px] text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded">
                        <span className="truncate">{name}</span>
                        <button onClick={() => setDraftFiles(f => f.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500 ml-2 shrink-0">✕</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
              {flags[flagModal.id] && (
                <button onClick={removeFlag} className="text-[11px] font-bold text-red-500 hover:text-red-700 transition-colors">
                  Eliminar incidencia
                </button>
              )}
              <div className="flex gap-2 ml-auto">
                <button onClick={() => setFlagModal(null)} className="px-4 py-2 text-[11px] font-bold text-slate-500 hover:text-slate-700 transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={saveFlag}
                  className="px-4 py-2 text-[11px] font-bold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Guardar incidencia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
