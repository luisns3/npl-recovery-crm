import type { Proposal, Probability } from '../../types';
import { STRATEGY_LABELS, PROBABILITY_LABELS } from '../../types';
import { useCrm } from '../../context/CrmContext';

interface ProposalWithMeta extends Proposal {
  case_ref: string;
  borrower: string;
  case_id?: string;
  group_id?: string | null;
}

interface Props {
  proposals: ProposalWithMeta[];
}

const PROB_DOT: Record<Probability, string> = {
  firmada: 'bg-emerald-500',
  deals: 'bg-blue-500',
  focus: 'bg-amber-500',
  pre_pipe: 'bg-slate-400',
  cancelled: 'bg-red-300',
};

function formatEur(n: number): string {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

export default function ProposalTable({ proposals }: Props) {
  const { openGroup } = useCrm();
  const active = proposals.filter((p) => !p.cancelled_at);
  const cancelled = proposals.filter((p) => p.cancelled_at);
  const all = [...active, ...cancelled];

  const totalAmount = active.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-[#002446]">Listado de Propuestas</h3>
          <p className="text-[10px] text-slate-400">{all.length} propuestas ({active.length} activas)</p>
        </div>
        <button className="text-[10px] font-bold text-[#1a61a6] bg-[#1a61a6]/5 px-3 py-1.5 rounded-lg hover:bg-[#1a61a6]/10 transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar Excel
        </button>
      </div>
      <div className="overflow-x-auto max-h-96 overflow-y-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
              <th className="px-5 py-3">Expediente</th>
              <th className="px-5 py-3">Deudor</th>
              <th className="px-5 py-3">Estrategia</th>
              <th className="px-5 py-3">Probabilidad</th>
              <th className="px-5 py-3 text-right">Importe</th>
              <th className="px-5 py-3">Condiciones</th>
              <th className="px-5 py-3">Cierre Esperado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {all.map((p) => (
              <tr
                key={p.id}
                onClick={() => p.case_id && openGroup(p.group_id || p.case_id)}
                className={`hover:bg-slate-50 transition-colors ${p.case_id ? 'cursor-pointer' : ''} ${p.cancelled_at ? 'opacity-40' : ''}`}
              >
                <td className="px-5 py-3 font-bold text-[#1a61a6]">{p.case_ref}</td>
                <td className="px-5 py-3 text-slate-700">{p.borrower}</td>
                <td className="px-5 py-3">
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                    {STRATEGY_LABELS[p.strategy_type]}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${PROB_DOT[p.probability]}`} />
                    <span className="font-medium">{PROBABILITY_LABELS[p.probability]}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right font-bold text-slate-900">
                  {p.cancelled_at ? <span className="line-through">{formatEur(p.amount)}</span> : formatEur(p.amount)}
                </td>
                <td className="px-5 py-3 text-slate-500">
                  {p.payment_terms === 'installments' && p.installment_count
                    ? `${p.installment_count} plazos`
                    : 'Pago unico'}
                </td>
                <td className="px-5 py-3 text-slate-500">{p.expected_closing_date}</td>
              </tr>
            ))}
          </tbody>
          {active.length > 0 && (
            <tfoot className="sticky bottom-0 bg-slate-100 border-t-2 border-slate-300">
              <tr className="text-xs font-black text-[#002446]">
                <td className="px-5 py-3" colSpan={4}>TOTAL ACTIVAS</td>
                <td className="px-5 py-3 text-right">{formatEur(totalAmount)} EUR</td>
                <td className="px-5 py-3" colSpan={2}>{active.length} propuestas</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
