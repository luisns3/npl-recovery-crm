import { useState, useEffect, useRef } from 'react';
import { useCrm, useCurrentCase } from '../../context/CrmContext';
import type { CallResult, Party } from '../../types';
import { CALL_RESULT_LABELS, STRATEGY_LABELS } from '../../types';
import CollateralMatrix from './CollateralMatrix';
import ProposalHistory from './ProposalHistory';
import AffordabilityPanel from './AffordabilityPanel';

const CALL_RESULTS: { key: CallResult; label: string; icon: string; color: string; hoverBg: string; borderColor: string }[] = [
  { key: 'cup', label: 'CUP', icon: '\u2713', color: 'text-emerald-600', hoverBg: 'hover:bg-emerald-50', borderColor: 'border-emerald-100' },
  { key: 'cun', label: 'CUN', icon: '\u2717', color: 'text-red-600', hoverBg: 'hover:bg-red-50', borderColor: 'border-red-100' },
  { key: 'not_answering', label: 'No\ncontesta', icon: '\u2298', color: 'text-slate-500', hoverBg: 'hover:bg-slate-50', borderColor: 'border-slate-200' },
  { key: 'wrong_number', label: 'Tercero\nEquiv.', icon: '!', color: 'text-orange-600', hoverBg: 'hover:bg-orange-50', borderColor: 'border-orange-100' },
  { key: 'callback', label: 'Callback', icon: '\u21BA', color: 'text-purple-600', hoverBg: 'hover:bg-purple-50', borderColor: 'border-purple-100' },
];

function formatEur(n: number) {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 0 });
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
}

