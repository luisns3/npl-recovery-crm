import { useState } from 'react';
import { useCrm, useCurrentCase } from '../../context/CrmContext';
import type { Strategy, Probability, PaymentTerms } from '../../types';
import { STRATEGY_PRIORITY, STRATEGY_LABELS, PROBABILITY_LABELS } from '../../types';
import ProposalList from '../Proposals/ProposalList';

const PROBABILITIES: Probability[] = ['pre_pipe', 'focus', 'deals', 'firmada', 'cancelled'];

export default function ProposalForm() {
  const c = useCurrentCase();
  const { createProposal } = useCrm();
  const [strategy, setStrategy] = useState<Strategy>('DPO');
  const [probability, setProbability] = useState<Probability>('pre_pipe');
  const [amount, setAmount] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>('lump_sum');
  const [installmentCount, setInstallmentCount] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [selectedLoans, setSelectedLoans] = useState<string[]>(c?.loans.map(l => l.id) || []);
  const [selectedCollaterals, setSelectedCollaterals] = useState<string[]>(c?.collaterals.map(col => col.id) || []);
  const [saved, setSaved] = useState(false);

  if (!c) return null;

  const handleSave = async () => {
    if (!closingDate || !amount) return;
    await createProposal({
      strategy_type: strategy,
      amount: parseFloat(amount),
      payment_terms: paymentTerms,
      installment_count: paymentTerms === 'installments' && installmentCount ? parseInt(installmentCount) : null,
      installment_frequency: paymentTerms === 'installments' ? 'monthly' : null,
      probability,
      expected_closing_date: closingDate,
      loan_ids: selectedLoans,
      collateral_ids: selectedCollaterals,
    });
    setSaved(true);
    setClosingDate('');
    setAmount('');
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleLoan = (id: string) => {
    setSelectedLoans(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleCollateral = (id: string) => {
    setSelectedCollaterals(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-4">
      {c.proposals.length > 0 && (
        <ProposalList proposals={c.proposals} collaterals={c.collaterals} />
      )}

      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">New Proposal</h4>
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={strategy} onChange={(e) => setStrategy(e.target.value as Strategy)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
              {STRATEGY_PRIORITY.map((s) => (
                <option key={s} value={s}>{STRATEGY_LABELS[s]}</option>
              ))}
            </select>
            <select value={probability} onChange={(e) => setProbability(e.target.value as Probability)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
              {PROBABILITIES.map((p) => (
                <option key={p} value={p}>{PROBABILITY_LABELS[p]}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (EUR)"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
            />
            <select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value as PaymentTerms)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option value="lump_sum">Lump Sum</option>
              <option value="installments">Installments</option>
            </select>
          </div>

          {paymentTerms === 'installments' && (
            <input
              type="number"
              value={installmentCount}
              onChange={(e) => setInstallmentCount(e.target.value)}
              placeholder="Number of installments"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          )}

          <input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />

          {c.loans.length > 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Loans</p>
              <div className="flex flex-wrap gap-2">
                {c.loans.map(l => (
                  <label key={l.id} className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={selectedLoans.includes(l.id)} onChange={() => toggleLoan(l.id)} />
                    {l.loan_reference}
                  </label>
                ))}
              </div>
            </div>
          )}

          {c.collaterals.length > 1 && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Collaterals</p>
              <div className="flex flex-wrap gap-2">
                {c.collaterals.map(col => (
                  <label key={col.id} className="flex items-center gap-1 text-xs">
                    <input type="checkbox" checked={selectedCollaterals.includes(col.id)} onChange={() => toggleCollateral(col.id)} />
                    {col.property_type} - {col.address.split(',')[0]}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleSave} disabled={!closingDate || !amount} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm py-2 px-4 rounded-lg">
            {saved ? 'Saved!' : 'Create Proposal'}
          </button>
        </div>
      </div>
    </div>
  );
}
