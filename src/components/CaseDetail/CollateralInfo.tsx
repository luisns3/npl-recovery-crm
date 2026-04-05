import type { Collateral } from '../../types';

export default function CollateralInfo({ collaterals }: { collaterals: Collateral[] }) {
  return (
    <div className="border-t border-gray-200 pt-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Collateral</h3>
      <div className="space-y-3">
        {collaterals.map((col) => (
          <div key={col.id} className="bg-gray-50 rounded-lg p-3 text-sm">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-gray-900">{col.property_type}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">{col.occupancy_status.replace('_', ' ')}</span>
            </div>
            <p className="text-gray-600 text-xs">{col.address}</p>
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
              {col.surface_sqm && <span>{col.surface_sqm} m2</span>}
              {col.plot_registry && <span>{col.plot_registry}</span>}
              {col.cadastral_ref && <span>Ref: {col.cadastral_ref}</span>}
              {col.latitude && col.longitude && (
                <a
                  href={`https://maps.google.com/?q=${col.latitude},${col.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:underline"
                >
                  Google Maps
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
