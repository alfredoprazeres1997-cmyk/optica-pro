import React, { useMemo, useState } from 'react';
import { FileDown, Plus, Printer, Search, X } from 'lucide-react';
import type { PrescriptionRecord, UserRole, WorkspacePayload } from '../types/optica.ts';
import { formatShortDate, todayISO } from '../utils/format.ts';
import { exportPrescriptionPDF } from '../utils/exportUtils.ts';

export function PrescriptionsView({
  data,
  role,
  onCreatePrescription,
}: {
  data: WorkspacePayload;
  role: UserRole;
  onCreatePrescription: (payload: Omit<PrescriptionRecord, 'id' | 'tenantId'>) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<PrescriptionRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const canCreate = ['admin', 'gerente', 'optometrista'].includes(role);

  const [form, setForm] = useState({
    clientId: data.clients[0]?.id || 0,
    professionalName: 'Dra. Helena Mendonça',
    prescriptionDate: todayISO(),
    odSph: '-1.25',
    odCyl: '-0.50',
    odAxis: '90',
    odAdd: '+1.50',
    oeSph: '-1.50',
    oeCyl: '-0.50',
    oeAxis: '85',
    oeAdd: '+1.50',
    dp: '63 mm',
    lensType: 'Progressiva Anti-Reflexo',
    notes: '',
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data.prescriptions;
    return data.prescriptions.filter((p) => {
      const client = data.clients.find((c) => c.id === p.clientId);
      return (
        (client?.fullName || '').toLowerCase().includes(q) ||
        p.professionalName.toLowerCase().includes(q) ||
        (p.lensType || '').toLowerCase().includes(q)
      );
    });
  }, [data.prescriptions, data.clients, search]);

  const active = selected
    ? data.prescriptions.find((p) => p.id === selected.id) || selected
    : filtered[0] || null;
  const activeClient = active
    ? data.clients.find((c) => c.id === active.clientId)
    : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.clientId) return;
    setSaving(true);
    try {
      await onCreatePrescription(form);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Receitas Oftalmológicas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Prescrições clínicas OD/OE (SPH, CYL, AXIS, ADD, DP) com impressão e PDF
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setForm((prev) => ({
                ...prev,
                clientId: data.clients[0]?.id || 0,
              }));
              setModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Receita</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden no-print">
          <div className="p-4 border-b border-slate-200">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar receita por paciente ou optometrista..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[540px] overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Sem receitas registadas.
              </p>
            ) : (
              filtered.map((rx) => {
                const client = data.clients.find((c) => c.id === rx.clientId);
                const isSelected = active?.id === rx.id;
                return (
                  <button
                    key={rx.id}
                    onClick={() => setSelected(rx)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer ${
                      isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#0B1F3A]">
                        {client?.fullName || `Cliente #${rx.clientId}`}
                      </span>
                      <span className="font-mono text-slate-500 tabular-nums">
                        {formatShortDate(rx.prescriptionDate)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {rx.professionalName} · {rx.lensType || 'Receita Standard'}
                    </p>
                    <p className="font-mono text-[11px] text-slate-600 mt-1.5 tabular-nums">
                      OD {rx.odSph} ({rx.odCyl}) · OE {rx.oeSph} ({rx.oeCyl}) · DP {rx.dp}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          {!active ? (
            <p className="py-16 text-center text-sm text-slate-500">
              Seleccione uma receita para visualizar e exportar.
            </p>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <p className="text-xs font-medium text-sky-700">
                    Prescrição Oftalmológica #{active.id}
                  </p>
                  <h2 className="font-display text-xl font-bold text-[#0B1F3A] mt-0.5">
                    {activeClient?.fullName || 'Paciente'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {activeClient?.phone || '—'} · Emitida em{' '}
                    {formatShortDate(active.prescriptionDate)} · {active.professionalName}
                  </p>
                </div>

                <div className="flex items-center gap-2 no-print">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                  <button
                    onClick={() =>
                      exportPrescriptionPDF(active, activeClient, data.tenant)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>Exportar PDF</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden text-sm">
                  <thead className="bg-[#0B1F3A] text-white text-xs">
                    <tr>
                      <th className="py-2.5 px-4">Olho</th>
                      <th className="py-2.5 px-4 text-right">Esfera (SPH)</th>
                      <th className="py-2.5 px-4 text-right">Cilindro (CYL)</th>
                      <th className="py-2.5 px-4 text-right">Eixo (AXIS)</th>
                      <th className="py-2.5 px-4 text-right">Adição (ADD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs tabular-nums">
                    <tr className="bg-white">
                      <td className="py-3 px-4 font-sans font-semibold text-[#0B1F3A]">
                        Olho Direito (OD)
                      </td>
                      <td className="py-3 px-4 text-right">{active.odSph}</td>
                      <td className="py-3 px-4 text-right">{active.odCyl}</td>
                      <td className="py-3 px-4 text-right">{active.odAxis}°</td>
                      <td className="py-3 px-4 text-right">{active.odAdd || '—'}</td>
                    </tr>
                    <tr className="bg-slate-50/50">
                      <td className="py-3 px-4 font-sans font-semibold text-[#0B1F3A]">
                        Olho Esquerdo (OE)
                      </td>
                      <td className="py-3 px-4 text-right">{active.oeSph}</td>
                      <td className="py-3 px-4 text-right">{active.oeCyl}</td>
                      <td className="py-3 px-4 text-right">{active.oeAxis}°</td>
                      <td className="py-3 px-4 text-right">{active.oeAdd || '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">
                    Distância Pupilar (DP)
                  </span>
                  <span className="font-mono font-bold text-[#0B1F3A] tabular-nums">
                    {active.dp}
                  </span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">
                    Lente Recomendada
                  </span>
                  <span className="font-medium text-[#0B1F3A]">
                    {active.lensType || 'Monofocal Standard'}
                  </span>
                </div>
              </div>

              {active.notes && (
                <div className="text-xs text-slate-600 p-4 bg-sky-50/50 border border-sky-100 rounded-lg">
                  <span className="font-semibold text-[#0B1F3A] block mb-1">
                    Observações Clínicas:
                  </span>
                  {active.notes}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                Registar Receita Oftalmológica
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Paciente *
                  </label>
                  <select
                    required
                    value={form.clientId}
                    onChange={(e) =>
                      setForm({ ...form, clientId: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    {data.clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Profissional Responsável *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.professionalName}
                    onChange={(e) =>
                      setForm({ ...form, professionalName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Data *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.prescriptionDate}
                    onChange={(e) =>
                      setForm({ ...form, prescriptionDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <p className="text-xs font-bold text-[#0B1F3A]">Olho Direito (OD)</p>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">SPH</label>
                    <input
                      required
                      type="text"
                      value={form.odSph}
                      onChange={(e) => setForm({ ...form, odSph: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">CYL</label>
                    <input
                      required
                      type="text"
                      value={form.odCyl}
                      onChange={(e) => setForm({ ...form, odCyl: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">AXIS (°)</label>
                    <input
                      required
                      type="text"
                      value={form.odAxis}
                      onChange={(e) => setForm({ ...form, odAxis: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">ADD</label>
                    <input
                      type="text"
                      value={form.odAdd}
                      onChange={(e) => setForm({ ...form, odAdd: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                </div>

                <p className="text-xs font-bold text-[#0B1F3A] pt-2">Olho Esquerdo (OE)</p>
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">SPH</label>
                    <input
                      required
                      type="text"
                      value={form.oeSph}
                      onChange={(e) => setForm({ ...form, oeSph: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">CYL</label>
                    <input
                      required
                      type="text"
                      value={form.oeCyl}
                      onChange={(e) => setForm({ ...form, oeCyl: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">AXIS (°)</label>
                    <input
                      required
                      type="text"
                      value={form.oeAxis}
                      onChange={(e) => setForm({ ...form, oeAxis: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">ADD</label>
                    <input
                      type="text"
                      value={form.oeAdd}
                      onChange={(e) => setForm({ ...form, oeAdd: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-white font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Distância Pupilar (DP) *
                  </label>
                  <input
                    required
                    type="text"
                    value={form.dp}
                    onChange={(e) => setForm({ ...form, dp: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tipo de Lente
                  </label>
                  <input
                    type="text"
                    value={form.lensType}
                    onChange={(e) => setForm({ ...form, lensType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Observações
                </label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
                  {saving ? 'A guardar...' : 'Guardar Receita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
