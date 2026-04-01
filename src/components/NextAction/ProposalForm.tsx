import { useState } from 'react';
import { useCrm, useCurrentCase } from '../../context/CrmContext';
import type { Strategy, Probability } from '../../types';
import { STRATEGY_PRIORITY } from '../../types';
import ProposalList from '../Proposals/ProposalList';

const PROBABILITIES: Probability[] = ['Pre-Pipe', 'Focus', 'Deals', 'Signed', 'Cancelled'];

export default function ProposalForm() {
  const c = useCurrentCase();
  const { createProposal } = useCrm();
  const [collateralId, setCollateralId] = useState(c?.collaterals[0]?.id || '');
  const [strategy, setStrategy] = useState<Strategy>('DPO');
  const [probability, setProbability] = useState<Probability>('Pre-Pipe');
  const [signingDate, setSigningDate] = useState('');
  const [saved, setSaved] = useState(false);

  if (!c) return null;

  const handleSave = () => {
    if (!collateralId || !signingDate) return;
    createProposal(collateralId, strategy, probability, signingDate);
    setSaved(true);
    setSigningDate('');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      {c.proposals.length > 0 && (
        <ProposalList proposals={c.proposals} collaterals={c.collaterals} />
      )}

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">New Proposal</h4>
        <div className="space-y-3">
          <select value={collateralId} onChange={(e) => setCollateralId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
            {c.collaterals.map((col) => (
              <option key={col.id} value={col.id}>{col.type} - {col.address.split(',')[0]}</option>
            ))}
          </select>
          <div className="flex gap-3">
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
              {STRATEGY_PRIORITY.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select value={probability} onChange={(e) => setProbability(e.target.value as Probability)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
              {PROBABILITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <input type="date" value={signingDate} onChange={(e) => setSigningDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={handleSave} disabled={!collateralId || !signingDate} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm py-2 px-4 rounded-lg">
            {saved ? 'Saved!' : 'Create Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
}
