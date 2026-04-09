import { useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import type { Alert } from '../../types';

interface AlertWithCase extends Alert {
  case_ref: string;
  borrower: string;
  case_id: string;
  group_id: string | null;
}

export default function TasksView() {
  const { cases, openGroup } = useCrm();

  const allAlerts = useMemo(() => {
    const result: AlertWithCase[] = [];
    for (const c of cases) {
      const borrower = c.parties.find((p) => p.role === 'borrower')?.name || '';
      for (const a of c.alerts) {
        result.push({ ...a, case_ref: c.reference, borrower, case_id: c.id, group_id: c.group_id });
      }
    }
    return result.sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [cases]);

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const next7 = new Date(now);
  next7.setDate(next7.getDate() + 7);
  const next7Str = next7.toISOString().slice(0, 10);

  const overdue = allAlerts.filter((a) => !a.resolved_at && a.due_date < todayStr);
  const today = allAlerts.filter((a) => !a.resolved_at && a.due_date === todayStr);
  const upcoming = allAlerts.filter((a) => !a.resolved_at && a.due_date > todayStr && a.due_date <= next7Str);
  const resolved = allAlerts.filter((a) => a.resolved_at);

  function AlertRow({ alert }: { alert: AlertWithCase }) {
    return (
      <button
        onClick={() => openGroup(alert.group_id || alert.case_id)}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-[9px] font-bold text-[#1a61a6] bg-[#1a61a6]/10 px-1.5 py-0.5 rounded shrink-0">
            {alert.case_ref}
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-900 truncate">{alert.description}</p>
            <p className="text-[10px] text-slate-500">{alert.borrower}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded capitalize">
            {alert.type.replace('_', ' ')}
          </span>
          <span className="text-[10px] text-slate-400">{alert.due_date}</span>
        </div>
      </button>
    );
  }

  function Section({ title, count, alerts, color }: { title: string; count: number; alerts: AlertWithCase[]; color: string }) {
    if (alerts.length === 0) return null;
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className={`px-5 py-3 border-b border-slate-100 flex items-center justify-between ${color}`}>
          <h3 className="text-xs font-bold uppercase tracking-widest">{title}</h3>
          <span className="text-xs font-black">{count}</span>
        </div>
        <div className="max-h-80 overflow-y-auto custom-scrollbar">
          {alerts.map((a) => <AlertRow key={a.id} alert={a} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-[#002446] tracking-tight">Tareas</h1>
          <p className="text-sm text-slate-500">Alertas y recordatorios pendientes</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Atrasadas</p>
            <p className="text-2xl font-black text-red-700">{overdue.length}</p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Hoy</p>
            <p className="text-2xl font-black text-amber-700">{today.length}</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Proximos 7 dias</p>
            <p className="text-2xl font-black text-blue-700">{upcoming.length}</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Resueltas</p>
            <p className="text-2xl font-black text-emerald-700">{resolved.length}</p>
          </div>
        </div>

        <Section title="Atrasadas" count={overdue.length} alerts={overdue} color="text-red-700" />
        <Section title="Hoy" count={today.length} alerts={today} color="text-amber-700" />
        <Section title="Proximos 7 dias" count={upcoming.length} alerts={upcoming} color="text-blue-700" />
      </div>
    </div>
  );
}
