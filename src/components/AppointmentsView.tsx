import React, { useMemo, useState } from 'react';
import { Bell, Calendar, CheckCircle2, Plus, X } from 'lucide-react';
import type { WorkspacePayload } from '../types/optica.ts';
import { formatShortDate, todayISO } from '../utils/format.ts';

const STATUSES = ['Todas', 'Agendada', 'Confirmada', 'Em Atendimento', 'Concluída', 'Cancelada'];

export function AppointmentsView({
  data,
  onCreateAppointment,
  onUpdateAppointment,
}: {
  data: WorkspacePayload;
  onCreateAppointment: (payload: {
    clientId?: number | null;
    clientName: string;
    clientPhone?: string;
    professionalName: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    notes?: string;
  }) => Promise<void>;
  onUpdateAppointment: (
    id: number,
    payload: { status?: string; reminderSent?: boolean }
  ) => Promise<void>;
}) {
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientId: data.clients[0]?.id || 0,
    professionalName: 'Dra. Helena Mendonça',
    appointmentDate: todayISO(),
    appointmentTime: '11:00',
    reason: 'Exame completo de optometria',
    notes: '',
  });

  const filtered = useMemo(() => {
    if (statusFilter === 'Todas') return data.appointments;
    return data.appointments.filter((a) => a.status === statusFilter);
  }, [data.appointments, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = data.clients.find((c) => c.id === form.clientId);
    setSaving(true);
    try {
      await onCreateAppointment({
        clientId: client?.id || null,
        clientName: client?.fullName || 'Novo Paciente',
        clientPhone: client?.phone || '',
        professionalName: form.professionalName,
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        reason: form.reason,
        notes: form.notes,
      });
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const sendReminder = async (id: number, clientName: string) => {
    await onUpdateAppointment(id, { reminderSent: true });
    setToast(`Lembrete de consulta registado e enviado para ${clientName}.`);
    setTimeout(() => setToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Marcação de Consultas
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Agenda clínica de optometria, acompanhamento de estado e envio de lembretes
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Consulta</span>
        </button>
      </div>

      {toast && (
        <div className="p-3.5 rounded-lg bg-sky-50 border border-sky-200 text-xs font-medium text-[#0B1F3A] flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-1 overflow-x-auto">
          {STATUSES.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                statusFilter === st
                  ? 'bg-[#0B1F3A] text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium text-slate-500 border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Data & Hora</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Profissional</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Lembrete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Nenhuma consulta neste estado.
                  </td>
                </tr>
              ) : (
                filtered.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs text-[#0B1F3A] font-semibold tabular-nums whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-600" />
                        <span>
                          {formatShortDate(apt.appointmentDate)} · {apt.appointmentTime}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <p className="font-medium text-slate-900">{apt.clientName}</p>
                      <p className="text-slate-500 font-mono">{apt.clientPhone || '—'}</p>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700">
                      {apt.professionalName}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{apt.reason}</td>
                    <td className="py-3 px-4">
                      <select
                        value={apt.status}
                        onChange={(e) =>
                          onUpdateAppointment(apt.id, { status: e.target.value })
                        }
                        className="px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-white font-medium text-slate-800"
                      >
                        {STATUSES.filter((s) => s !== 'Todas').map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {apt.reminderSent ? (
                        <span className="text-xs text-emerald-700 font-medium">
                          Enviado
                        </span>
                      ) : (
                        <button
                          onClick={() => sendReminder(apt.id, apt.clientName)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md cursor-pointer"
                        >
                          <Bell className="w-3 h-3" />
                          <span>Enviar Lembrete</span>
                        </button>
                      )}
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
                Nova Consulta de Optometria
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
                  Cliente *
                </label>
                <select
                  required
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: Number(e.target.value) })}
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
                  Optometrista / Profissional *
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Data *
                  </label>
                  <input
                    required
                    type="date"
                    value={form.appointmentDate}
                    onChange={(e) =>
                      setForm({ ...form, appointmentDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Horário *
                  </label>
                  <input
                    required
                    type="time"
                    value={form.appointmentTime}
                    onChange={(e) =>
                      setForm({ ...form, appointmentTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Motivo da Consulta *
                </label>
                <input
                  required
                  type="text"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
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
                  {saving ? 'A agendar...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
