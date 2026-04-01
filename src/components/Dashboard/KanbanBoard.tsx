import { useCrm } from '../../context/CrmContext';
import type { Stage } from '../../types';
import KanbanColumn from './KanbanColumn';

const STAGES: Stage[] = ['pre_contact', 'contacted', 'negotiating', 'proposal', 'resolved'];

export default function KanbanBoard() {
  const { cases } = useCrm();

  return (
    <div className="flex-1 p-4 overflow-x-auto">
      <div className="flex gap-4 h-full min-w-[800px]">
        {STAGES.map((stage) => (
          <KanbanColumn key={stage} stage={stage} cases={cases.filter((c) => c.stage === stage)} />
        ))}
      </div>
    </div>
  );
}
