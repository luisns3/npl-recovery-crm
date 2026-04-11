import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Collateral } from '../../types';
import CadastralRefLink from '../shared/CadastralRefLink';

// Custom pin — avoids Vite/PNG bundling issues with Leaflet defaults
const createPin = (color = '#1a61a6') =>
  L.divIcon({
    className: '',
    html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
  });

const OCCUPANCY_COLORS: Record<string, string> = {
  debtor_occupied: '#1a61a6',
  legal_tenant: '#059669',
  illegal_occupant: '#dc2626',
  vacant: '#94a3b8',
  unknown: '#d97706',
};

function FitBounds({ collaterals }: { collaterals: Collateral[] }) {
  const map = useMap();
  const pinned = collaterals.filter((c) => c.latitude && c.longitude);
  useEffect(() => {
    if (pinned.length === 0) return;
    const bounds = L.latLngBounds(pinned.map((c) => [c.latitude!, c.longitude!] as [number, number]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [pinned, map]);
  return null;
}

const OCCUPANCY_LABELS: Record<string, string> = {
  debtor_occupied: 'Ocupado - Deudor',
  legal_tenant: 'Inquilino Legal',
  illegal_occupant: 'Ocupacion Ilegal',
  vacant: 'Desocupado',
  unknown: 'Desconocido',
};

interface Props {
  collaterals: Collateral[];
}

export default function GroupMap({ collaterals }: Props) {
  const pinned = collaterals.filter((c) => c.latitude && c.longitude);

  if (pinned.length === 0) {
    return (
      <div className="h-full bg-slate-100 flex flex-col items-center justify-center gap-3">
        <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        <div className="text-center">
          <p className="text-xs font-bold text-slate-400">Sin Geolocalizacion</p>
          <p className="text-[10px] text-slate-400">{collaterals.length} garantia{collaterals.length !== 1 ? 's' : ''} sin coordenadas</p>
        </div>
      </div>
    );
  }

  const center: [number, number] = [pinned[0].latitude!, pinned[0].longitude!];

  return (
    <div className="h-full w-full relative">
      <MapContainer center={center} zoom={6} className="h-full w-full" scrollWheelZoom>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a>'
        />
        <FitBounds collaterals={collaterals} />
        {pinned.map((col) => (
          <Marker
            key={col.id}
            position={[col.latitude!, col.longitude!]}
            icon={createPin(OCCUPANCY_COLORS[col.occupancy_status] || '#1a61a6')}
          >
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-[#002446]">{col.address}</p>
                <p className="text-slate-500">{col.property_type}{col.surface_sqm ? ` · ${col.surface_sqm} m²` : ''}</p>
                <p className="mt-1 text-slate-600">{OCCUPANCY_LABELS[col.occupancy_status] || col.occupancy_status}</p>
                {col.cadastral_ref && (
                  <CadastralRefLink
                    refCat={col.cadastral_ref}
                    className="text-[10px] text-[#1a61a6] hover:underline mt-1 block cursor-pointer"
                  />
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {/* Occupancy legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-lg shadow-md px-3 py-2 border border-slate-200">
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Ocupacion</p>
        {Object.entries(OCCUPANCY_LABELS).map(([key, label]) => (
          <div key={key} className="flex items-center gap-1.5 mb-0.5">
            <div className="w-2.5 h-2.5 rounded-full border border-white/50" style={{ background: OCCUPANCY_COLORS[key] || '#94a3b8', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
            <span className="text-[9px] text-slate-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
