import type { Loan, Case } from '../../../types';

interface Props {
  allLoans: Loan[];
  groupCases: Case[];
}

function eur(n: number | null | undefined, fallback = '—'): string {
  if (n == null) return fallback;
  return n.toLocaleString('es-ES', { maximumFractionDigits: 0 }) + ' €';
}

function PaidBar({ pct }: { pct: number }) {
  const clamped = Math.min(100, Math.max(0, pct));
  const color = clamped >= 80 ? 'bg-emerald-500' : clamped >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${clamped}%` }} />
      </div>
      <span className="text-[9px] font-bold text-slate-600 shrink-0 w-7 text-right">{clamped.toFixed(0)}%</span>
    </div>
  );
}

export default function DeudaTab({ allLoans, groupCases }: Props) {
  const totalUPB             = allLoans.reduce((s, l) => s + l.upb, 0);
  const totalOrdinary        = allLoans.reduce((s, l) => s + (l.ordinary_interest ?? 0), 0);
  const totalDefault         = allLoans.reduce((s, l) => s + (l.default_interest ?? 0), 0);
  const totalCostas          = allLoans.reduce((s, l) => s + (l.costas_gastos ?? 0), 0);
  const totalDebt            = allLoans.reduce((s, l) => s + l.total_debt, 0);
  const totalUnpaid          = allLoans.reduce((s, l) => s + (l.unpaid_instalments ?? 0), 0);

  // Enrich loans with their parent case for context
  const loanRows = allLoans.map(loan => {
    const parentCase = groupCases.find(c => c.loans.some(l => l.id === loan.id));
    const paidPct = loan.original_balance && loan.original_balance > 0
      ? ((loan.original_balance - loan.upb) / loan.original_balance) * 100
      : null;
    return { loan, parentCase, paidPct };
  });

  return (
    <div className="p-5 space-y-5">

      {/* ── Summary cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'UPB Total',          value: eur(totalUPB),     color: 'text-[#002446]' },
          { label: 'Int. Ordinarios',    value: eur(totalOrdinary), color: 'text-amber-700' },
          { label: 'Int. Demora',        value: eur(totalDefault),  color: 'text-red-600'   },
          { label: 'Costas y Gastos',    value: eur(totalCostas),   color: 'text-orange-600' },
          { label: 'Deuda Total',        value: eur(totalDebt),     color: 'text-[#002446]' },
          { label: 'Cuotas Impagadas',   value: totalUnpaid > 0 ? String(totalUnpaid) : '—', color: 'text-red-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
            <p className={`text-sm font-black leading-tight ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Per-loan table ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">Detalle por Préstamo</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 min-w-[150px]">Préstamo</th>
                <th className="px-4 py-3 text-right min-w-[110px]">Saldo Original</th>
                <th className="px-4 py-3 text-right min-w-[100px]">UPB</th>
                <th className="px-4 py-3 min-w-[130px]">% Capital Amortiz.</th>
                <th className="px-4 py-3 text-center min-w-[80px]">Cuotas Imp.</th>
                <th className="px-4 py-3 text-right min-w-[110px]">Int. Ordinarios</th>
                <th className="px-4 py-3 text-right min-w-[110px]">Int. Demora</th>
                <th className="px-4 py-3 text-right min-w-[110px]">Costas y Gastos</th>
                <th className="px-4 py-3 text-right min-w-[110px]">Deuda Total</th>
                <th className="px-4 py-3 min-w-[150px]">Último Pago</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-[11px]">
              {loanRows.map(({ loan, paidPct }) => (
                <tr key={loan.id} className="hover:bg-slate-50/60 transition-colors">

                  {/* Préstamo */}
                  <td className="px-4 py-3">
                    <div className="font-bold text-[#1a61a6]">{loan.loan_reference}</div>
                    {loan.procedimiento_id && (
                      <div className="text-[8px] text-amber-600 font-bold mt-0.5 bg-amber-50 rounded px-1 inline-block">
                        Proc. {loan.procedimiento_id}
                      </div>
                    )}
                  </td>

                  {/* Saldo original */}
                  <td className="px-4 py-3 text-right text-slate-600">
                    {eur(loan.original_balance)}
                  </td>

                  {/* UPB */}
                  <td className="px-4 py-3 text-right font-bold text-slate-900">
                    {eur(loan.upb)}
                  </td>

                  {/* % Capital amortizado */}
                  <td className="px-4 py-3">
                    {paidPct != null
                      ? <PaidBar pct={paidPct} />
                      : <span className="text-slate-300 text-[9px]">Sin saldo original</span>
                    }
                  </td>

                  {/* Cuotas impagadas */}
                  <td className="px-4 py-3 text-center">
                    {loan.unpaid_instalments != null
                      ? (
                        <span className={`font-black text-sm ${loan.unpaid_instalments > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {loan.unpaid_instalments}
                        </span>
                      )
                      : <span className="text-slate-300">—</span>
                    }
                  </td>

                  {/* Int. ordinarios */}
                  <td className="px-4 py-3 text-right">
                    <span className={loan.ordinary_interest ? 'text-amber-700 font-medium' : 'text-slate-300'}>
                      {eur(loan.ordinary_interest)}
                    </span>
                  </td>

                  {/* Int. demora */}
                  <td className="px-4 py-3 text-right">
                    <span className={loan.default_interest ? 'text-red-600 font-bold' : 'text-slate-300'}>
                      {eur(loan.default_interest)}
                    </span>
                  </td>

                  {/* Costas y gastos */}
                  <td className="px-4 py-3 text-right">
                    <span className={loan.costas_gastos ? 'text-orange-600 font-medium' : 'text-slate-300'}>
                      {eur(loan.costas_gastos)}
                    </span>
                  </td>

                  {/* Total deuda */}
                  <td className="px-4 py-3 text-right font-black text-slate-900">
                    {eur(loan.total_debt)}
                  </td>

                  {/* Último pago */}
                  <td className="px-4 py-3">
                    {loan.last_payment_date ? (
                      <div>
                        <div className="font-medium text-slate-700">{loan.last_payment_date}</div>
                        {loan.last_payment_amount != null && (
                          <div className="text-[9px] text-emerald-600 font-bold">{eur(loan.last_payment_amount)}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Totals */}
            <tfoot className="bg-slate-50 border-t-2 border-slate-200 text-[10px] font-black text-[#002446]">
              <tr>
                <td className="px-4 py-3">TOTAL</td>
                <td className="px-4 py-3 text-right">{eur(allLoans.reduce((s, l) => s + (l.original_balance ?? 0), 0) || null)}</td>
                <td className="px-4 py-3 text-right">{eur(totalUPB)}</td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-center text-red-600">{totalUnpaid > 0 ? totalUnpaid : '—'}</td>
                <td className="px-4 py-3 text-right text-amber-700">{eur(totalOrdinary || null)}</td>
                <td className="px-4 py-3 text-right text-red-600">{eur(totalDefault || null)}</td>
                <td className="px-4 py-3 text-right text-orange-600">{eur(totalCostas || null)}</td>
                <td className="px-4 py-3 text-right">{eur(totalDebt)}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