export default function ActiveCallScreen() {
  const c = useCurrentCase();
  const { logCall, advanceToNextCase, goToDashboard, queue, queueIndex } = useCrm();

  const [selectedResult, setSelectedResult] = useState<CallResult | null>(null);
  const [comment, setComment] = useState('');
  const [selectedPartyIdx, setSelectedPartyIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  if (!c) return null;

  const parties = c.parties;
  const selectedParty = parties[selectedPartyIdx] || parties[0];
  const primaryPhone = c.contacts.find((ct) => ct.type === 'phone' && !ct.is_blocked);
  const totalUpb = c.loans.reduce((s, l) => s + l.upb, 0);
  const totalDebt = c.loans.reduce((s, l) => s + l.total_debt, 0);
  const borrower = parties.find((p) => p.role === 'borrower');

  // Compute LTV (simplified: total debt / first collateral valuation placeholder)
  const ltvDisplay = '--';

  const auctionDays = c.auction_date ? daysUntil(c.auction_date) : null;

  const canSave = selectedResult !== null && comment.trim().length >= 10;

  const nextCase = queueIndex + 1 < queue.length ? queue[queueIndex + 1] : null;
  const nextBorrower = nextCase?.parties.find((p) => p.role === 'borrower');

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');

  async function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await logCall(selectedResult!, comment.trim());
      advanceToNextCase();
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    advanceToNextCase();
  }

  function handleClose() {
    goToDashboard();
  }

  // Interaction history (most recent first)
  const interactions = [...c.interactions].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const RESULT_BADGE_COLORS: Record<string, string> = {
    cup: 'bg-emerald-100 text-emerald-700',
    cun: 'bg-red-100 text-red-700',
    not_answering: 'bg-slate-100 text-slate-500',
    wrong_number: 'bg-orange-100 text-orange-700',
    voicemail: 'bg-slate-100 text-slate-500',
    callback: 'bg-purple-100 text-purple-700',
    refused: 'bg-red-100 text-red-700',
    third_party: 'bg-amber-100 text-amber-700',
  };

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Hace ${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `Hace ${days} dia${days > 1 ? 's' : ''}`;
    const weeks = Math.floor(days / 7);
    return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[1440px] h-[calc(100vh-2rem)] max-h-[972px] bg-[#f8f9ff] rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-slate-300/30">
        {/* HEADER */}
        <header className="px-6 py-3 bg-[#1a61a6] text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded font-bold uppercase">
                {c.reference}
              </span>
              <h2 className="font-sans text-sm font-extrabold tracking-tight uppercase border-l border-white/20 pl-3">
                {borrower?.name || 'Sin nombre'}
              </h2>
            </div>
            <div className="flex gap-6 border-l border-white/10 pl-6">
              <div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider leading-none mb-1">Total UPB</p>
                <p className="text-xs font-extrabold">{formatEur(totalUpb)} EUR</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider leading-none mb-1">Deuda Total</p>
                <p className="text-xs font-extrabold">{formatEur(totalDebt)} EUR</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider leading-none mb-1">LTV</p>
                <p className="text-xs font-extrabold text-emerald-400">{ltvDisplay}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end pr-4 border-r border-white/10">
              <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">Hito Legal</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-white">
                  {c.legal_milestone || (c.legal_status === 'judicial' ? 'Judicial' : 'Extrajudicial')}
                </span>
                {auctionDays !== null && auctionDays >= 0 && (
                  <span className="bg-red-500 text-[9px] px-1.5 py-0.5 rounded font-black uppercase">
                    Subasta: {auctionDays}d
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-full border border-emerald-500/30">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xs font-bold">{mm}:{ss}</span>
            </div>
            <button
              onClick={handleClose}
              className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
              title="Cerrar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* LEFT PANEL: Matrix + Proposals */}
          <aside className="w-[45%] border-r border-slate-200/50 flex flex-col bg-slate-50/50 overflow-hidden">
            <div className="p-4 flex-1 flex flex-col overflow-hidden">
              <h3 className="text-[10px] font-bold text-[#1a61a6] uppercase tracking-widest flex items-center gap-2 mb-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                Matriz de Garantias
              </h3>
              <CollateralMatrix c={c} />
            </div>

            <div className="p-4 pt-0 shrink-0 border-t border-slate-200/30">
              <h3 className="text-[10px] font-bold text-[#1a61a6] uppercase tracking-widest flex items-center gap-2 my-3">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Historial de Propuestas
              </h3>
              <ProposalHistory proposals={c.proposals} />
            </div>
          </aside>

          {/* RIGHT PANEL: Call + Comment + History + Affordability */}
          <main className="flex-1 flex flex-col bg-white overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Party Tabs */}
              <div className="flex items-center gap-1 mb-3 border-b border-slate-200">
                {parties.map((party, idx) => (
                  <button
                    key={party.id}
                    onClick={() => setSelectedPartyIdx(idx)}
                    className={`px-6 py-3 border-b-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                      idx === selectedPartyIdx
                        ? 'border-[#1a61a6] text-[#1a61a6] font-extrabold'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {party.name} ({party.role.replace('_', ' ')})
                  </button>
                ))}
              </div>

              {/* Contact + Call Result Buttons */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1a61a6] flex items-center justify-center text-white shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-extrabold text-[#1a61a6] leading-tight">{selectedParty?.name}</p>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {selectedParty?.role.replace('_', ' ')}
                      </span>
                      {primaryPhone && (
                        <span className="text-sm font-bold text-[#1a61a6]/80">{primaryPhone.value}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {CALL_RESULTS.map((r) => (
                    <button
                      key={r.key}
                      onClick={() => setSelectedResult(r.key)}
                      className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl border bg-white transition-all group ${
                        selectedResult === r.key
                          ? `${r.borderColor} ring-2 ring-[#1a61a6] ${r.hoverBg}`
                          : `${r.borderColor} ${r.hoverBg}`
                      }`}
                    >
                      <span className={`text-xl mb-1 group-hover:scale-110 transition-transform ${r.color}`}>
                        {r.icon}
                      </span>
                      <span className={`text-[9px] font-bold leading-tight text-center whitespace-pre-line ${r.color}`}>
                        {r.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment + History Row */}
              <div className="flex gap-6 mt-6 mb-6">
                <div className="flex-1 flex flex-col gap-6">
                  {/* Comment */}
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                      Comentario *
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-[#1a61a6] focus:ring-0 text-sm p-4 rounded-2xl resize-none h-[200px] placeholder:text-slate-400"
                      placeholder="Detalle el contenido de la conversacion y acuerdos alcanzados..."
                    />
                    {comment.length > 0 && comment.length < 10 && (
                      <p className="text-[9px] text-red-500 mt-1">Minimo 10 caracteres ({comment.length}/10)</p>
                    )}
                  </div>

                  {/* Interaction History */}
                  <div className="flex flex-col">
                    <h3 className="text-[10px] font-bold text-[#1a61a6] uppercase tracking-widest flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Historial de gestion
                    </h3>
                    <div className="h-60 overflow-y-auto space-y-3 custom-scrollbar pr-2 border border-slate-100 rounded-2xl p-3 bg-slate-50/30">
                      {interactions.length === 0 && (
                        <p className="text-[10px] text-slate-400 italic p-2">Sin interacciones previas</p>
                      )}
                      {interactions.map((inter, idx) => (
                        <div
                          key={inter.id}
                          className={`bg-white p-3 rounded-xl border border-slate-100 shadow-sm ${idx > 1 ? 'opacity-60' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-[10px] font-bold text-[#1a61a6]">
                              {inter.created_by.substring(0, 8)}...
                            </span>
                            {inter.call_result && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                RESULT_BADGE_COLORS[inter.call_result] || 'bg-slate-100 text-slate-500'
                              }`}>
                                {CALL_RESULT_LABELS[inter.call_result]}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed mb-1">{inter.comment}</p>
                          <span className="text-[9px] text-slate-400 font-medium italic">
                            {timeAgo(inter.created_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Affordability Panel */}
                <div className="w-80 flex flex-col shrink-0">
                  {selectedParty && <AffordabilityPanel party={selectedParty} />}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-4">
                <button className="px-5 py-2.5 rounded-xl border border-[#1a61a6]/20 bg-[#1a61a6]/5 flex items-center gap-2 hover:bg-[#1a61a6]/10 transition-all">
                  <svg className="w-5 h-5 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-[#1a61a6] uppercase leading-none">Crear Alerta</p>
                    <p className="text-[8px] text-slate-500">Recordatorio</p>
                  </div>
                </button>
                <button className="px-5 py-2.5 rounded-xl border border-[#1a61a6]/20 bg-[#1a61a6]/5 flex items-center gap-2 hover:bg-[#1a61a6]/10 transition-all">
                  <svg className="w-5 h-5 text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-[#1a61a6] uppercase leading-none">Nueva Propuesta</p>
                    <p className="text-[8px] text-slate-500">Plan de pagos</p>
                  </div>
                </button>
              </div>
            </div>

            {/* FOOTER */}
            <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-slate-400 uppercase leading-none">Siguiente en cola</span>
                  <span className="text-[10px] font-bold text-slate-700">
                    {nextCase
                      ? `${nextBorrower?.name || 'Sin nombre'} (${nextCase.reference})`
                      : 'Fin de cola'}
                  </span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="px-10 h-12 bg-[#1a61a6] text-white rounded-xl font-sans font-extrabold text-[11px] uppercase tracking-widest shadow-lg shadow-[#1a61a6]/20 hover:bg-slate-800 disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none transition-all flex items-center gap-3"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  {saving ? 'GUARDANDO...' : 'GUARDAR Y FINALIZAR'}
                </button>
                <button
                  onClick={handleSkip}
                  className="w-12 h-12 bg-white border border-slate-300 text-slate-400 rounded-xl hover:text-[#1a61a6] hover:border-[#1a61a6] transition-all flex items-center justify-center"
                  title="Pasar siguiente sin guardar"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
