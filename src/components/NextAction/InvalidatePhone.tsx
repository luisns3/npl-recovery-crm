import { useCrm, useCurrentCase } from '../../context/CrmContext';

export default function InvalidatePhone() {
  const c = useCurrentCase();
  const { invalidatePhone } = useCrm();

  if (!c) return null;

  const phones = c.contacts.filter((ct) => ct.type === 'phone');

  return (
    <div className="space-y-2">
      {phones.length === 0 && <p className="text-sm text-gray-500">No phone contacts</p>}
      {phones.map((ct) => (
        <div key={ct.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
          <div>
            <span className={`text-sm ${ct.isInvalid ? 'text-red-400 line-through' : 'text-gray-900'}`}>{ct.value}</span>
            <span className="text-xs text-gray-400 ml-2">{ct.relationshipNote}</span>
          </div>
          {!ct.isInvalid ? (
            <button
              onClick={() => invalidatePhone(ct.id)}
              className="text-xs text-red-600 hover:text-red-800 font-medium"
            >
              Mark Invalid
            </button>
          ) : (
            <span className="text-xs text-red-400">Invalid</span>
          )}
        </div>
      ))}
    </div>
  );
}
