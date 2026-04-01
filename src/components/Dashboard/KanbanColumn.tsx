import type { Case, Stage } from '../../types';
import { STAGE_LABELS } from '../../types';
import CaseCard from './CaseCard';

interface Props {
  stage: Stage;
  cases: Case[];
}

const STAGE_COLORS: Record<Stage, string> = {
  pre_contact: 'bg-gray-400',
  contacted: 'bg-blue-400',
  negotiating: 'bg-amber-400',
  proposal: 'bg-indigo-500',
  resolved: 'bg-green-500',
};

export default function KanbanColumn({ stage, cases }: Props) {
  return (
    <div className="flex-1 min-w-[200px] flex flex-col">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2.5 h-2.5 rounded-full ${STAGE_COLORS[stage]}`} />
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{STAGE_LABELS[stage]}</h3>
        <span className="text-xs text-gray-400 ml-auto">{cases.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {cases.map((c) => (
          <CaseCard key={c.id} c={c} />
        ))}
        {cases.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No cases</p>}
      </div>
    </div>
  );
}
