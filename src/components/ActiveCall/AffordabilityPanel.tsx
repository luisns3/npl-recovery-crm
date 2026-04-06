import type { Party } from '../../types';

interface Props {
  party: Party;
}

export default function AffordabilityPanel({ party: _party }: Props) {
  return (
    <div className="bg-slate-50/50 rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-sm h-full">
      <div className="p-4 border-b border-slate-200 bg-white">
        <label className="text-[10px] font-bold text-[#1a61a6] uppercase tracking-widest flex items-center gap-2 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Asequibilidad y Perfil
        </label>
        <div className="flex border-b border-slate-100 -mx-4 px-4 overflow-x-auto">
          <button className="pb-2 px-3 text-[9px] font-bold text-[#1a61a6] border-b-2 border-[#1a61a6] uppercase tracking-wider whitespace-nowrap">
            Perfil
          </button>
          <button className="pb-2 px-3 text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider whitespace-nowrap">
            Hogar
          </button>
          <button className="pb-2 px-3 text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider whitespace-nowrap">
            Sucesion
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Estado Civil</label>
              <select className="w-full text-[10px] border-slate-200 rounded-lg p-1.5 bg-white">
                <option>Seleccionar</option>
                <option>Soltero/a</option>
                <option>Casado/a</option>
                <option>Divorciado/a</option>
                <option>Viudo/a</option>
                <option>Desconocido</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase">Sit. Laboral</label>
              <select className="w-full text-[10px] border-slate-200 rounded-lg p-1.5 bg-white">
                <option>Seleccionar</option>
                <option>Empleado/a</option>
                <option>Desempleado/a</option>
                <option>Autonomo/a</option>
                <option>Jubilado/a</option>
                <option>Desconocido</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Ingreso Hogar (EUR/mes)</label>
            <div className="relative">
              <input
                className="w-full text-[10px] border-slate-200 rounded-lg p-1.5 bg-white pr-6"
                placeholder="Opcional"
                type="number"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">EUR</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Ocupacion</label>
            <select className="w-full text-[10px] border-slate-200 rounded-lg p-1.5 bg-white">
              <option>Seleccionar</option>
              <option>Ocupado por deudor</option>
              <option>Inquilino legal</option>
              <option>Ocupacion ilegal</option>
              <option>Desocupado</option>
              <option>Desconocido</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-400 uppercase">Notas</label>
            <textarea
              className="w-full text-[10px] border-slate-200 rounded-lg p-1.5 bg-white resize-none h-16"
              placeholder="Informacion adicional..."
            />
          </div>
        </div>
      </div>
      <div className="p-3 bg-slate-100 border-t border-slate-200 shrink-0">
        <p className="text-[8px] font-bold text-slate-400 uppercase text-center">
          Pendiente de primera actualizacion
        </p>
      </div>
    </div>
  );
}
