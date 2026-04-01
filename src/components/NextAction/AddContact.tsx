import { useState } from 'react';
import { useCrm, useCurrentCase } from '../../context/CrmContext';

export default function AddContact() {
  const c = useCurrentCase();
  const { addContact } = useCrm();
  const [type, setType] = useState<'phone' | 'email'>('phone');
  const [value, setValue] = useState('');
  const [partyId, setPartyId] = useState(c?.parties[0]?.id || '');
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);

  if (!c) return null;

  const handleSave = () => {
    if (!value.trim() || !partyId) return;
    addContact(partyId, type, value.trim(), note.trim());
    setSaved(true);
    setValue('');
    setNote('');
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <select value={type} onChange={(e) => setType(e.target.value as 'phone' | 'email')} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="phone">Phone</option>
          <option value="email">Email</option>
        </select>
        <select value={partyId} onChange={(e) => setPartyId(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1">
          {c.parties.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.role})</option>
          ))}
        </select>
      </div>
      <input type="text" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'phone' ? '+34 6XX XXX XXX' : 'email@example.com'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Relationship note..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
      <button onClick={handleSave} disabled={!value.trim()} className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white text-sm py-2 px-4 rounded-lg">
        {saved ? 'Saved!' : 'Add Contact'}
      </button>
    </div>
  );
}
