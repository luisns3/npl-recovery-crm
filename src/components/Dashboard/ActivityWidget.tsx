import { useMemo } from 'react';
import type { Case } from '../../types';

interface Props {
  cases: Case[];
}

function isWithinDays(dateStr: string, days: number): boolean {
  const d = new Date(dateStr);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

export default function ActivityWidget({ cases }: Props) {
  const stats = useMemo(() => {
    // Daily calls in last 30 days
    const dailyCalls = new Map<string, number>();
    const dailyContactedCases = new Map<string, Set<string>>();
    const dailyNotContactedCases = new Map<string, Set<string>>();

    for (let i = 0; i < 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyCalls.set(key, 0);
      dailyContactedCases.set(key, new Set());
      dailyNotContactedCases.set(key, new Set());
    }

    for (const c of cases) {
      for (const inter of c.interactions) {
        if (inter.type !== 'call') continue;
        const day = inter.created_at.slice(0, 10);
        if (dailyCalls.has(day)) {
          dailyCalls.set(day, (dailyCalls.get(day) || 0) + 1);
        }
      }

      // Was this case contacted in last 14 days?
      const recentContact = c.interactions.some(
        (i) => i.type === 'call' && isWithinDays(i.created_at, 14)
      );
      const today = new Date().toISOString().slice(0, 10);
      if (recentContact) {
        dailyContactedCases.get(today)?.add(c.id);
      } else {
        dailyNotContactedCases.get(today)?.add(c.id);
      }
    }

    const days = [...dailyCalls.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const totalCalls30d = days.reduce((s, [, v]) => s + v, 0);
    const avg30d = Math.round(totalCalls30d / 30);

    const contactedLast14d = cases.filter((c) =>
      c.interactions.some((i) => i.type === 'call' && isWithinDays(i.created_at, 14))
    ).length;
    const notContactedLast14d = cases.filter((c) => c.stage !== 'resolved').length - contactedLast14d;

    return { days, avg30d, totalCalls30d, contactedLast14d, notContactedLast14d };
  }, [cases]);

  const maxDayCalls = Math.max(1, ...stats.days.map(([, v]) => v));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#002446]">Actividad Diaria</h3>
          <p className="text-[10px] text-slate-400">Ultimos 30 dias - Media movil: {stats.avg30d} llamadas/dia</p>
        </div>
      </div>

      {/* Contact split */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest">Contactados (14d)</p>
          <p className="text-2xl font-black text-emerald-700">{stats.contactedLast14d}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest">Sin contactar (14d)</p>
          <p className="text-2xl font-black text-red-700">{stats.notContactedLast14d}</p>
        </div>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-px h-20">
        {stats.days.map(([day, count]) => (
          <div
            key={day}
            className="flex-1 bg-[#1a61a6]/70 rounded-t-sm hover:bg-[#1a61a6] transition-colors"
            style={{ height: `${Math.max(2, (count / maxDayCalls) * 72)}px` }}
            title={`${day}: ${count} llamadas`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[8px] text-slate-400">{stats.days[0]?.[0]}</span>
        <span className="text-[8px] text-slate-400">Hoy</span>
      </div>
    </div>
  );
}
