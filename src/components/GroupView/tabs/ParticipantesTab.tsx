import { useState } from 'react';
import type { Case, Party, Contact, Affordability } from '../../../types';

interface Props {
  groupCases: Case[];
  allParties: Party[];
  allContacts: Contact[];
  allAffordabilities: Affordability[];
  onAddContact: (partyId: string | null, type: 'phone' | 'email', value: string) => void;
  onBlockContact: (contactId: string, reason: string) => void;
}

const ROLE_LABELS: Record<string, string> = {
  borrower: 'Deudor Principal',
  guarantor: 'Garante',
  co_borrower: 'Co-Deudor',
  legal_representative: 'Rep. Legal',
  tenant_legal: 'Inquilino Legal',
  tenant_illegal: 'Ocupante Ilegal',
  heir: 'Heredero',
};

const ROLE_COLORS: Record<string, string> = {
  borrower: 'bg-[#1a61a6]/10 text-[#1a61a6]',
  guarantor: 'bg-amber-100 text-amber-700',
  co_borrower: 'bg-purple-100 text-purple-700',
  legal_representative: 'bg-slate-100 text-slate-600',
  tenant_legal: 'bg-emerald-100 text-emerald-700',
  tenant_illegal: 'bg-red-100 text-red-700',
  heir: 'bg-slate-100 text-slate-500',
};

