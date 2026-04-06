import { useState, useEffect, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import type { Case } from '../../types';

const STORAGE_KEY = 'npl_crm_last_summary_date';

function isToday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth()
    && d.getDate() === now.getDate();
}

function isYesterday(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  return d.getFullYear() === yesterday.getFullYear()
    && d.getMonth() === yesterday.getMonth()
    && d.getDate() === yesterday.getDate();
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

interface SummaryStats {
  callsYesterday: number;
  avg7Days: number;
  avgTeam: number;
  trend: 'up' | 'down' | 'flat';
  legalPhaseChanges: Case[];
}

function computeStats(cases: Case[], userId: string): SummaryStats {
  // Count calls made by this user yesterday
  const callsYesterday = cases.reduce((count, c) => {
    return count + c.interactions.filter(
      (i) => i.type === 'call' && i.created_by === userId && isYesterday(i.created_at)
    ).length;
  }, 0);

  // Count calls made by this user in the last 7 days, compute daily average
  const last7DaysCalls = cases.reduce((count, c) => {
    return count + c.interactions.filter(
      (i) => i.type === 'call' && i.created_by === userId && isWithinDays(i.created_at, 7)
    ).length;
  }, 0);
  const avg7Days = Math.round(last7DaysCalls / 7);

  // Team average: all calls in last 7 days by anyone, divided by 7
  const allTeamCalls = cases.reduce((count, c) => {
    return count + c.interactions.filter(
      (i) => i.type === 'call' && isWithinDays(i.created_at, 7)
    ).length;
  }, 0);
  const avgTeam = Math.round(allTeamCalls / 7);

  const trend = callsYesterday > avg7Days ? 'up' : callsYesterday < avg7Days ? 'down' : 'flat';

  // Cases that changed legal phase in last 7 days but have no CUP or CUN since the change
  const legalPhaseChanges = cases.filter((c) => {
    if (!c.legal_milestone_date) return false;
    if (!isWithinDays(c.legal_milestone_date, 7)) return false;
    // Check if there's a CUP or CUN interaction after the milestone change
    const milestoneDate = new Date(c.legal_milestone_date);
    const hasCupCun = c.interactions.some(
      (i) => (i.call_result === 'cup' || i.call_result === 'cun')
        && new Date(i.created_at) >= milestoneDate
    );
    return !hasCupCun;
  });

  return { callsYesterday, avg7Days, avgTeam, trend, legalPhaseChanges };
}

interface Props {
  onDismiss: () => void;
  onOpenLegalAlerts: (cases: Case[]) => void;
}

export default function LoginSummaryPopup({ onDismiss, onOpenLegalAlerts }: Props) {
  const { cases } = useCrm();
  const { user } = useAuth();

  const stats = useMemo(
    () => computeStats(cases, user?.id || ''),
    [cases, user?.id]
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#002446]/40 backdrop-blur-sm p-4">
      <div className="bg-white/70 backdrop-blur-xl w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-[#002446] tracking-tight">
                Bienvenido de nuevo!
              </h2>
              <p className="text-gray-500 font-medium">Aqui tienes el resumen para hoy:</p>
            </div>
            <button
              onClick={onDismiss}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Llamadas ayer</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#002446]">{stats.callsYesterday}</span>
                {stats.trend === 'up' && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {stats.trend === 'down' && (
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Media 7 dias</p>
              <span className="text-2xl font-black text-[#002446]">{stats.avg7Days}</span>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tight mb-1">Media equipo</p>
              <span className="text-2xl font-black text-[#002446]">{stats.avgTeam}</span>
            </div>
          </div>

          {/* Legal Phase Changes Alert */}
          <div className="space-y-4">
            {stats.legalPhaseChanges.length > 0 && (
              <button
                onClick={() => onOpenLegalAlerts(stats.legalPhaseChanges)}
                className="w-full flex items-center gap-3 p-4 bg-purple-100/50 rounded-xl border border-purple-200/60 cursor-pointer hover:bg-purple-100/80 transition-colors text-left"
              >
                <svg className="w-6 h-6 text-purple-700 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-10h2v8h-2z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-bold text-[#002446] leading-tight">
                    {stats.legalPhaseChanges.length} expediente{stats.legalPhaseChanges.length !== 1 ? 's' : ''} cambiar{'on'} de fase legal
                  </p>
                  <p className="text-[11px] font-medium text-purple-700">
                    Ultimos 7 dias sin registro CUP/CUN
                  </p>
                </div>
                <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {stats.legalPhaseChanges.length === 0 && (
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200/60">
                <svg className="w-6 h-6 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-bold text-green-800 leading-tight">
                    Sin cambios de fase legal pendientes
                  </p>
                  <p className="text-[11px] font-medium text-green-600">
                    Todos los expedientes con cambio reciente tienen CUP/CUN
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={onDismiss}
              className="w-full bg-[#002446] text-white py-4 rounded-xl font-extrabold tracking-widest uppercase text-sm shadow-xl shadow-[#002446]/30 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Ir al Tablero de Control
            </button>
            <button
              onClick={onDismiss}
              className="w-full text-gray-500 font-bold text-xs hover:text-[#002446] transition-colors py-2"
            >
              Descartar resumen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Hook to control showing the popup once per day */
export function useLoginSummary() {
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown !== today) {
      setShowSummary(true);
    }
  }, []);

  function dismiss() {
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem(STORAGE_KEY, today);
    setShowSummary(false);
  }

  return { showSummary, dismiss };
}
