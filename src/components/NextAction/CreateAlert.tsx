import { useState } from 'react';
import { useCrm } from '../../context/CrmContext';
import type { AlertType } from '../../types';

const ALERT_TYPES: AlertType[] = ['follow_up', 'auction_date', 'legal_deadline', 'payment_due', 'custom'];

export default function CreateAlert() {
  const { createAlert } = useCrm();
  const [date, setDate] = useState('');
  const [type, setType] = useState<AlertType>('follow_up');
  const [desc, setDesc] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    if (!date || !desc.trim()) return;
    createAlert(date, type, desc.trim());
    setSaved(true);
    setDate('');
    setDesc('');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" />
        <select value={type} onChange={(e) => setType(e.target.value as AlertType)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          {ALERT_TYPES.map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
      <input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <button onClick={handleSave} disabled={!date || !desc.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm py-2 px-4 rounded-lg">
        {saved ? 'Saved!' : 'Create Alert'}
      </button>
    </div>
  );
}
