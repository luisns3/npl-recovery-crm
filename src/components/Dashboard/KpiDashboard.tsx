import { useState, useMemo } from 'react';
import { useCrm } from '../../context/CrmContext';
import type { Probability, Strategy } from '../../types';
import PipelineSummary from './PipelineSummary';
import CollectionsChart from './CollectionsChart';
import PipelineCreationChart from './PipelineCreationChart';
import ProposalTable from './ProposalTable';
import ActivityWidget from './ActivityWidget';
import RankingsWidget from './RankingsWidget';
import DashboardFilters from './DashboardFilters';

export interface DashboardFiltersState {
  strategy: Strategy | 'all';
  probability: Probability | 'all';
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
  selectedMonth: string | null; // YYYY-MM for chart click filtering
}

const defaultFilters: DashboardFiltersState = {
  strategy: 'all',
  probability: 'all',
  dateFrom: '',
  dateTo: '',
  searchTerm: '',
  selectedMonth: null,
};

export default function KpiDashboard() {
  const { cases } = useCrm();
  const [filters, setFilters] = useState<DashboardFiltersState>(defaultFilters);

  const allProposals = useMemo(() => {
    return cases.flatMap((c) =>
      c.proposals.map((p) => ({ ...p, case_ref: c.reference, borrower: c.parties.find((pt) => pt.role === 'borrower')?.name || '' }))
    );
  }, [cases]);

  const filteredProposals = useMemo(() => {
    let result = allProposals;
    if (filters.strategy !== 'all') {
      result = result.filter((p) => p.strategy_type === filters.strategy);
    }
    if (filters.probability !== 'all') {
      result = result.filter((p) => p.probability === filters.probability);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      result = result.filter(
        (p) => p.case_ref.toLowerCase().includes(term) || p.borrower.toLowerCase().includes(term)
      );
    }
    if (filters.selectedMonth) {
      result = result.filter((p) => p.expected_closing_date?.startsWith(filters.selectedMonth!));
    }
    return result;
  }, [allProposals, filters]);

  function handleMonthClick(month: string) {
    setFilters((f) => ({
      ...f,
      selectedMonth: f.selectedMonth === month ? null : month,
    }));
  }

  return (
    <div className="h-full overflow-y-auto custom-scrollbar">
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#002446] tracking-tight">Dashboard</h1>
            <p className="text-sm text-slate-500">Panel centralizado de recuperacion activa</p>
          </div>
        </div>

        {/* Filters */}
        <DashboardFilters filters={filters} onChange={setFilters} />

        {/* Pipeline Summary Cards */}
        <PipelineSummary proposals={filteredProposals} />

        {/* Charts Row */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7">
            <CollectionsChart
              proposals={filteredProposals}
              selectedMonth={filters.selectedMonth}
              onMonthClick={handleMonthClick}
            />
          </div>
          <div className="col-span-5">
            <PipelineCreationChart proposals={filteredProposals} />
          </div>
        </div>

        {/* Proposal Table */}
        <ProposalTable proposals={filteredProposals} />

        {/* Bottom Row: Activity + Rankings */}
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-7">
            <ActivityWidget cases={cases} />
          </div>
          <div className="col-span-5">
            <RankingsWidget />
          </div>
        </div>
      </div>
    </div>
  );
}
