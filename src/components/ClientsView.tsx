import React, { useMemo, useState } from 'react';
import { Search, Plus, Edit3, Eye, X, UserCheck } from 'lucide-react';
import type {
  ClientRecord,
  CurrencyCode,
  WorkspacePayload,
} from '../types/optica.ts';
import { formatMoney, formatShortDate } from '../utils/format.ts';

export function ClientsView({
  data,
  currency,
  onSaveClient,
}: {
  data: WorkspacePayload;
  currency: CurrencyCode;
  onSaveClient: (payload: Partial<ClientRecord>, id?: number) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const [historyTab, setHistoryTab] = useState<'sales' | 'prescriptions' | 'appointments'>('sales');
  const [editing, setEditing] = useState<Partial<ClientRecord> | null>(null);
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.clients;
    return data.clients.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.nif || '').toLowerCase().includes(q)
    );
  }, [data.clients, search]);

  const activeClient = selectedClient
    ? data.clients.find((c) => c.id === selectedClient.id) || selectedClient
    : filtered[0] || null;

  const clientSales = useMemo(
    () => (activeClient ? data.sales.filter((s) => s.clientId === activeClient.id) : []),
    [data.sales, activeClient]
  );
  const clientPrescriptions = useMemo(
    () =>
      activeClient ? data.prescriptions.filter((p) => p.clientId === activeClient.id) : [],
    [data.prescriptions, activeClient]
  );
  const clientAppointments = useMemo(
    () =>
      activeClient ? data.appointments.filter((a) => a.clientId === activeClient.id) : [],
    [data.appointments, activeClient]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || !editing.fullName || !editing.phone) return;
    setSaving(true);
    try {
      await onSaveClient(
        {
          fullName: editing.fullName,
          phone: editing.phone,
          email: editing.email || '',
          address: editing.address || '',
          nif: editing.nif || '',
          birthDate: editing.birthDate || '',
          notes: editing.notes || '',
        },
        editing.id
      );
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Gestão de Clientes
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Fichas individuais com histórico completo de compras, consultas e receitas
          </p>
        </div>
        <button
          onClick={() =>
            setEditing({
              fullName: '',
              phone: '+244 ',
              email: '',
              address: '',
              nif: '',
              birthDate: '',
              notes: '',
            })
          }
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Registar Cliente</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome, telefone, e-mail ou NIF..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Contacto</th>
                  <th className="py-3 px-4 text-right">Compras</th>
                  <th className="py-3 px-4 text-right">Acções</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => {
                    const isSelected = activeClient?.id === client.id;
                    const countSales = data.sales.filter(
                      (s) => s.clientId === client.id
                    ).length;
                    return (
                      <tr
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{client.fullName}</p>
                          <p className="text-xs text-slate-500 truncate max-w-[220px]">
                            {client.address || 'Sem endereço'}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-mono text-xs text-slate-800 tabular-nums">
                            {client.phone}
                          </p>
                          <p className="text-xs text-slate-500 truncate max-w-[160px]">
                            {client.email || '—'}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs text-slate-700 tabular-nums">
                          {countSales}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedClient(client);
                              }}
                              title="Ver Ficha"
                              className="p-1.5 text-slate-500 hover:text-[#0B1F3A] rounded cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditing(client);
                              }}
                              title="Editar Cliente"
                              className="p-1.5 text-slate-500 hover:text-sky-700 rounded cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5">
          {!activeClient ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              Seleccione um cliente para visualizar o histórico clínico e comercial.
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-sky-700 font-medium">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Ficha do Cliente #{activeClient.id}</span>
                  </div>
                  <h2 className="font-display text-lg font-bold text-[#0B1F3A] mt-1">
                    {activeClient.fullName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeClient.phone} · {activeClient.email || 'Sem e-mail'}
                  </p>
                </div>
                <button
                  onClick={() => setEditing(activeClient)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer shrink-0"
                >
                  Editar
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs py-3 border-y border-slate-100">
                <div>
                  <span className="text-slate-400 block">Endereço</span>
                  <span className="text-slate-800 font-medium">
                    {activeClient.address || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">NIF / Nascimento</span>
                  <span className="text-slate-800 font-mono tabular-nums">
                    {activeClient.nif || '—'} · {formatShortDate(activeClient.birthDate)}
                  </span>
                </div>
              </div>

              {activeClient.notes && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {activeClient.notes}
                </p>
              )}

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setHistoryTab('sales')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    historyTab === 'sales'
                      ? 'bg-white text-[#0B1F3A] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Compras ({clientSales.length})
                </button>
                <button
                  onClick={() => setHistoryTab('prescriptions')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    historyTab === 'prescriptions'
                      ? 'bg-white text-[#0B1F3A] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Receitas ({clientPrescriptions.length})
                </button>
                <button
                  onClick={() => setHistoryTab('appointments')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    historyTab === 'appointments'
                      ? 'bg-white text-[#0B1F3A] shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Consultas ({clientAppointments.length})
                </button>
              </div>

              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                {historyTab === 'sales' &&
                  (clientSales.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Sem compras registadas.
                    </p>
                  ) : (
                    clientSales.map((s) => (
                      <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-medium text-slate-900">{s.invoiceNumber}</p>
                          <p className="text-slate-500">
                            {formatShortDate(s.saleDate)} · {s.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <p className="font-semibold text-[#0B1F3A]">
                            {formatMoney(s.total, currency)}
                          </p>
                          <p className="text-slate-500">{s.status}</p>
                        </div>
                      </div>
                    ))
                  ))}

                {historyTab === 'prescriptions' &&
                  (clientPrescriptions.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Sem receitas oftalmológicas registadas.
                    </p>
                  ) : (
                    clientPrescriptions.map((p) => (
                      <div key={p.id} className="py-2.5 text-xs space-y-1">
                        <div className="flex justify-between font-medium text-slate-900">
                          <span>{formatShortDate(p.prescriptionDate)}</span>
                          <span className="text-sky-700">{p.professionalName}</span>
                        </div>
                        <p className="font-mono text-[11px] text-slate-600 tabular-nums">
                          OD: {p.odSph} / {p.odCyl} × {p.odAxis}° · OE: {p.oeSph} / {p.oeCyl} ×{' '}
                          {p.oeAxis}° · DP {p.dp}
                        </p>
                      </div>
                    ))
                  ))}

                {historyTab === 'appointments' &&
                  (clientAppointments.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">
                      Sem consultas registadas.
                    </p>
                  ) : (
                    clientAppointments.map((a) => (
                      <div key={a.id} className="py-2.5 flex justify-between text-xs">
                        <div>
                          <p className="font-medium text-slate-900">{a.reason}</p>
                          <p className="text-slate-500">{a.professionalName}</p>
                        </div>
                        <div className="text-right font-mono tabular-nums">
                          <p className="text-slate-800">
                            {formatShortDate(a.appointmentDate)} {a.appointmentTime}
                          </p>
                          <p className="text-sky-700">{a.status}</p>
                        </div>
                      </div>
                    ))
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                {editing.id ? 'Editar Cliente' : 'Registar Novo Cliente'}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  value={editing.fullName || ''}
                  onChange={(e) => setEditing({ ...editing, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Telefone *
                  </label>
                  <input
                    required
                    type="text"
                    value={editing.phone || ''}
                    onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={editing.email || ''}
                    onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    NIF
                  </label>
                  <input
                    type="text"
                    value={editing.nif || ''}
                    onChange={(e) => setEditing({ ...editing, nif: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Data de Nascimento
                  </label>
                  <input
                    type="date"
                    value={editing.birthDate || ''}
                    onChange={(e) => setEditing({ ...editing, birthDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Endereço
                </label>
                <input
                  type="text"
                  value={editing.address || ''}
                  onChange={(e) => setEditing({ ...editing, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Observações Clínicas / Preferências
                </label>
                <textarea
                  rows={2}
                  value={editing.notes || ''}
                  onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'A guardar...' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
