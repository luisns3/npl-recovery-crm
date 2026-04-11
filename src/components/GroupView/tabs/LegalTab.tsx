import type { Case, InsolvencyProceeding } from '../../../types';

interface Props {
  groupCases: Case[];
  allLoans: { id: string; case_id: string; loan_reference: string; strategy: unknown; upb: number; total_debt: number; procedimiento_id?: string | null }[];
  allCollaterals: { id: string; address: string; property_type: string; occupancy_status: string; procedimiento_id?: string | null }[];
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

export default function LegalTab({ groupCases, allLoans, allCollaterals }: Props) {
  const allInsolvencies: (InsolvencyProceeding & { borrowerName: string })[] = groupCases.flatMap((c) =>
    (c.insolvency_proceedings || []).map((ip) => ({
      ...ip,
      borrowerName: c.parties.find((p) => p.id === ip.party_id)?.name || 'Desconocido',
    }))
  );

  function getLoanCase(loanId: string) {
    return groupCases.find((c) => c.loans.some((l) => l.id === loanId));
  }

  return (
    <div className="p-5 space-y-5">
      {/* Loans Legal Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
          </svg>
          <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Estado Legal por Prestamo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Prestamo</th>
                <th className="px-4 py-3">ID Procedimiento</th>
                <th className="px-4 py-3">Estado Legal</th>
                <th className="px-4 py-3">Tipo Procedimiento</th>
                <th className="px-4 py-3">Hito Legal</th>
                <th className="px-4 py-3">Fecha Hito</th>
                <th className="px-4 py-3">Subasta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {allLoans.map((loan) => {
                const parentCase = getLoanCase(loan.id);
                return (
                  <tr key={loan.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-bold text-[#1a61a6]">{loan.loan_reference}</td>
                    <td className="px-4 py-3">
                      {loan.procedimiento_id ? (
                        <span className="bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded">{loan.procedimiento_id}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {parentCase && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          parentCase.legal_status === 'judicial' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {parentCase.legal_status === 'judicial' ? 'Judicial' : 'Extrajudicial'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-slate-600">{parentCase?.legal_procedure_type || '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-600">{parentCase?.legal_milestone || '—'}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-600">{parentCase?.legal_milestone_date || '—'}</td>
                    <td className="px-4 py-3">
                      {parentCase?.auction_date ? (
                        <span className={`text-[10px] font-bold ${
                          Math.ceil((new Date(parentCase.auction_date).getTime() - Date.now()) / 86400000) <= 30
                            ? 'text-red-600'
                            : 'text-slate-600'
                        }`}>
                          {parentCase.auction_date}
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Collaterals Legal Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Estado Legal por Garantia</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Garantia</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">ID Procedimiento</th>
                <th className="px-4 py-3">Ocupacion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {allCollaterals.map((col) => (
                <tr key={col.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-[11px]">
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(col.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-slate-800 hover:text-[#1a61a6] hover:underline"
                    >
                      {col.address}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-[10px] text-slate-500">{col.property_type}</td>
                  <td className="px-4 py-3">
                    {col.procedimiento_id ? (
                      <span className="bg-amber-50 text-amber-700 font-bold text-[10px] px-2 py-0.5 rounded">{col.procedimiento_id}</span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${OCCUPANCY_BADGE[col.occupancy_status] || 'bg-slate-100 text-slate-500'}`}>
                      {OCCUPANCY_LABELS[col.occupancy_status] || col.occupancy_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insolvency Proceedings */}
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
