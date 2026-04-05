import type { Case, Loan, Collateral, LoanCollateral } from '../../types';
import { STRATEGY_LABELS } from '../../types';

interface Props {
  c: Case;
}

export default function CollateralMatrix({ c }: Props) {
  const { loans, collaterals, loan_collaterals } = c;

  function getLienRank(loanId: string, collateralId: string): number | null {
    const lc = loan_collaterals.find(
      (r) => r.loan_id === loanId && r.collateral_id === collateralId
    );
    return lc ? lc.lien_rank : null;
  }

  function formatEur(n: number) {
    return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
  }

  if (loans.length === 0 && collaterals.length === 0) {
    return <p className="text-xs text-slate-400 italic p-3">Sin datos de garantias</p>;
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex-1 flex flex-col">
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-full">
          <thead className="sticky top-0 z-10 bg-slate-100 shadow-sm">
            <tr className="border-b border-slate-200">
              <th className="p-3 text-[9px] font-bold text-slate-500 uppercase min-w-[140px]">
                Garantia / Ubicacion
              </th>
              {loans.map((loan) => (
                <th key={loan.id} className="p-3 text-[9px] font-bold text-slate-500 uppercase text-center border-l border-slate-200">
                  <div className="text-[#1a61a6]">{loan.loan_reference}</div>
                  <div className="text-[8px] normal-case font-medium">
                    {formatEur(loan.upb)} / {formatEur(loan.total_debt)}
                  </div>
                </th>
              ))}
              <th className="p-3 text-[9px] font-bold text-slate-500 uppercase text-center border-l border-slate-200">
                Est. Jud.
              </th>
              <th className="p-3 text-[9px] font-bold text-slate-500 uppercase border-l border-slate-200">
                Estrategia
              </th>
            </tr>
          </thead>
          <tbody className="text-[10px]">
            {collaterals.map((col) => {
              const colAsAny = col as Collateral & Record<string, unknown>;
              return (
                <tr key={col.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-slate-800 leading-tight">{col.address}</div>
                    <div className="text-[9px] text-slate-400 mb-1">
                      {col.property_type}{col.surface_sqm ? ` - ${col.surface_sqm} m\u00B2` : ''}
                    </div>
                    {col.cadastral_ref && (
                      <div className="text-[8px] text-slate-400">Ref: {col.cadastral_ref}</div>
                    )}
                  </td>
                  {loans.map((loan) => {
                    const rank = getLienRank(loan.id, col.id);
                    return (
                      <td key={loan.id} className="p-3 text-center border-l border-slate-50">
                        {rank !== null ? (
                          <span className="bg-[#1a61a6]/10 text-[#1a61a6] px-2 py-0.5 rounded font-bold">
                            {rank}\u00AA
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-3 text-center border-l border-slate-50">
                    <span className={`px-1.5 py-0.5 rounded-sm font-bold uppercase text-[8px] ${
                      c.legal_status === 'judicial'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.legal_status === 'judicial' ? (c.legal_procedure_type || 'Judicial') : 'Extrajudicial'}
                    </span>
                  </td>
                  <td className="p-3 border-l border-slate-50">
                    <span className="text-[10px] font-bold text-[#1a61a6]">
                      {STRATEGY_LABELS[c.strategy]}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Map link */}
      {collaterals.some((col) => col.latitude && col.longitude) && (
        <div className="h-10 bg-slate-100 flex items-center justify-end px-3 shrink-0 border-t border-slate-200">
          {collaterals.filter((col) => col.latitude && col.longitude).map((col) => (
            <a
              key={col.id}
              href={`https://maps.google.com/?q=${col.latitude},${col.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white px-3 py-1 rounded text-[9px] font-bold text-[#1a61a6] shadow-sm flex items-center gap-1.5 hover:bg-slate-50 transition-all uppercase"
            >
              Google Maps
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
