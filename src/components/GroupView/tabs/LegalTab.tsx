import type { Case, InsolvencyProceeding } from '../../../types';
import { getMilestoneCategory, MILESTONE_STYLES } from '../../shared/legalMilestone';

interface Props {
  groupCases: Case[];
  allLoans: { id: string; case_id: string; loan_reference: string; strategy: unknown; upb: number; total_debt: number; procedimiento_id?: string | null }[];
  allCollaterals: { id: string; address: string; property_type: string; occupancy_status: string }[];
  allLoanCollaterals: { loan_id: string; collateral_id: string; lien_rank: number; is_enforced?: boolean }[];
}

const OCCUPANCY_LABELS: Record<string, string> = {
  debtor_occupied: 'Ocupado - Deudor',
  legal_tenant: 'Inquilino Legal',
  illegal_occupant: 'Ocupacion Ilegal',
  vacant: 'Desocupado',
  unknown: 'Desconocido',
};

const OCCUPANCY_BADGE: Record<string, string> = {
  debtor_occupied: 'bg-blue-100 text-blue-700',
  legal_tenant: 'bg-emerald-100 text-emerald-700',
  illegal_occupant: 'bg-red-100 text-red-700',
  vacant: 'bg-slate-100 text-slate-500',
  unknown: 'bg-amber-100 text-amber-600',
};

const INSOLVENCY_ROLE_LABELS: Record<string, string> = {
  deudor: 'Deudor Concursal',
  acreedor: 'Acreedor',
  administrador_concursal: 'Administrador Concursal',
};

const INSOLVENCY_STATUS_BADGE: Record<string, string> = {
  activo: 'bg-red-100 text-red-700',
  pendiente: 'bg-amber-100 text-amber-700',
  resuelto: 'bg-emerald-100 text-emerald-700',
};

