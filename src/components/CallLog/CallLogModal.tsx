import { useState } from 'react';
import { useCrm, useCurrentCase } from '../../context/CrmContext';
import type { CallResult } from '../../types';
import { CALL_RESULT_LABELS } from '../../types';

const RESULT_OPTIONS: CallResult[] = ['no_answer', 'not_interested', 'will_callback', 'agreement', 'wrong_number'];

export default function CallLogModal() {
  const c = useCurrentCase();
  const { logCall, showNextAction } = useCrm();
  const [result, setResult] = useState<CallResult | ''>('');
  const [comment, setComment] = useState('');

  if (!c) return null;

  const borrower = c.parties.find((p) => p.role === 'borrower');
  const canSubmit = result !== '' && comment.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    logCall(result as CallResult, comment.trim());
    showNextAction();
  };

  return (
    <div className="h-full flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Log Call Result</h2>
        <p className="text-sm text-gray-500 mb-6">{borrower?.name} &middot; {c.reference}</p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Call Result *</label>
          <select
            value={result}
            onChange={(e) => setResult(e.target.value as CallResult)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
          >
            <option value="">Select result...</option>
            {RESULT_OPTIONS.map((r) => (
              <option key={r} value={r}>{CALL_RESULT_LABELS[r]}</option>
            ))}
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Comment *</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            placeholder="Describe the call..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg text-sm transition-colors"
        >
          SAVE & CONTINUE &rarr;
        </button>
      </div>
    </div>
  );
}
