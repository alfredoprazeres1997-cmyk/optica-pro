import React, { useState } from 'react';
import { CheckCircle2, Plus, Truck, X } from 'lucide-react';
import type { CurrencyCode, UserRole, WorkspacePayload } from '../types/optica.ts';
import { formatMoney, formatShortDate, todayISO } from '../utils/format.ts';

export function SuppliersView({
  data,
  currency,
  role,
  onCreateSupplier,
  onUpdateSupplierBalance,
}: {
  data: WorkspacePayload;
  currency: CurrencyCode;
  role: UserRole;
  onCreateSupplier: (payload: {
    name: string;
    contactPerson?: string;
    phone: string;
    email?: string;
    address?: string;
    productsSupplied?: string;
    pendingBalance?: string;
    lastPurchaseDate?: string;
  }) => Promise<void>;
  onUpdateSupplierBalance: (id: number, pendingBalance: string) => Promise<void>;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contactPerson: '',
    phone: '+244 ',
    email: '',
    address: '',
    productsSupplied: '',
    pendingBalance: '0',
    lastPurchaseDate: todayISO(),
  });

  const canManage = ['admin', 'gerente'].includes(role);
  const totalPending = data.suppliers.reduce(
    (acc, s) => acc + Number(s.pendingBalance),
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      await onCreateSupplier(form);
      setModalOpen(false);
      setForm({
        name: '',
        contactPerson: '',
        phone: '+244 ',
        email: '',
        address: '',
        productsSupplied: '',
        pendingBalance: '0',
        lastPurchaseDate: todayISO(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Gestão de Fornecedores
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Laboratórios de lentes, distribuidores de armações e valores pendentes ({formatMoney(totalPending, currency)})
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Fornecedor</span>
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Fornecedor</th>
                <th className="py-3 px-4">Contacto</th>
                <th className="py-3 px-4">Produtos Fornecidos</th>
                <th className="py-3 px-4">Última Compra</th>
                <th className="py-3 px-4 text-right">Saldo Pendente</th>
                {canManage && <th className="py-3 px-4 text-right">Acção</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.suppliers.map((sup) => {
                const pending = Number(sup.pendingBalance);
                return (
                  <tr key={sup.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Truck className="w-4 h-4 text-sky-600 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900">{sup.name}</p>
                          <p className="text-xs text-slate-500">
                            {sup.contactPerson || '—'} · {sup.address || 'Luanda'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-mono text-slate-800">{sup.phone}</p>
                      <p className="text-slate-500">{sup.email || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                      {sup.productsSupplied || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      {formatShortDate(sup.lastPurchaseDate)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums">
                      <span className={pending > 0 ? 'text-amber-700' : 'text-emerald-700'}>
                        {formatMoney(pending, currency)}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 text-right">
                        {pending > 0 ? (
                          <button
                            onClick={() => onUpdateSupplierBalance(sup.id, '0.00')}
                            className="text-xs font-semibold text-sky-700 hover:underline cursor-pointer"
                          >
                            Marcar Liquidado
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Regularizado</span>
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                Registar Fornecedor
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome da Empresa *
                </label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Pessoa de Contacto
                  </label>
                  <input
                    type="text"
                    value={form.contactPerson}
                    onChange={(e) =>
                      setForm({ ...form, contactPerson: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Telefone *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valor Pendente (Kz)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.pendingBalance}
                    onChange={(e) =>
                      setForm({ ...form, pendingBalance: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Produtos Fornecidos
                </label>
                <input
                  type="text"
                  value={form.productsSupplied}
                  onChange={(e) =>
                    setForm({ ...form, productsSupplied: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer"
                >
                  {saving ? 'A guardar...' : 'Guardar Fornecedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
