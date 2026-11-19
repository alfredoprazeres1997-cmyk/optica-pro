import React, { useState } from 'react';
import {
  Check,
  Download,
  Lock,
  Plus,
  Shield,
  Users,
  X,
} from 'lucide-react';
import type {
  CurrencyCode,
  LanguageCode,
  SaasPlanId,
  UserRole,
  WorkspacePayload,
} from '../types/optica.ts';
import { formatMoney, formatShortDate } from '../utils/format.ts';

const PLANS: Array<{
  id: SaasPlanId;
  name: string;
  audience: string;
  priceAoa: number;
  limits: string[];
}> = [
  {
    id: 'gratuito',
    name: 'Gratuito',
    audience: 'Para micro-ópticas em avaliação',
    priceAoa: 0,
    limits: ['Até 50 clientes', '1 utilizador', 'Gestão básica de vendas e stock'],
  },
  {
    id: 'basico',
    name: 'Básico',
    audience: 'Para lojas independentes',
    priceAoa: 22000,
    limits: ['Até 500 clientes', '3 utilizadores', 'Receitas PDF + Stock automático'],
  },
  {
    id: 'profissional',
    name: 'Profissional',
    audience: 'Para clínicas e ópticas em crescimento',
    priceAoa: 45000,
    limits: [
      'Clientes e receitas ilimitados',
      '10 utilizadores com RBAC completo',
      'Relatórios Excel/PDF + Lembretes de consultas',
    ],
  },
  {
    id: 'empresarial',
    name: 'Empresarial',
    audience: 'Para redes multi-lojas',
    priceAoa: 95000,
    limits: [
      'Utilizadores e sucursais ilimitadas',
      'Cópias de segurança prioritárias & auditoria',
      'Suporte dedicado e API Multicaixa Express',
    ],
  },
];

