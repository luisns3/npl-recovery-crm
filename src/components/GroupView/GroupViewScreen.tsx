import { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import type { Affordability } from '../../types';
import { STRATEGY_LABELS } from '../../types';
import GroupMap from './GroupMap';
import ResumenTab from './tabs/ResumenTab';
import ParticipantesTab from './tabs/ParticipantesTab';
import LegalTab from './tabs/LegalTab';
import PropuestasTab from './tabs/PropuestasTab';
import ActividadTab from './tabs/ActividadTab';
import DocumentosTab from './tabs/DocumentosTab';

type TabKey = 'resumen' | 'participantes' | 'legal' | 'propuestas' | 'actividad' | 'documentos';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'resumen', label: 'Resumen' },
  { key: 'participantes', label: 'Participantes' },
  { key: 'legal', label: 'Legal' },
  { key: 'propuestas', label: 'Propuestas' },
  { key: 'actividad', label: 'Actividad' },
  { key: 'documentos', label: 'Documentos' },
];

function formatEur(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString('es-ES');
}

export default function GroupViewScreen() {
  const { cases, currentGroupId, navigate, blockPhone, refreshCases } = useCrm();
  const [activeTab, setActiveTab] = useState<TabKey>('resumen');

  const groupCases = useMemo(
    () => cases.filter((c) => c.group_id === currentGroupId || (!c.group_id && c.id === currentGroupId)),
    [cases, currentGroupId]
  );

  const allCollaterals = useMemo(() => {
    const seen = new Set<string>();
    return groupCases.flatMap((c) => c.collaterals).filter((col) => {
      if (seen.has(col.id)) return false;
      seen.add(col.id);
      return true;
    });
  }, [groupCases]);

  const allLoans = useMemo(() => groupCases.flatMap((c) => c.loans), [groupCases]);
  const allLoanCollaterals = useMemo(() => groupCases.flatMap((c) => c.loan_collaterals), [groupCases]);

  const allParties = useMemo(() => {
    const seen = new Set<string>();
    return groupCases.flatMap((c) => c.parties).filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [groupCases]);

  const allContacts = useMemo(() => {
    const seen = new Set<string>();
    return groupCases.flatMap((c) => c.contacts).filter((ct) => {
      if (seen.has(ct.id)) return false;
      seen.add(ct.id);
      return true;
    });
  }, [groupCases]);

  const allInteractions = useMemo(
    () =>
      [...groupCases.flatMap((c) => c.interactions)].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [groupCases]
  );

  const allProposals = useMemo(() => groupCases.flatMap((c) => c.proposals), [groupCases]);
  const allAlerts = useMemo(() => groupCases.flatMap((c) => c.alerts), [groupCases]);
  const allDocumentRequests = useMemo(() => groupCases.flatMap((c) => c.document_requests || []), [groupCases]);

  // Mock affordabilities until DB is wired
  const allAffordabilities: Affordability[] = [];

  const totalUPB = allLoans.reduce((s, l) => s + l.upb, 0);
  const totalDebt = allLoans.reduce((s, l) => s + l.total_debt, 0);
  const primaryBorrower = allParties.find((p) => p.role === 'borrower');
  const activeAlerts = allAlerts.filter((a) => !a.resolved_at);
  const activeProposals = allProposals.filter((p) => !p.cancelled_at);

  const closestAuctionDays = useMemo(() => {
    const days = groupCases
      .filter((c) => c.auction_date)
      .map((c) => Math.ceil((new Date(c.auction_date!).getTime() - Date.now()) / 86400000))
      .filter((d) => d >= 0)
      .sort((a, b) => a - b);
    return days.length > 0 ? days[0] : null;
  }, [groupCases]);

  const bestProbability = useMemo(() => {
    const probs = ['deals', 'focus', 'pre_pipe'] as const;
    return probs.find((p) => activeProposals.some((pr) => pr.probability === p)) || null;
  }, [activeProposals]);

  const PROB_LABEL: Record<string, string> = { deals: 'Deals', focus: 'Focus', pre_pipe: 'Pre-Pipe' };

  if (groupCases.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-slate-400 text-sm">Grupo no encontrado</p>
      </div>
    );
  }

  async function handleAddNote(_comment: string) {
    // TODO: wire to logInteraction with type='note' for correct case in group
    await refreshCases();
  }

  const tabAlertCounts: Partial<Record<TabKey, number>> = {
    actividad: allInteractions.length,
    propuestas: activeProposals.length,
    legal: groupCases.filter((c) => c.legal_status === 'judicial').length,
    documentos: allDocumentRequests.filter((d) => d.status === 'pending').length,
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-slate-50">
      {/* HEADER */}
      <header className="bg-[#002446] text-white px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          {/* Back button */}
          <button
            onClick={() => navigate('call_queue')}
            className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-[10px] font-bold uppercase tracking-widest">Volver</span>
          </button>

          <div className="border-l border-white/10 pl-6 flex items-center gap-3">
            <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
              {currentGroupId?.substring(0, 12)}...
            </span>
            <h1 className="text-sm font-extrabold tracking-tight uppercase">
              {primaryBorrower?.name || 'Grupo sin nombre'}
            </h1>
          </div>

          {/* Key metrics */}
          <div className="flex gap-5 border-l border-white/10 pl-6">
            <div>
              <p className="text-[8px] font-bold text-white/50 uppercase tracking-wider">UPB</p>
              <p className="text-xs font-extrabold">{formatEur(totalUPB)} EUR</p>
            </div>
            <div>
              <p className="text-[8px] font-bold text-white/50 uppercase tracking-wider">Deuda Total</p>
              <p className="text-xs font-extrabold">{formatEur(totalDebt)} EUR</p>
            </div>
            <div>
              <p className="text-[8px] font-bold text-white/50 uppercase tracking-wider">Expedientes</p>
              <p className="text-xs font-extrabold">{groupCases.length}</p>
            </div>
            <div>
              <p className="text-[8px] font-bold text-white/50 uppercase tracking-wider">Estrategia</p>
              <p className="text-xs font-extrabold">{STRATEGY_LABELS[groupCases[0].strategy]}</p>
            </div>
          </div>
        </div>

        {/* Right: badges */}
        <div className="flex items-center gap-2">
          {closestAuctionDays !== null && (
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase ${
              closestAuctionDays <= 30 ? 'bg-red-500' : 'bg-white/20'
            }`}>
              Subasta: {closestAuctionDays}d
            </span>
          )}
          {bestProbability && (
            <span className={`text-[9px] font-bold px-2 py-1 rounded-full uppercase bg-white/20`}>
              {PROB_LABEL[bestProbability]}
            </span>
          )}
          {activeAlerts.length > 0 && (
            <span className="bg-red-500 text-[9px] font-bold px-2 py-1 rounded-full uppercase">
              {activeAlerts.length} Alerta{activeAlerts.length !== 1 ? 's' : ''}
            </span>
          )}
          {groupCases.some((c) => c.legal_status === 'judicial') && (
            <span className="bg-blue-500/80 text-[9px] font-bold px-2 py-1 rounded-full uppercase">Judicial</span>
          )}
          {/* Case references */}
          <div className="flex gap-1 border-l border-white/10 pl-3 ml-1">
            {groupCases.slice(0, 3).map((c) => (
              <span key={c.id} className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded font-mono">{c.reference}</span>
            ))}
            {groupCases.length > 3 && (
              <span className="text-[8px] text-white/50">+{groupCases.length - 3}</span>
            )}
          </div>
        </div>
      </header>

      {/* MAP + STATS ROW */}
      <div className="h-[320px] shrink-0 flex border-b border-slate-200">
        {/* Map 60% */}
        <div className="w-[60%] border-r border-slate-200">
          <GroupMap collaterals={allCollaterals} />
        </div>

        {/* Stat cards 40% */}
        <div className="flex-1 bg-white p-4 grid grid-cols-2 gap-3 content-start">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Garantias</p>
            <p className="text-2xl font-black text-[#002446]">{allCollaterals.length}</p>
            <p className="text-[9px] text-slate-400 mt-1">
              {allCollaterals.filter((c) => c.latitude).length} geolocalizadas
            </p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Prestamos</p>
            <p className="text-2xl font-black text-[#002446]">{allLoans.length}</p>
            <p className="text-[9px] text-slate-400 mt-1">
              {formatEur(totalDebt)} EUR total
            </p>
          </div>
          <div className={`rounded-xl border p-3.5 ${activeAlerts.length > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
            <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${activeAlerts.length > 0 ? 'text-red-500' : 'text-slate-400'}`}>
              Alertas Activas
            </p>
            <p className={`text-2xl font-black ${activeAlerts.length > 0 ? 'text-red-600' : 'text-[#002446]'}`}>{activeAlerts.length}</p>
            <p className="text-[9px] text-slate-400 mt-1">{allAlerts.length} totales</p>
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Propuestas Activas</p>
            <p className="text-2xl font-black text-[#002446]">{activeProposals.length}</p>
            <p className="text-[9px] text-slate-400 mt-1">
              {allProposals.filter((p) => p.cancelled_at).length} canceladas
            </p>
          </div>
          <div className="col-span-2 bg-[#002446]/3 rounded-xl border border-[#002446]/10 p-3.5">
            <p className="text-[9px] font-bold text-[#002446]/50 uppercase tracking-widest mb-1">Participantes</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-black text-[#002446]">{allParties.length}</p>
              <div className="flex flex-wrap gap-1">
                {allParties.slice(0, 4).map((p) => (
                  <span key={p.id} className="text-[9px] bg-white border border-slate-200 px-1.5 py-0.5 rounded-full text-slate-700">
                    {p.name.split(' ')[0]}
                  </span>
                ))}
                {allParties.length > 4 && (
                  <span className="text-[9px] text-slate-400">+{allParties.length - 4}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB BAR */}
      <div className="bg-white border-b border-slate-200 shrink-0">
        <div className="flex px-6">
          {TABS.map((tab) => {
            const count = tabAlertCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`relative px-5 py-3.5 border-b-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                  activeTab === tab.key
                    ? 'border-[#1a61a6] text-[#1a61a6]'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-[#1a61a6]/10 text-[#1a61a6]'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'resumen' && (
          <ResumenTab
            groupCases={groupCases}
            allCollaterals={allCollaterals}
            allLoans={allLoans}
            allLoanCollaterals={allLoanCollaterals}
            onStrategyChange={async (_caseId, _loanId, _strategy) => { await refreshCases(); }}
          />
        )}
        {activeTab === 'participantes' && (
          <ParticipantesTab
            groupCases={groupCases}
            allParties={allParties}
            allContacts={allContacts}
            allAffordabilities={allAffordabilities}
            onAddContact={async (_partyId, _type, _value) => {
              // TODO: addContact requires currentCaseId — wire group-specific mutation
              await refreshCases();
            }}
            onBlockContact={async (contactId, reason) => {
              await blockPhone(contactId, reason);
            }}
          />
        )}
        {activeTab === 'legal' && (
          <LegalTab
            groupCases={groupCases}
            allLoans={allLoans}
            allCollaterals={allCollaterals}
          />
        )}
        {activeTab === 'propuestas' && (
          <PropuestasTab allProposals={allProposals} />
        )}
        {activeTab === 'actividad' && (
          <ActividadTab
            allInteractions={allInteractions}
            onAddNote={handleAddNote}
          />
        )}
        {activeTab === 'documentos' && (
          <DocumentosTab documentRequests={allDocumentRequests} />
        )}
      </div>
    </div>
  );
}
