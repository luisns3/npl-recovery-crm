import type { DashboardFiltersState } from './KpiDashboard';
import type { Strategy, Probability } from '../../types';
import { STRATEGY_LABELS, PROBABILITY_LABELS } from '../../types';

interface Props {
  filters: DashboardFiltersState;
  onChange: (f: DashboardFiltersState) => void;
}

const STRATEGIES: Strategy[] = ['DPO', 'PDV', 'DPO_encubierta', 'Loan_Sale', 'DIL', 'SAU', 'CDR', 'Repossession'];
const PROBABILITIES: Probability[] = ['pre_pipe', 'focus', 'deals', 'firmada', 'cancelled'];

export default function DashboardFilters({ filters, onChange }: Props) {
  function update(patch: Partial<DashboardFiltersState>) {
    onChange({ ...filters, ...patch });
  }

  const hasActive = filters.strategy !== 'all' || filters.probability !== 'all' || filters.dateFrom || filters.dateTo || filters.searchTerm || filters.selectedMonth;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center gap-4 flex-wrap">
        {/* Search */}
        <div className="flex items-center bg-slate-100 rounded-lg px-3 py-1.5 gap-2 w-56">
          <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="bg-transparent border-none focus:ring-0 text-xs w-full placeholder:text-slate-400 p-0"
            placeholder="Filtrar por nombre, ref..."
            value={filters.searchTerm}
            onChange={(e) => update({ searchTerm: e.target.value })}
          />
        </div>

        {/* Strategy */}
        <select
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-1 focus:ring-[#1a61a6]"
          value={filters.strategy}
          onChange={(e) => update({ strategy: e.target.value as Strategy | 'all' })}
        >
          <option value="all">Todas las estrategias</option>
          {STRATEGIES.map((s) => <option key={s} value={s}>{STRATEGY_LABELS[s]}</option>)}
        </select>

        {/* Probability */}
        <select
          className="text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-1 focus:ring-[#1a61a6]"
          value={filters.probability}
          onChange={(e) => update({ probability: e.target.value as Probability | 'all' })}
        >
          <option value="all">Todas las probabilidades</option>
          {PROBABILITIES.map((p) => <option key={p} value={p}>{PROBABILITY_LABELS[p]}</option>)}
        </select>

        {/* Date Range */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-[#1a61a6]"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
          />
          <span className="text-xs text-slate-400">—</span>
          <input
            type="date"
            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:ring-1 focus:ring-[#1a61a6]"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
          />
        </div>

        {/* Clear */}
        {hasActive && (
          <button
            onClick={() => onChange({
              strategy: 'all',
              probability: 'all',
              dateFrom: '',
              dateTo: '',
              searchTerm: '',
              selectedMonth: null,
            })}
            className="text-xs text-red-600 font-bold hover:text-red-700 transition-colors"
          >
            Limpiar filtros
          </button>
        )}
      </div>
    </div>
  );
}
