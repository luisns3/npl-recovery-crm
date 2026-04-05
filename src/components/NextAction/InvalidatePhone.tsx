import { useState } from 'react';
import { useCrm, useCurrentCase } from '../../context/CrmContext';

export default function InvalidatePhone() {
  const c = useCurrentCase();
  const { blockPhone } = useCrm();
  const [reason, setReason] = useState('');
  const [blockingId, setBlockingId] = useState<string | null>(null);

  if (!c) return null;

  const phones = c.contacts.filter((ct) => ct.type === 'phone');

  const handleBlock = async (contactId: string) => {
    if (!reason.trim()) return;
    await blockPhone(contactId, reason.trim());
    setReason('');
    setBlockingId(null);
  };

  return (
    <div className="space-y-2">
      {phones.length === 0 && <p className="text-sm text-gray-500">No phone contacts</p>}
      {phones.map((ct) => (
        <div key={ct.id} className="bg-gray-50 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between">
            <div>
              <span className={`text-sm ${ct.is_blocked ? 'text-red-400 line-through' : 'text-gray-900'}`}>{ct.value}</span>
            </div>
            {!ct.is_blocked ? (
              blockingId === ct.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Block reason..."
                    className="border border-gray-300 rounded px-2 py-1 text-xs w-40"
                  />
                  <button
                    onClick={() => handleBlock(ct.id)}
                    disabled={!reason.trim()}
                    className="text-xs text-red-600 hover:text-red-800 font-medium disabled:text-gray-400"
                  >
                    Confirm
                  </button>
                  <button onClick={() => setBlockingId(null)} className="text-xs text-gray-400">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setBlockingId(ct.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium"
                >
                  Block
                </button>
              )
            ) : (
              <span className="text-xs text-red-400">Blocked{ct.block_reason ? `: ${ct.block_reason}` : ''}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
