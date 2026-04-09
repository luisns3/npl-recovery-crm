import { useRef } from 'react';
import type { DocumentRequest } from '../../../types';

interface Props {
  documentRequests: DocumentRequest[];
}

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  received: 'bg-emerald-100 text-emerald-700',
  not_applicable: 'bg-slate-100 text-slate-500',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  received: 'Recibido',
  not_applicable: 'No aplica',
};

const DOCUMENT_TYPE_ICONS: Record<string, string> = {
  dni: '🪪',
  nie: '🪪',
  escritura: '📄',
  nota_simple: '📋',
  tasacion: '🏠',
  certificado_deudas: '💳',
  fotografia: '📷',
  plano: '📐',
  otro: '📎',
};

export default function DocumentosTab({ documentRequests }: Props) {
  const uploadRef = useRef<HTMLInputElement>(null);

  const received = documentRequests.filter((d) => d.status === 'received');
  const pending = documentRequests.filter((d) => d.status === 'pending');

  return (
    <div className="p-5 space-y-5">
      {/* Upload Zone */}
      <div
        onClick={() => uploadRef.current?.click()}
        className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-[#1a61a6] hover:bg-[#1a61a6]/3 transition-all group"
      >
        <input ref={uploadRef} type="file" multiple className="hidden" accept="image/*,.pdf,.doc,.docx" />
        <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-[#1a61a6]/10 flex items-center justify-center transition-colors">
          <svg className="w-6 h-6 text-slate-400 group-hover:text-[#1a61a6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-slate-600 group-hover:text-[#1a61a6]">Subir documentos o fotos</p>
          <p className="text-[10px] text-slate-400 mt-0.5">PDF, Word, imágenes · Arrastra o haz clic para seleccionar</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Solicitar DNI/NIE', icon: '🪪', type: 'dni' },
          { label: 'Solicitar Nota Simple', icon: '📋', type: 'nota_simple' },
          { label: 'Solicitar Tasacion', icon: '🏠', type: 'tasacion' },
        ].map((action) => (
          <button
            key={action.type}
            className="bg-white border border-slate-200 rounded-xl p-3 flex items-center gap-2 hover:border-[#1a61a6]/30 hover:bg-[#1a61a6]/3 transition-all text-left"
          >
            <span className="text-lg">{action.icon}</span>
            <span className="text-[10px] font-bold text-slate-700">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Document Requests */}
      {documentRequests.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold text-[#002446] uppercase tracking-widest">
              Solicitudes de Documentacion
            </h3>
            <div className="flex gap-2 text-[10px] text-slate-500">
              <span>{received.length} recibidos</span>
              <span>·</span>
              <span>{pending.length} pendientes</span>
            </div>
          </div>
          <div className="divide-y divide-slate-50">
            {documentRequests.map((doc) => (
              <div key={doc.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50/50">
                <span className="text-lg shrink-0">{DOCUMENT_TYPE_ICONS[doc.document_type] || '📎'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                  {doc.notes && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{doc.notes}</p>}
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    Solicitado: {doc.requested_at.slice(0, 10)}
                    {doc.received_at && ` · Recibido: ${doc.received_at.slice(0, 10)}`}
                  </p>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase shrink-0 ${STATUS_BADGE[doc.status] || 'bg-slate-100 text-slate-500'}`}>
                  {STATUS_LABELS[doc.status] || doc.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {documentRequests.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-slate-400">Sin solicitudes de documentacion</p>
          <p className="text-[10px] text-slate-300 mt-1">Usa los accesos rapidos arriba para solicitar documentos comunes</p>
        </div>
      )}
    </div>
  );
}
