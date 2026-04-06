import type { Proposal, Probability } from '../../types';

interface ProposalWithMeta extends Proposal {
  case_ref: string;
  borrower: string;
}

interface Props {
  proposals: ProposalWithMeta[];
}

function formatEur(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString('es-ES');
}

const PIPELINE_STAGES: { key: Probability; label: string; color: string; bgColor: string }[] = [
  { key: 'firmada', label: 'Firmada', color: 'text-emerald-700', bgColor: 'bg-emerald-50 border-emerald-200' },
  { key: 'deals', label: 'Deals', color: 'text-blue-700', bgColor: 'bg-blue-50 border-blue-200' },
  { key: 'focus', label: 'Focus', color: 'text-amber-700', bgColor: 'bg-amber-50 border-amber-200' },
  { key: 'pre_pipe', label: 'Pre-Pipe', color: 'text-slate-700', bgColor: 'bg-slate-50 border-slate-200' },
];

export default function PipelineSummary({ proposals }: Props) {
  const active = proposals.filter((p) => !p.cancelled_at);

  const actuals = active.filter((p) => p.probability === 'firmada').reduce((s, p) => s + p.amount, 0);
  const pipeline = active.filter((p) => ['deals', 'focus', 'pre_pipe'].includes(p.probability)).reduce((s, p) => s + p.amount, 0);

  const byStage = PIPELINE_STAGES.map((stage) => {
    const stageProposals = active.filter((p) => p.probability === stage.key);
    return {
      ...stage,
      total: stageProposals.reduce((s, p) => s + p.amount, 0),
      count: stageProposals.length,
    };
  });

  return (
    <div className="space-y-4">
      {/* Main totals */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#002446] text-white rounded-xl p-5 shadow-lg">
          <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-1">Cobros Realizados (Actuals)</p>
          <p className="text-3xl font-black">{formatEur(actuals)} EUR</p>
          <p className="text-xs text-slate-300 mt-1">{active.filter((p) => p.probability === 'firmada').length} propuestas firmadas</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-[#1a61a6] uppercase tracking-widest mb-1">Pipeline Total</p>
          <p className="text-3xl font-black text-[#002446]">{formatEur(pipeline)} EUR</p>
          <p className="text-xs text-slate-500 mt-1">{active.filter((p) => ['deals', 'focus', 'pre_pipe'].includes(p.probability)).length} propuestas activas</p>
        </div>
      </div>

      {/* Stage breakdown */}
      <div className="grid grid-cols-4 gap-3">
        {byStage.map((stage) => (
          <div key={stage.key} className={`rounded-xl p-4 border ${stage.bgColor}`}>
            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${stage.color}`}>{stage.label}</p>
            <p className={`text-xl font-black ${stage.color}`}>{formatEur(stage.total)} EUR</p>
            <p className="text-[10px] text-slate-400 mt-1">{stage.count} propuestas</p>
          </div>
        ))}
      </div>
    </div>
  );
}