export function AdminAndSaasView({
  mode,
  data,
  currency,
  onCreateStaff,
  onToggleStaff,
  onSwitchRolePreview,
  onUpdateTenant,
  onUpgradePlan,
  onDownloadBackup,
}: {
  mode: 'admin' | 'saas';
  data: WorkspacePayload;
  currency: CurrencyCode;
  onCreateStaff: (payload: {
    name: string;
    email: string;
    phone?: string;
    role: UserRole;
    specialty?: string;
    paymentMethod?: string;
    paymentDetails?: string;
  }) => Promise<void>;
  onToggleStaff: (id: number, active: boolean) => Promise<void>;
  onSwitchRolePreview: (role: UserRole) => Promise<void>;
  onUpdateTenant: (payload: Record<string, string>) => Promise<void>;
  onUpgradePlan: (plan: SaasPlanId, amount: number, method: string) => Promise<void>;
  onDownloadBackup: () => Promise<void>;
}) {
  const [staffModal, setStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '+244 ',
    role: 'funcionario' as UserRole,
    specialty: '',
    paymentMethod: 'Multicaixa Express',
    paymentDetails: '',
  });
  const [tenantForm, setTenantForm] = useState({
    name: data.tenant.name,
    nif: data.tenant.nif || '',
    phone: data.tenant.phone || '',
    address: data.tenant.address || '',
    currency: data.tenant.currency,
    language: data.tenant.language,
  });
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateStaff(staffForm);
    setStaffModal(false);
    setStaffForm({
      name: '',
      email: '',
      phone: '+244 ',
      role: 'funcionario',
      specialty: '',
      paymentMethod: 'Multicaixa Express',
      paymentDetails: '',
    });
  };

  const handleTenantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateTenant(tenantForm);
    setSavedNotice('Configurações da óptica guardadas na base de dados.');
    setTimeout(() => setSavedNotice(null), 3500);
  };

  if (mode === 'saas') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Assinatura & Planos SaaS
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Cada óptica opera em ambiente isolado com plano próprio e facturação recorrente
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-sky-700">Subscrição Activa</p>
            <h2 className="font-display text-lg font-bold text-[#0B1F3A] capitalize mt-0.5">
              Plano {data.tenant.plan} · {data.tenant.name}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Próxima renovação: {formatShortDate(data.tenant.nextBillingDate)} · Estado: Activo
            </p>
          </div>
          <div className="text-right">
            <span className="font-mono text-xs text-slate-500 block">Isolamento de Dados</span>
            <span className="font-mono text-sm font-semibold text-[#0B1F3A]">
              Tenant #{data.tenant.id} Protegido
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isCurrent = data.tenant.plan === plan.id;
            return (
              <div
                key={plan.id}
                className={`bg-white rounded-xl p-5 border flex flex-col justify-between ${
                  isCurrent ? 'border-[#0B1F3A] ring-1 ring-[#0B1F3A]' : 'border-slate-200'
                }`}
              >
                <div>
                  <h3 className="font-display text-base font-bold text-[#0B1F3A]">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{plan.audience}</p>
                  <p className="font-mono text-2xl font-bold text-[#0B1F3A] mt-4 tabular-nums">
                    {plan.priceAoa === 0
                      ? '0 Kz'
                      : `${formatMoney(plan.priceAoa, currency)}`}
                    <span className="text-xs font-sans font-normal text-slate-500">
                      /mês
                    </span>
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-600">
                    {plan.limits.map((lim) => (
                      <li key={lim} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                        <span>{lim}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  disabled={isCurrent}
                  onClick={() =>
                    onUpgradePlan(plan.id, plan.priceAoa, 'Multicaixa Express')
                  }
                  className={`mt-6 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-500 cursor-default'
                      : 'bg-[#0B1F3A] hover:bg-[#14325B] text-white'
                  }`}
                >
                  {isCurrent ? 'Plano Actual' : 'Activar Plano'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-display text-base font-bold text-[#0B1F3A]">
              Histórico de Pagamentos Recorrentes SaaS
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Referência</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4 text-right">Valor</th>
                  <th className="py-3 px-4">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.subscriptionInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className="py-3 px-4 font-mono font-medium text-[#0B1F3A]">
                      {inv.reference}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 tabular-nums">
                      {formatShortDate(inv.billingDate)}
                    </td>
                    <td className="py-3 px-4 capitalize">{inv.plan}</td>
                    <td className="py-3 px-4">{inv.paymentMethod}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">
                      {formatMoney(inv.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-emerald-700 font-medium">
                      {inv.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#0B1F3A] tracking-tight">
            Painel Administrativo & Segurança
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Níveis de acesso (RBAC), registo de actividades, cópias de segurança e moeda/idioma
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onDownloadBackup}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#0B1F3A] bg-white border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Gerar Cópia de Segurança</span>
          </button>
          <button
            onClick={() => setStaffModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Utilizador</span>
          </button>
        </div>
      </div>

      {savedNotice && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800">
          {savedNotice}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0B1F3A]" />
              <h2 className="font-display text-base font-bold text-[#0B1F3A]">
                Equipa & Níveis de Acesso
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Testar Perfil:</span>
              <select
                value={data.currentUser.role}
                onChange={(e) => onSwitchRolePreview(e.target.value as UserRole)}
                className="px-2.5 py-1 border border-slate-200 rounded-md bg-slate-50 font-medium text-[#0B1F3A]"
              >
                <option value="admin">Administrador</option>
                <option value="gerente">Gerente</option>
                <option value="funcionario">Funcionário</option>
                <option value="optometrista">Optometrista</option>
              </select>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {data.staff.map((member) => (
              <div
                key={member.id}
                className="p-4 flex items-center justify-between gap-4 text-xs"
              >
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{member.name}</p>
                  <p className="text-slate-500">
                    {member.email} · {member.specialty || 'Equipa Óptica'} · Pagamento:{' '}
                    {member.paymentMethod || 'Multicaixa Express'}
                    {member.paymentDetails ? ` (${member.paymentDetails})` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono capitalize text-[#0B1F3A] font-semibold">
                    {member.role}
                  </span>
                  <button
                    onClick={() => onToggleStaff(member.id, !member.active)}
                    className={`px-2.5 py-1 rounded border cursor-pointer ${
                      member.active
                        ? 'border-emerald-200 text-emerald-700 bg-emerald-50'
                        : 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}
                  >
                    {member.active ? 'Activo' : 'Inactivo'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <form
          onSubmit={handleTenantSubmit}
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 space-y-3 text-sm"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-[#0B1F3A]" />
            <h2 className="font-display text-base font-bold text-[#0B1F3A]">
              Configurações da Óptica & Localização
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Nome Comercial da Óptica
            </label>
            <input
              type="text"
              value={tenantForm.name}
              onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                NIF
              </label>
              <input
                type="text"
                value={tenantForm.nif}
                onChange={(e) => setTenantForm({ ...tenantForm, nif: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Telefone
              </label>
              <input
                type="text"
                value={tenantForm.phone}
                onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Moeda Padrão
              </label>
              <select
                value={tenantForm.currency}
                onChange={(e) =>
                  setTenantForm({
                    ...tenantForm,
                    currency: e.target.value as CurrencyCode,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="AOA">Kwanza (Kz)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dólar ($)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Idioma da Interface
              </label>
              <select
                value={tenantForm.language}
                onChange={(e) =>
                  setTenantForm({
                    ...tenantForm,
                    language: e.target.value as LanguageCode,
                  })
                }
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="pt">Português</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 bg-[#0B1F3A] hover:bg-[#14325B] text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Guardar Configurações
          </button>
        </form>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#0B1F3A]" />
          <h2 className="font-display text-base font-bold text-[#0B1F3A]">
            Registo de Actividades & Auditoria
          </h2>
        </div>
        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {data.activityLogs.map((log) => (
            <div
              key={log.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div>
                <span className="font-semibold text-[#0B1F3A]">{log.action}</span>
                <span className="text-slate-400 mx-1.5">·</span>
                <span className="text-slate-700">{log.details}</span>
              </div>
              <div className="text-slate-500 font-mono shrink-0">
                {log.actorName} ({log.actorRole}) · {log.module}
              </div>
            </div>
          ))}
        </div>
      </div>

      {staffModal && (
        <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#0B1F3A]">
                Adicionar Novo Utilizador
              </h3>
              <button
                onClick={() => setStaffModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleStaffSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nome Completo *
                </label>
                <input
                  required
                  type="text"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  E-mail *
                </label>
                <input
                  required
                  type="email"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nível de Acesso
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, role: e.target.value as UserRole })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="admin">Administrador</option>
                    <option value="gerente">Gerente</option>
                    <option value="funcionario">Funcionário</option>
                    <option value="optometrista">Optometrista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={staffForm.specialty}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, specialty: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Forma de Pagamento *
                  </label>
                  <select
                    value={staffForm.paymentMethod}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, paymentMethod: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Multicaixa Express">Multicaixa Express</option>
                    <option value="Transferência Bancária (IBAN)">Transferência Bancária (IBAN)</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Referência Multicaixa">Referência Multicaixa</option>
                    <option value="Cartão / Débito Recorrente">Cartão / Débito Recorrente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Nº MCX / IBAN / Referência
                  </label>
                  <input
                    type="text"
                    value={staffForm.paymentDetails}
                    onChange={(e) =>
                      setStaffForm({ ...staffForm, paymentDetails: e.target.value })
                    }
                    placeholder="Ex: 923 410 850 ou AO06..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStaffModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0B1F3A] hover:bg-[#14325B] rounded-lg cursor-pointer"
                >
                  Guardar Utilizador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
