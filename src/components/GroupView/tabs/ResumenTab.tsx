import { useState } from 'react';
import type { Case, Strategy, AdditionalDebt } from '../../../types';
import { STRATEGY_LABELS, STRATEGY_PRIORITY } from '../../../types';
import CadastralRefLink from '../../shared/CadastralRefLink';

interface Props {
  groupCases: Case[];
  allCollaterals: { id: string; property_type: string; address: string; cadastral_ref: string | null; surface_sqm: number | null; procedimiento_id?: string | null }[];
  allLoans: { id: string; case_id: string; loan_reference: string; upb: number; total_debt: number; strategy: Strategy; procedimiento_id?: string | null }[];
  allLoanCollaterals: { loan_id: string; collateral_id: string; lien_rank: number }[];
  onStrategyChange: (caseId: string, loanId: string, strategy: Strategy) => void;
}

const DEBT_STATUS_COLORS: Record<AdditionalDebt['status'], string> = {
  pendiente: 'bg-red-100 text-red-700',
  pagado: 'bg-emerald-100 text-emerald-700',
  disputado: 'bg-amber-100 text-amber-700',
};

// Mock additional debts until schema is ready
const MOCK_ADDITIONAL_DEBTS: AdditionalDebt[] = [];

export default function ResumenTab({ groupCases, allCollaterals, allLoans, allLoanCollaterals, onStrategyChange }: Props) {
  const [editingStrategy, setEditingStrategy] = useState<string | null>(null); // collateral_id

  function getLienRank(loanId: string, collateralId: string): number | null {
    const lc = allLoanCollaterals.find((r) => r.loan_id === loanId && r.collateral_id === collateralId);
    return lc ? lc.lien_rank : null;
  }

  function getStrategyForCollateral(collateralId: string): Strategy {
    // Find loans linked to this collateral, return the first case's strategy
    const linkedLoanId = allLoanCollaterals.find((r) => r.collateral_id === collateralId)?.loan_id;
    if (!linkedLoanId) return groupCases[0]?.strategy || 'DPO';
    const loan = allLoans.find((l) => l.id === linkedLoanId);
    return loan?.strategy || groupCases[0]?.strategy || 'DPO';
  }

  function formatEur(n: number) {
    return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  }

  const additionalDebts = groupCases.flatMap((c) => c.additional_debts || MOCK_ADDITIONAL_DEBTS);

  return (
    <div className="p-5 space-y-5">
      {/* Main Matrix */}
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
                {allLoans.map((loan) => (
                  <th key={loan.id} className="px-4 py-3 text-center border-l border-slate-200 min-w-[130px]">
                    <div className="text-[#1a61a6] font-bold">{loan.loan_reference}</div>
                    <div className="text-[8px] normal-case font-medium text-slate-500 mt-0.5">
                      {formatEur(loan.upb)} / {formatEur(loan.total_debt)} EUR
                    </div>
                    {loan.procedimiento_id && (
                      <div className="text-[8px] normal-case text-amber-600 font-bold mt-0.5 bg-amber-50 rounded px-1">
                        Proc. {loan.procedimiento_id}
                      </div>
                    )}
                  </th>
                ))}
                <th className="px-4 py-3 text-center border-l border-slate-200 min-w-[80px]">Ocupacion</th>
                <th className="px-4 py-3 border-l border-slate-200 min-w-[140px]">Estrategia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px]">
              {allCollaterals.map((col) => {
                const strategy = getStrategyForCollateral(col.id);
                const isEditing = editingStrategy === col.id;
                const parentCase = groupCases.find((c) =>
                  c.collaterals.some((cl) => cl.id === col.id)
                );
                const linkedLoanId = allLoanCollaterals.find((r) => r.collateral_id === col.id)?.loan_id;
                const linkedLoan = allLoans.find((l) => l.id === linkedLoanId);

                return (
                  <tr key={col.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800 leading-tight">{col.address}</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">
                        {col.property_type}{col.surface_sqm ? ` · ${col.surface_sqm} m²` : ''}
                      </div>
                      {col.cadastral_ref && (
                        <CadastralRefLink
                          refCat={col.cadastral_ref}
                          className="text-[8px] text-[#1a61a6] hover:underline mt-0.5 block cursor-pointer"
                        />
                      )}
                      {col.procedimiento_id && (
                        <div className="text-[8px] text-amber-600 font-bold mt-0.5">Proc. {col.procedimiento_id}</div>
                      )}
                    </td>
                    {allLoans.map((loan) => {
                      const rank = getLienRank(loan.id, col.id);
                      return (
                        <td key={loan.id} className="px-4 py-3 text-center border-l border-slate-50">
                          {rank !== null ? (
                            <span className="bg-[#1a61a6]/10 text-[#1a61a6] px-2 py-0.5 rounded font-bold text-[10px]">
                              {rank}ª
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center border-l border-slate-50">
                      {parentCase && (
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          parentCase.legal_status === 'judicial'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {parentCase.legal_status === 'judicial'
                            ? (parentCase.legal_procedure_type || 'Judicial')
                            : 'Extrajud.'}
                        </span>
                      )}
                    </td>
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
                          {STRATEGY_PRIORITY.map((s) => (
                            <option key={s} value={s}>{STRATEGY_LABELS[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <button
                          onClick={() => setEditingStrategy(col.id)}
                          className="group flex items-center gap-1.5 hover:bg-[#1a61a6]/5 rounded px-1.5 py-0.5 transition-colors"
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
            {/* Totals row */}
            <tfoot className="bg-slate-50 border-t border-slate-200">
              <tr className="text-[9px] font-bold text-slate-500 uppercase">
                <td className="px-4 py-2.5">Totales</td>
                {allLoans.map((loan) => (
                  <td key={loan.id} className="px-4 py-2.5 text-center border-l border-slate-200">
                    <div className="text-[10px] text-slate-700 font-bold">{formatEur(loan.total_debt)}</div>
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

      {/* Additional Debts Section */}
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
                  const col = allCollaterals.find((c) => c.id === debt.collateral_id);
                  return (
                    <tr key={debt.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-600 text-[10px]">{col?.address || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          debt.type === 'IBI' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>{debt.type}</span>
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
    </div>
  );
}
