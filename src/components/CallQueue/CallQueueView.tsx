import { useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { STRATEGY_LABELS, PROBABILITY_LABELS } from '../../types';
import type { Case } from '../../types';

interface GroupEntry {
  groupId: string | null;
  cases: Case[];
  primaryBorrower: string;
  totalDebt: number;
  daysSinceContact: number;
  alertCount: number;
  bestProbability: string | null;
  auctionDays: number | null;
  strategy: string;
}

function daysSinceContact(c: Case): number {
  const calls = c.interactions.filter((i) => i.type === 'call');
  if (calls.length === 0) return 9999;
  const latest = calls.reduce((a, b) => (a.created_at > b.created_at ? a : b));
  return Math.floor((Date.now() - new Date(latest.created_at).getTime()) / 86400000);
}

function daysUntilAuction(c: Case): number | null {
  if (!c.auction_date) return null;
  return Math.ceil((new Date(c.auction_date).getTime() - Date.now()) / 86400000);
}

export default function CallQueueView() {
  const { cases, openCase, startCalls } = useCrm();

  const groups = useMemo(() => {
    const groupMap = new Map<string, Case[]>();
    const nonResolved = cases.filter((c) => c.stage !== 'resolved');

    for (const c of nonResolved) {
      const key = c.group_id || c.id; // ungrouped cases use their own ID
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key)!.push(c);
    }

    const entries: GroupEntry[] = [...groupMap.entries()].map(([_key, groupCases]) => {
      const primary = groupCases[0];
      const borrower = primary.parties.find((p) => p.role === 'borrower')?.name || '-';
      const totalDebt = groupCases.reduce((s, c) => s + c.loans.reduce((ls, l) => ls + l.total_debt, 0), 0);
      const minDays = Math.min(...groupCases.map(daysSinceContact));
      const alerts = groupCases.reduce((s, c) => s + c.alerts.filter((a) => !a.resolved_at).length, 0);
      const allProposals = groupCases.flatMap((c) => c.proposals.filter((p) => !p.cancelled_at));
      const bestProb = allProposals.length > 0
        ? (['deals', 'focus', 'pre_pipe'] as const).find((p) => allProposals.some((pr) => pr.probability === p)) || null
        : null;
      const auctionDays = groupCases.map(daysUntilAuction).filter((d): d is number => d !== null);
      const closestAuction = auctionDays.length > 0 ? Math.min(...auctionDays) : null;

      return {
        groupId: primary.group_id,
        cases: groupCases,
        primaryBorrower: borrower,
        totalDebt,
        daysSinceContact: minDays,
        alertCount: alerts,
        bestProbability: bestProb,
        auctionDays: closestAuction,
        strategy: STRATEGY_LABELS[primary.strategy],
      };
    });

    // Sort: days since contact desc, alerts desc, auction asc
    return entries.sort((a, b) => {
      if (b.daysSinceContact !== a.daysSinceContact) return b.daysSinceContact - a.daysSinceContact;
      if (b.alertCount !== a.alertCount) return b.alertCount - a.alertCount;
      if (a.auctionDays !== null && b.auctionDays !== null) return a.auctionDays - b.auctionDays;
      if (a.auctionDays !== null) return -1;
      return 0;
    });
  }, [cases]);

  const PROB_DOT: Record<string, string> = {
    deals: 'bg-blue-500',
    focus: 'bg-amber-500',
    pre_pipe: 'bg-slate-400',
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#002446] tracking-tight">Cola de Llamadas</h1>
            <p className="text-sm text-slate-500">
              {groups.length} grupos ordenados por prioridad de contacto
            </p>
          </div>
          <button
            onClick={startCalls}
            className="bg-[#002446] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-[#002446]/20 hover:scale-[1.02] active:scale-95 transition-all text-sm"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            INICIAR LLAMADAS
          </button>
        </div>

        {/* Queue Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  <th className="px-5 py-4 w-8">#</th>
                  <th className="px-5 py-4">Grupo / Expediente</th>
                  <th className="px-5 py-4">Deudor Principal</th>
                  <th className="px-5 py-4">Estrategia</th>
                  <th className="px-5 py-4">Ult. Contacto</th>
                  <th className="px-5 py-4">Probabilidad</th>
                  <th className="px-5 py-4">Subasta</th>
                  <th className="px-5 py-4 text-right">Deuda Total</th>
                  <th className="px-5 py-4">Alertas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {groups.map((g, idx) => (
                  <tr
                    key={g.groupId || g.cases[0].id}
                    onClick={() => openCase(g.cases[0].id)}
                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4 text-xs text-slate-400 font-mono">{idx + 1}</td>
                    <td className="px-5 py-4">
                      <div className="text-xs font-bold text-[#1a61a6]">
                        {g.cases.map((c) => c.reference).join(', ')}
                      </div>
                      {g.groupId && (
                        <div className="text-[10px] text-slate-500 font-medium">{g.groupId}</div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-medium text-slate-900">{g.primaryBorrower}</td>
                    <td className="px-5 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                        {g.strategy}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold ${g.daysSinceContact > 30 ? 'text-red-600' : g.daysSinceContact === 9999 ? 'text-slate-400' : 'text-slate-600'}`}>
                        {g.daysSinceContact === 9999 ? 'Sin contacto' : `${g.daysSinceContact} dias`}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {g.bestProbability ? (
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${PROB_DOT[g.bestProbability] || 'bg-slate-300'}`} />
                          <span className="text-xs font-bold text-[#002446]">
                            {PROBABILITY_LABELS[g.bestProbability as keyof typeof PROBABILITY_LABELS] || g.bestProbability}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {g.auctionDays !== null ? (
                        <span className={`text-xs font-bold ${g.auctionDays <= 30 ? 'text-red-600' : 'text-slate-600'}`}>
                          {g.auctionDays}d
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right text-xs font-bold text-slate-900">
                      {(g.totalDebt / 1000).toFixed(0)}k
                    </td>
                    <td className="px-5 py-4">
                      {g.alertCount > 0 ? (
                        <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          {g.alertCount}
                        </span>
                      ) : (
                        <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