export default function LegalTab({ groupCases, allLoans, allCollaterals, allLoanCollaterals }: Props) {
  const allInsolvencies: (InsolvencyProceeding & { borrowerName: string })[] = groupCases.flatMap((c) =>
    (c.insolvency_proceedings || []).map((ip) => ({
      ...ip,
      borrowerName: c.parties.find((p) => p.id === ip.party_id)?.name || 'Desconocido',
    }))
  );

  function getLoanCase(loanId: string) {
    return groupCases.find((c) => c.loans.some((l) => l.id === loanId));
  }

  // For a given loan, get its collaterals and whether each is enforced
  function getLoanCollaterals(loanId: string) {
    return allLoanCollaterals
      .filter((r) => r.loan_id === loanId)
      .map((r) => ({
        ...r,
        collateral: allCollaterals.find((c) => c.id === r.collateral_id),
      }))
      .filter((r) => r.collateral !== undefined);
  }

  return (
    <div className="p-5 space-y-5">

      {/* ── Procedimientos judiciales por préstamo ─────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Procedimientos Judiciales</h3>
          <span className="text-[9px] text-slate-400 font-medium">— un procedimiento por préstamo; garantías ejecutadas indicadas</span>
        </div>

        <div className="divide-y divide-slate-100">
          {allLoans.map((loan) => {
            const parentCase = getLoanCase(loan.id);
            const loanCollaterals = getLoanCollaterals(loan.id);
            const enforcedCols = loanCollaterals.filter((r) => r.is_enforced);
            const nonEnforcedCols = loanCollaterals.filter((r) => !r.is_enforced);
            const cat = getMilestoneCategory(parentCase?.legal_status, parentCase?.legal_milestone);
            const milestoneStyle = MILESTONE_STYLES[cat];

            return (
              <div key={loan.id} className="px-5 py-4">
                {/* Loan header row */}
                <div className="flex flex-wrap items-start gap-x-6 gap-y-2">
                  <div className="min-w-[140px]">
                    <div className="text-xs font-black text-[#1a61a6]">{loan.loan_reference}</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">UPB {loan.upb?.toLocaleString('es-ES')} €</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {loan.procedimiento_id ? (
                      <span className="bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded border border-amber-200">
                        Proc. {loan.procedimiento_id}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sin procedimiento</span>
                    )}

                    {parentCase && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        parentCase.legal_status === 'judicial' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {parentCase.legal_status === 'judicial' ? 'Judicial' : 'Extrajudicial'}
                      </span>
                    )}

                    {parentCase?.legal_procedure_type && (
                      <span className="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {parentCase.legal_procedure_type}
                      </span>
                    )}

                    {parentCase?.legal_milestone && cat !== 'none' && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${milestoneStyle.badge}`}>
                        {parentCase.legal_milestone}
                      </span>
                    )}

                    {parentCase?.legal_milestone_date && (
                      <span className="text-[9px] text-slate-500">{parentCase.legal_milestone_date}</span>
                    )}

                    {parentCase?.auction_date && (
                      <span className={`text-[9px] font-bold ${
                        Math.ceil((new Date(parentCase.auction_date).getTime() - Date.now()) / 86400000) <= 30
                          ? 'text-red-600' : 'text-slate-600'
                      }`}>
                        Subasta: {parentCase.auction_date}
                      </span>
                    )}
                  </div>
                </div>

                {/* Collaterals backing this loan */}
                {loanCollaterals.length > 0 && (
                  <div className="mt-3 ml-4 space-y-1.5">
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Garantías del préstamo ({loanCollaterals.length})
                      {enforcedCols.length > 0 && (
                        <span className="ml-2 text-red-600">{enforcedCols.length} en ejecución</span>
                      )}
                    </div>
                    {loanCollaterals.map(({ collateral, lien_rank, is_enforced }) => {
                      if (!collateral) return null;
                      return (
                        <div
                          key={collateral.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[10px] border ${
                            is_enforced
                              ? 'bg-red-50 border-red-200'
                              : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          {/* Enforcement indicator */}
                          <div className="w-[70px] shrink-0">
                            {is_enforced ? (
                              <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded uppercase">
                                Ejecutada
                              </span>
                            ) : (
                              <span className="text-[8px] text-slate-400">No ejecutada</span>
                            )}
                          </div>

                          {/* Lien rank */}
                          <span className="text-[8px] font-bold text-[#1a61a6] bg-[#1a61a6]/10 px-1.5 py-0.5 rounded shrink-0">
                            {lien_rank}ª hipoteca
                          </span>

                          {/* Address & type */}
                          <div className="flex-1 min-w-0">
                            <a
                              href={`https://maps.google.com/?q=${encodeURIComponent(collateral.address)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="font-medium text-slate-700 hover:text-[#1a61a6] hover:underline truncate block"
                            >
                              {collateral.address}
                            </a>
                            <span className="text-[9px] text-slate-400">{collateral.property_type}</span>
                          </div>

                          {/* Occupancy */}
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${OCCUPANCY_BADGE[collateral.occupancy_status] || 'bg-slate-100 text-slate-500'}`}>
                            {OCCUPANCY_LABELS[collateral.occupancy_status] || collateral.occupancy_status}
                          </span>
                        </div>
                      );
                    })}

                    {/* Summary note when some collaterals are NOT enforced */}
                    {enforcedCols.length > 0 && nonEnforcedCols.length > 0 && (
                      <p className="text-[9px] text-slate-400 italic pl-1">
                        {nonEnforcedCols.length} garantía{nonEnforcedCols.length > 1 ? 's' : ''} del préstamo no incluida{nonEnforcedCols.length > 1 ? 's' : ''} en la ejecución.
                      </p>
                    )}
                    {loan.procedimiento_id && enforcedCols.length === 0 && loanCollaterals.length > 0 && (
                      <p className="text-[9px] text-slate-400 italic pl-1">
                        Ninguna garantía incluida en la ejecución hipotecaria (reclamación dineraria pura).
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Concurso de Acreedores ─────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Concurso de Acreedores</h3>
          </div>
          <button className="text-[10px] font-bold text-[#1a61a6] hover:underline flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Registrar concurso
          </button>
        </div>

        {allInsolvencies.length === 0 ? (
          <div className="px-5 py-8 flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-slate-400">Sin procedimientos concursales activos</p>
            {groupCases.some((c) => c.insolvency_status) && (
              <p className="text-[10px] text-amber-600">
                Estado detectado en expediente: {groupCases.find((c) => c.insolvency_status)?.insolvency_status}
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Participante</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Tribunal</th>
                  <th className="px-4 py-3">N° Autos</th>
                  <th className="px-4 py-3">Presentacion</th>
                  <th className="px-4 py-3">Resolucion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs">
                {allInsolvencies.map((ip) => (
                  <tr key={ip.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800 text-[11px]">{ip.borrowerName}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-600">{INSOLVENCY_ROLE_LABELS[ip.role] || ip.role}</td>
                    <td className="px-4 py-3">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${INSOLVENCY_STATUS_BADGE[ip.status] || 'bg-slate-100 text-slate-500'}`}>
                        {ip.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{ip.court || '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{ip.court_id || '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{ip.filing_date || '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{ip.resolution_date || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