export default function ParticipantesTab({ groupCases, allParties, allContacts, allAffordabilities, onAddContact, onBlockContact }: Props) {
  const [expandedParty, setExpandedParty] = useState<string | null>(allParties[0]?.id || null);
  const [addingContact, setAddingContact] = useState<{ partyId: string; type: 'phone' | 'email' } | null>(null);
  const [newContactValue, setNewContactValue] = useState('');
  const [blockingContact, setBlockingContact] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');

  function getContactsForParty(partyId: string) {
    return allContacts.filter((c) => c.party_id === partyId);
  }

  function getAffordabilityForParty(partyId: string) {
    return allAffordabilities.find((a) => a.party_id === partyId);
  }

  function getCaseForParty(partyId: string) {
    return groupCases.find((c) => c.parties.some((p) => p.id === partyId));
  }

  function handleAddContact() {
    if (!addingContact || !newContactValue.trim()) return;
    onAddContact(addingContact.partyId, addingContact.type, newContactValue.trim());
    setAddingContact(null);
    setNewContactValue('');
  }

  function handleBlockContact(contactId: string) {
    if (!blockReason.trim()) return;
    onBlockContact(contactId, blockReason.trim());
    setBlockingContact(null);
    setBlockReason('');
  }

  return (
    <div className="p-5 space-y-3">
      {allParties.map((party) => {
        const contacts = getContactsForParty(party.id);
        const affordability = getAffordabilityForParty(party.id);
        const parentCase = getCaseForParty(party.id);
        const isExpanded = expandedParty === party.id;
        const phones = contacts.filter((c) => c.type === 'phone');
        const emails = contacts.filter((c) => c.type === 'email');
        const activePhones = phones.filter((c) => !c.is_blocked);
        const blockedPhones = phones.filter((c) => c.is_blocked);
        const isDeceased = affordability?.deceased === true;

        return (
          <div key={party.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-all ${
            isDeceased ? 'border-slate-300 opacity-70' : 'border-slate-200'
          }`}>
            {/* Party Header */}
            <button
              onClick={() => setExpandedParty(isExpanded ? null : party.id)}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                  isDeceased ? 'bg-slate-200 text-slate-500' : 'bg-[#1a61a6]/10 text-[#1a61a6]'
                }`}>
                  {party.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900">{party.name}</span>
                    {isDeceased && (
                      <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wide">Fallecido</span>
                    )}
                    {party.id_number && (
                      <span className="text-[9px] text-slate-400 font-mono">{party.id_number}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${ROLE_COLORS[party.role] || 'bg-slate-100 text-slate-500'}`}>
                      {ROLE_LABELS[party.role] || party.role}
                    </span>
                    {parentCase && (
                      <span className="text-[9px] text-slate-400">Exp: {parentCase.reference}</span>
                    )}
                    <span className="text-[9px] text-slate-400">
                      {activePhones.length} tel · {emails.length} email
                      {blockedPhones.length > 0 && ` · ${blockedPhones.length} bloq.`}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {activePhones.length > 0 && (
                  <span className="text-xs font-bold text-[#1a61a6]">{activePhones[0].value}</span>
                )}
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-slate-100 px-5 py-4 grid grid-cols-12 gap-5">
                {/* Left: Contacts */}
                <div className="col-span-5 space-y-4">
                  {/* Phones */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Telefonos</span>
                      <button
                        onClick={() => setAddingContact({ partyId: party.id, type: 'phone' })}
                        className="text-[9px] font-bold text-[#1a61a6] hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir
                      </button>
                    </div>
                    {phones.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">Sin telefonos</p>
                    )}
                    {phones.map((ct) => (
                      <div key={ct.id} className={`flex items-center justify-between rounded-lg px-3 py-2 mb-1.5 ${ct.is_blocked ? 'bg-red-50 border border-red-200' : 'bg-slate-50 border border-slate-100'}`}>
                        <div>
                          <span className={`text-xs font-bold ${ct.is_blocked ? 'text-red-500 line-through' : 'text-slate-800'}`}>
                            {ct.value}
                          </span>
                          {ct.is_blocked && ct.block_reason && (
                            <p className="text-[9px] text-red-500 mt-0.5">{ct.block_reason}</p>
                          )}
                          {ct.lawyer_name && (
                            <p className="text-[9px] text-slate-400">Abogado: {ct.lawyer_name}</p>
                          )}
                        </div>
                        {ct.is_blocked ? (
                          <span className="text-[8px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded uppercase">Bloqueado</span>
                        ) : (
                          <button
                            onClick={() => setBlockingContact(ct.id)}
                            className="text-[9px] text-slate-400 hover:text-red-500 transition-colors"
                            title="Bloquear numero"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}

                    {/* Block dialog */}
                    {blockingContact && phones.some((p) => p.id === blockingContact) && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-2">
                        <p className="text-[9px] font-bold text-red-700 mb-1.5">Motivo de bloqueo</p>
                        <input
                          type="text"
                          value={blockReason}
                          onChange={(e) => setBlockReason(e.target.value)}
                          placeholder="Ej: Número no válido, petición del deudor..."
                          className="w-full text-[10px] border border-red-200 rounded px-2 py-1.5 bg-white mb-2 focus:outline-none focus:border-red-400"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleBlockContact(blockingContact)} className="text-[9px] font-bold bg-red-600 text-white px-2.5 py-1 rounded hover:bg-red-700 transition-colors">Bloquear</button>
                          <button onClick={() => { setBlockingContact(null); setBlockReason(''); }} className="text-[9px] font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                        </div>
                      </div>
                    )}

                    {/* Add contact form */}
                    {addingContact?.partyId === party.id && addingContact?.type === 'phone' && (
                      <div className="bg-[#1a61a6]/5 border border-[#1a61a6]/20 rounded-lg p-3 mt-2">
                        <p className="text-[9px] font-bold text-[#1a61a6] mb-1.5">Nuevo telefono</p>
                        <input
                          type="tel"
                          value={newContactValue}
                          onChange={(e) => setNewContactValue(e.target.value)}
                          placeholder="+34 600 000 000"
                          className="w-full text-[10px] border border-slate-200 rounded px-2 py-1.5 bg-white mb-2 focus:outline-none focus:border-[#1a61a6]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
                        />
                        <div className="flex gap-2">
                          <button onClick={handleAddContact} className="text-[9px] font-bold bg-[#1a61a6] text-white px-2.5 py-1 rounded hover:bg-[#002446] transition-colors">Guardar</button>
                          <button onClick={() => { setAddingContact(null); setNewContactValue(''); }} className="text-[9px] font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Emails */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Emails</span>
                      <button
                        onClick={() => setAddingContact({ partyId: party.id, type: 'email' })}
                        className="text-[9px] font-bold text-[#1a61a6] hover:underline flex items-center gap-1"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Añadir
                      </button>
                    </div>
                    {emails.length === 0 && (
                      <p className="text-[10px] text-slate-400 italic">Sin emails</p>
                    )}
                    {emails.map((ct) => (
                      <div key={ct.id} className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 mb-1.5">
                        <svg className="w-3 h-3 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] text-slate-700">{ct.value}</span>
                      </div>
                    ))}
                    {addingContact?.partyId === party.id && addingContact?.type === 'email' && (
                      <div className="bg-[#1a61a6]/5 border border-[#1a61a6]/20 rounded-lg p-3 mt-2">
                        <p className="text-[9px] font-bold text-[#1a61a6] mb-1.5">Nuevo email</p>
                        <input
                          type="email"
                          value={newContactValue}
                          onChange={(e) => setNewContactValue(e.target.value)}
                          placeholder="nombre@dominio.com"
                          className="w-full text-[10px] border border-slate-200 rounded px-2 py-1.5 bg-white mb-2 focus:outline-none focus:border-[#1a61a6]"
                          onKeyDown={(e) => e.key === 'Enter' && handleAddContact()}
                        />
                        <div className="flex gap-2">
                          <button onClick={handleAddContact} className="text-[9px] font-bold bg-[#1a61a6] text-white px-2.5 py-1 rounded hover:bg-[#002446] transition-colors">Guardar</button>
                          <button onClick={() => { setAddingContact(null); setNewContactValue(''); }} className="text-[9px] font-bold text-slate-500 hover:text-slate-700">Cancelar</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Affordability + Skiptracing */}
                <div className="col-span-7 grid grid-cols-2 gap-4">
                  {/* Affordability */}
                  <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Asequibilidad</p>
                    {affordability ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Estado civil:</span>
                          <span className="font-bold text-slate-700 capitalize">{affordability.marital_status}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Situacion laboral:</span>
                          <span className="font-bold text-slate-700 capitalize">{affordability.employment_status}</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Ing. mensual:</span>
                          <span className="font-bold text-slate-700">
                            {affordability.avg_monthly_income ? `${affordability.avg_monthly_income.toLocaleString('es-ES')} EUR` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Menores en inmueble:</span>
                          <span className={`font-bold ${affordability.minors_in_collateral === 'yes' ? 'text-red-600' : 'text-slate-700'} capitalize`}>
                            {affordability.minors_in_collateral}
                          </span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-500">Discapacitados:</span>
                          <span className={`font-bold ${affordability.disabled_in_collateral === 'yes' ? 'text-red-600' : 'text-slate-700'} capitalize`}>
                            {affordability.disabled_in_collateral}
                          </span>
                        </div>
                        {affordability.heirs_identified !== 'no' && (
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">Herederos:</span>
                            <span className="font-bold text-amber-600 capitalize">{affordability.heirs_identified}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[10px] text-slate-400 italic">Sin datos de asequibilidad</p>
                    )}
                  </div>

                  {/* Skiptracing + Deceased + Notes */}
                  <div className="space-y-3">
                    {/* Deceased flag */}
                    {isDeceased && (
                      <div className="bg-slate-100 rounded-xl border border-slate-300 p-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-wide">Fallecido</p>
                          {affordability?.heir_details && (
                            <p className="text-[10px] text-slate-500">{affordability.heir_details}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Skiptracing */}
                    <div className="bg-amber-50 rounded-xl border border-amber-200 p-3">
                      <p className="text-[9px] font-bold text-amber-700 uppercase tracking-widest mb-2">Skiptracing</p>
                      {(groupCases.flatMap((c) => c.skiptrace_requests || []).filter((r) => r.party_id === party.id)).length === 0 ? (
                        <p className="text-[10px] text-amber-600/80 italic mb-2">Sin solicitudes previas</p>
                      ) : (
                        groupCases.flatMap((c) => c.skiptrace_requests || [])
                          .filter((r) => r.party_id === party.id)
                          .map((req) => (
                            <div key={req.id} className="flex items-center justify-between mb-1.5">
                              <span className="text-[9px] text-amber-700">{req.requested_at.slice(0, 10)}</span>
                              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                req.status === 'completado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>{req.status}</span>
                            </div>
                          ))
                      )}
                      <button className="w-full text-[9px] font-bold text-amber-700 border border-amber-300 rounded-lg py-1.5 hover:bg-amber-100 transition-colors">
                        Solicitar Skiptracing
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {allParties.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm text-slate-400">Sin participantes registrados</p>
        </div>
      )}
    </div>
  );
}
