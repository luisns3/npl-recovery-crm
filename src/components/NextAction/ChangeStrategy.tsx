import { useState } from 'react';
import { useCrm, useCurrentCase } from '../../context/CrmContext';
import type { Strategy } from '../../types';
import { STRATEGY_PRIORITY, STRATEGY_LABELS } from '../../types';

export default function ChangeStrategy() {
  const c = useCurrentCase();
  const { changeStrategy } = useCrm();
  const [strategy, setStrategy] = useState<Strategy>(c?.strategy || 'DPO');
  const [saved, setSaved] = useState(false);

  const ALL_STRATEGIES: Strategy[] = [...STRATEGY_PRIORITY];

  const handleSave = async () => {
    await changeStrategy(strategy);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Current: <span className="font-medium">{c?.strategy}</span></p>
      <select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
        {ALL_STRATEGIES.map((s) => (
          <option key={s} value={s}>{STRATEGY_LABELS[s]}</option>
        ))}
      </select>
      <button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4 rounded-lg">
        {saved ? 'Saved!' : 'Change Strategy'}
      </button>
    </div>
  );
}
