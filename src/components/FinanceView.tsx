import React, { useMemo, useState } from 'react';
import { FileDown, FileSpreadsheet, Plus, X } from 'lucide-react';
import type { CurrencyCode, UserRole, WorkspacePayload } from '../types/optica.ts';
import { formatMoney, formatShortDate, todayISO } from '../utils/format.ts';
import { exportFinanceExcel, exportFinancePDF } from '../utils/exportUtils.ts';

export function FinanceView({
  data,
  currency,
  role,
  onCreateEntry,
}: {
  data: WorkspacePayload;
  currency: CurrencyCode;
  role: UserRole;
  onCreateEntry: (payload: {
    type: 'receita' | 'despesa';
    category: string;
    description: string;
    amount: string;
    entryDate: string;
    paymentMethod: string;
    status: string;
  }) => Promise<void>;
}) {
  const [period, setPeriod] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('monthly');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'despesa' as 'receita' | 'despesa',
    category: 'Fornecedores & Lentes',
    description: '',
    amount: '',
    entryDate: todayISO(),
    paymentMethod: 'Transferência Bancária',
    status: 'Confirmado',
  });

  const canManage = ['admin', 'gerente'].includes(role);
  const today = todayISO();

  const filtered = useMemo(() => {
    const now = new Date();
    return data.financialEntries.filter((e) => {
      if (period === 'all') return true;
      if (period === 'daily') return e.entryDate === today;
      if (period === 'weekly') {
        const d = new Date(e.entryDate);
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 7;
      }
      if (period === 'monthly') {
        return e.entryDate.slice(0, 7) === today.slice(0, 7);
      }
      return true;
    });
  }, [data.financialEntries, period, today]);

  const totals = useMemo(() => {
    const rev = filtered
      .filter((e) => e.type === 'receita')
      .reduce((acc, e) => acc + Number(e.amount), 0);
    const exp = filtered
      .filter((e) => e.type === 'despesa')
      .reduce((acc, e) => acc + Number(e.amount), 0);
    return { rev, exp, profit: rev - exp };
  }, [filtered]);

  const periodLabels = {
    all: 'Todo o Histórico',
    daily: 'Relatório Diário',
    weekly: 'Relatório Semanal',
    monthly: 'Relatório Mensal',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await onCreateEntry(form);
      setModalOpen(false);
      setForm((p) => ({ ...p, description: '', amount: '' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Gestão Financeira
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Controlo de receitas, despesas, apuramento de lucros e exportação contabilística
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportFinanceExcel(filtered, currency, periodLabels[period])}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>Exportar Excel</span>
          </button>
          <button
            onClick={() =>
              exportFinancePDF(filtered, data.tenant, currency, periodLabels[period])
            }
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <FileDown className="w-3.5 h-3.5 text-sky-700" />
            <span>Exportar PDF</span>
          </button>
          {canManage && (
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Receitas ({periodLabels[period]})</p>
          <p className="font-mono text-xl font-bold text-emerald-700 mt-1 tabular-nums">
            {formatMoney(totals.rev, currency)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Despesas ({periodLabels[period]})</p>
          <p className="font-mono text-xl font-bold text-red-700 mt-1 tabular-nums">
            {formatMoney(totals.exp, currency)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Lucro Líquido Estimado</p>
          <p className="font-mono text-xl font-bold text-[#0B1F3A] mt-1 tabular-nums">
            {formatMoney(totals.profit, currency)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  period === p
                    ? 'bg-white text-[#0B1F3A] shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p === 'daily'
                  ? 'Diário'
                  : p === 'weekly'
                  ? 'Semanal'
                  : p === 'monthly'
                  ? 'Mensal'
                  : 'Todos'}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {filtered.length} movimentos
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Sem movimentos financeiros neste período.
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs text-slate-600 tabular-nums">
                      {formatShortDate(entry.entryDate)}
                    </td>
                    <td className="py-3 px-4 text-xs font-semibold">
                      <span
                        className={
                          entry.type === 'receita' ? 'text-emerald-700' : 'text-red-700'
                        }
                      >
                        {entry.type === 'receita' ? 'Receita' : 'Despesa'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">{entry.category}</td>
                    <td className="py-3 px-4 text-xs text-slate-900">{entry.description}</td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {entry.paymentMethod}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs font-semibold tabular-nums">
                      <span
                        className={
                          entry.type === 'receita' ? 'text-emerald-700' : 'text-red-700'
                        }
                      >
                        {entry.type === 'receita' ? '+' : '-'}{' '}
                        {formatMoney(entry.amount, currency)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                Registar Movimento Financeiro
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tipo
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as 'receita' | 'despesa',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="receita">Receita</option>
                    <option value="despesa">Despesa</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Data
                  </label>
                  <input
                    required
                    type="date"
                    value={form.entryDate}
                    onChange={(e) => setForm({ ...form, entryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Categoria
                </label>
                <input
                  required
                  type="text"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Descrição *
                </label>
                <input
                  required
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Valor (Kz) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Método
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({ ...form, paymentMethod: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Multicaixa Express">Multicaixa Express</option>
                    <option value="Transferência Bancária">Transferência Bancária</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>
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
                  {saving ? 'A guardar...' : 'Guardar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
