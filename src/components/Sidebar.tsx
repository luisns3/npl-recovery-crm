import { useCrm } from '../context/CrmContext';
import { useAuth } from '../context/AuthContext';
import type { ViewMode } from '../types';

const NAV_ITEMS: { key: ViewMode; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { key: 'perimeter', label: 'Mi Perimetro', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { key: 'tasks', label: 'Tareas', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
  { key: 'call_queue', label: 'Cola de Llamadas', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
];

export default function Sidebar() {
  const { currentView, navigate } = useCrm();
  const { user, signOut } = useAuth();

  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-[#002446] text-white flex flex-col z-40 shadow-xl">
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-black tracking-tight text-white uppercase leading-none">Recovery</p>
          <p className="text-[9px] text-blue-400 font-bold tracking-widest uppercase">CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2 space-y-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.key;
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-white/15 text-white font-bold border-l-2 border-blue-400'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2 : 1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
              </svg>
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 pb-4 space-y-1">
        <div className="px-4 py-2 text-xs text-slate-400 truncate">
          {user?.full_name ?? user?.email}
        </div>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-red-300 hover:text-white hover:bg-red-500/20 transition-all text-left"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-xs">Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  );
}
